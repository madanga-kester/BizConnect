using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BizConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BizConnect.IntegrationTests;

[Collection(PostgresApiCollection.Name)]
public sealed class Stage3BusinessApiTests(PostgresApiFactory factory)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task BusinessCreationAndUpdate_SupportMultipleBusinessesAndEnforcePrivateAccess()
    {
        var (ownerClient, owner) = await NewUserAsync("owner");
        var (outsiderClient, _) = await NewUserAsync("outsider");
        using (ownerClient)
        using (outsiderClient)
        {
            var first = await CreateBusinessAsync(ownerClient, "Nairobi Ceramics");
            var second = await CreateBusinessAsync(ownerClient, "Coastline Catering", "private");
            Assert.Equal(HttpStatusCode.Created, first.Response.StatusCode);
            Assert.Equal(HttpStatusCode.Created, second.Response.StatusCode);
            var firstBusiness = await first.Response.Content.ReadFromJsonAsync<BusinessResult>(JsonOptions);
            var secondBusiness = await second.Response.Content.ReadFromJsonAsync<BusinessResult>(JsonOptions);
            Assert.NotNull(firstBusiness);
            Assert.NotNull(secondBusiness);
            Assert.Equal(owner.Id, firstBusiness.OwnerId);
            Assert.Equal("Owner", firstBusiness.CurrentUserRole);
            Assert.NotEqual(firstBusiness.Id, secondBusiness!.Id);

            var listing = await ownerClient.GetFromJsonAsync<PageResult<BusinessResult>>("/api/v1/businesses", JsonOptions);
            Assert.Equal(2, listing!.Total);
            Assert.Equal(2, listing.Items.Count);

            var publicBusiness = await outsiderClient.GetAsync($"/api/v1/businesses/{firstBusiness.Id}");
            Assert.Equal(HttpStatusCode.OK, publicBusiness.StatusCode);
            var privateBusiness = await outsiderClient.GetAsync($"/api/v1/businesses/{secondBusiness.Id}");
            Assert.Equal(HttpStatusCode.NotFound, privateBusiness.StatusCode);
            var anonymous = factory.CreateClient();
            using (anonymous)
                Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/v1/businesses/{secondBusiness.Id}")).StatusCode);

            var updated = await ownerClient.PatchAsJsonAsync($"/api/v1/businesses/{firstBusiness.Id}", new { description = "Updated ceramics description", town = "Westlands" });
            Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
            var updatedProfile = await updated.Content.ReadFromJsonAsync<BusinessResult>(JsonOptions);
            Assert.Equal("Updated ceramics description", updatedProfile!.Description);
            Assert.Equal("Westlands", updatedProfile.Town);
            Assert.Equal(HttpStatusCode.NotFound, (await outsiderClient.PatchAsJsonAsync($"/api/v1/businesses/{secondBusiness.Id}", new { description = "Intrusion" })).StatusCode);

            var activity = await ownerClient.GetFromJsonAsync<PageResult<ActivityResult>>($"/api/v1/businesses/{firstBusiness.Id}/activity", JsonOptions);
            Assert.NotNull(activity);
            Assert.Contains(activity.Items, item => item.EventType == "business.created");
            Assert.Contains(activity.Items, item => item.EventType == "business.updated");
            Assert.Equal(HttpStatusCode.NoContent, (await ownerClient.DeleteAsync($"/api/v1/businesses/{secondBusiness.Id}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await ownerClient.GetAsync($"/api/v1/businesses/{secondBusiness.Id}")).StatusCode);
        }
    }

    [Fact]
    public async Task Invitations_RolesAndRemoval_AreRecipientBoundAndBackendEnforced()
    {
        var (ownerClient, _) = await NewUserAsync("teamowner");
        var (adminClient, admin) = await NewUserAsync("teamadmin");
        var (editorClient, editor) = await NewUserAsync("teameditor");
        var (outsiderClient, outsider) = await NewUserAsync("teamoutsider");
        using (ownerClient)
        using (adminClient)
        using (editorClient)
        using (outsiderClient)
        {
            var created = await CreateBusinessAsync(ownerClient, "Team Test Business", "private");
            var business = (await created.Response.Content.ReadFromJsonAsync<BusinessResult>(JsonOptions))!;
            var inviteAdmin = await InviteAsync(ownerClient, business.Id, admin.Email!, "Admin");
            Assert.Equal(HttpStatusCode.Created, inviteAdmin.Response.StatusCode);
            var invite = (await inviteAdmin.Response.Content.ReadFromJsonAsync<InvitationResult>(JsonOptions))!;
            Assert.Equal(HttpStatusCode.Conflict, (await InviteAsync(ownerClient, business.Id, admin.Email!, "Admin")).Response.StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await outsiderClient.PostAsync($"/api/v1/businesses/{business.Id}/invitations/{invite.Id}/accept", null)).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await adminClient.PostAsync($"/api/v1/businesses/{business.Id}/invitations/{invite.Id}/accept", null)).StatusCode);

            Assert.Equal(HttpStatusCode.Created, (await InviteAsync(adminClient, business.Id, editor.Email!, "Editor")).Response.StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await InviteAsync(adminClient, business.Id, "unknown@example.test", "Admin")).Response.StatusCode);
            var pendingForEditor = await editorClient.GetFromJsonAsync<PageResult<InvitationResult>>("/api/v1/businesses/me/invitations", JsonOptions);
            Assert.Single(pendingForEditor!.Items);
            var editorInvite = pendingForEditor.Items[0];
            Assert.Equal(HttpStatusCode.OK, (await editorClient.PostAsync($"/api/v1/businesses/{business.Id}/invitations/{editorInvite.Id}/accept", null)).StatusCode);

            Assert.Equal(HttpStatusCode.OK, (await editorClient.PatchAsJsonAsync($"/api/v1/businesses/{business.Id}", new { description = "editor edit" })).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await adminClient.PatchAsJsonAsync($"/api/v1/businesses/{business.Id}", new { description = "admin edit" })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await adminClient.PatchAsJsonAsync($"/api/v1/businesses/{business.Id}/members/{editor.Id}/role", new { role = "Admin" })).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await adminClient.PatchAsJsonAsync($"/api/v1/businesses/{business.Id}/members/{editor.Id}/role", new { role = "Viewer" })).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await editorClient.GetAsync($"/api/v1/businesses/{business.Id}")).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await editorClient.GetAsync($"/api/v1/businesses/{business.Id}/members")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await editorClient.PatchAsJsonAsync($"/api/v1/businesses/{business.Id}", new { description = "viewer must not edit" })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await adminClient.DeleteAsync($"/api/v1/businesses/{business.Id}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await editorClient.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/invitations", new { email = "absent@example.test", role = "Viewer" })).StatusCode);

            var ownerInvitesEditorEmail = await InviteAsync(ownerClient, business.Id, outsider.Email, "Viewer");
            Assert.Equal(HttpStatusCode.Created, ownerInvitesEditorEmail.Response.StatusCode);
            var cancelled = (await ownerInvitesEditorEmail.Response.Content.ReadFromJsonAsync<InvitationResult>(JsonOptions))!;
            Assert.Equal(HttpStatusCode.NoContent, (await ownerClient.DeleteAsync($"/api/v1/businesses/{business.Id}/invitations/{cancelled.Id}")).StatusCode);

            Assert.Equal(HttpStatusCode.NoContent, (await adminClient.DeleteAsync($"/api/v1/businesses/{business.Id}/members/{editor.Id}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await editorClient.GetAsync($"/api/v1/businesses/{business.Id}")).StatusCode);
            var members = await ownerClient.GetFromJsonAsync<PageResult<MemberResult>>($"/api/v1/businesses/{business.Id}/members", JsonOptions);
            Assert.Equal(2, members!.Total);
        }
    }

    [Fact]
    public async Task OwnershipTransfer_RequiresRecipientAcceptanceAndRecordsAudit()
    {
        var (oldOwnerClient, oldOwner) = await NewUserAsync("transferowner");
        var (newOwnerClient, newOwner) = await NewUserAsync("transferee");
        var (outsiderClient, outsider) = await NewUserAsync("transferoutsider");
        using (oldOwnerClient)
        using (newOwnerClient)
        using (outsiderClient)
        {
            var created = await CreateBusinessAsync(oldOwnerClient, "Ownership Transfer Business", "private");
            var business = (await created.Response.Content.ReadFromJsonAsync<BusinessResult>(JsonOptions))!;
            Assert.Equal(HttpStatusCode.NotFound, (await outsiderClient.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/ownership-transfers", new { newOwnerEmail = newOwner.Email })).StatusCode);
            var request = await oldOwnerClient.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/ownership-transfers", new { newOwnerEmail = newOwner.Email });
            Assert.Equal(HttpStatusCode.Created, request.StatusCode);
            var transfer = (await request.Content.ReadFromJsonAsync<TransferResult>(JsonOptions))!;
            var pendingForOwner = await oldOwnerClient.GetFromJsonAsync<List<TransferResult>>("/api/v1/businesses/me/ownership-transfers", JsonOptions);
            Assert.Contains(pendingForOwner!, item => item.Id == transfer.Id);
            var pendingForRecipient = await newOwnerClient.GetFromJsonAsync<List<TransferResult>>("/api/v1/businesses/me/ownership-transfers", JsonOptions);
            Assert.Contains(pendingForRecipient!, item => item.Id == transfer.Id);
            Assert.Equal(oldOwner.Id, transfer.FromUserId);
            Assert.Equal(newOwner.Email, transfer.ToEmail);
            Assert.Equal(HttpStatusCode.Conflict, (await oldOwnerClient.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/ownership-transfers", new { newOwnerEmail = outsider.Email })).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await outsiderClient.PostAsync($"/api/v1/businesses/{business.Id}/ownership-transfers/{transfer.Id}/accept", null)).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await newOwnerClient.PostAsync($"/api/v1/businesses/{business.Id}/ownership-transfers/{transfer.Id}/accept", null)).StatusCode);
            Assert.Equal(HttpStatusCode.Conflict, (await newOwnerClient.PostAsync($"/api/v1/businesses/{business.Id}/ownership-transfers/{transfer.Id}/accept", null)).StatusCode);
            var oldOwnerView = await oldOwnerClient.GetFromJsonAsync<BusinessResult>($"/api/v1/businesses/{business.Id}", JsonOptions);
            var newOwnerView = await newOwnerClient.GetFromJsonAsync<BusinessResult>($"/api/v1/businesses/{business.Id}", JsonOptions);
            Assert.Equal(newOwner.Id, newOwnerView!.OwnerId);
            Assert.Equal("Owner", newOwnerView.CurrentUserRole);
            Assert.Equal("Admin", oldOwnerView!.CurrentUserRole);
            Assert.Equal(HttpStatusCode.OK, (await oldOwnerClient.PatchAsJsonAsync($"/api/v1/businesses/{business.Id}", new { description = "Previous owner remains admin" })).StatusCode);
            var activity = await newOwnerClient.GetFromJsonAsync<PageResult<ActivityResult>>($"/api/v1/businesses/{business.Id}/activity", JsonOptions);
            Assert.Contains(activity!.Items, item => item.EventType == "ownership.transferred");
        }
    }

    [Fact]
    public async Task ConcurrentDuplicateInvitations_EnforceUniquePendingInvitation()
    {
        var (ownerClient, _) = await NewUserAsync("raceowner");
        var (recipientClient, recipient) = await NewUserAsync("racerecipient");
        using (ownerClient)
        using (recipientClient)
        {
            var created = await CreateBusinessAsync(ownerClient, "Invitation Race Business", "private");
            Assert.Equal(HttpStatusCode.Created, created.Response.StatusCode);
            var business = (await created.Response.Content.ReadFromJsonAsync<BusinessResult>(JsonOptions))!;

            var attempts = await Task.WhenAll(
                InviteAsync(ownerClient, business.Id, recipient.Email!, "Viewer"),
                InviteAsync(ownerClient, business.Id, recipient.Email!, "Viewer"));

            Assert.Single(attempts.Where(x => x.Response.StatusCode == HttpStatusCode.Created));
            Assert.Single(attempts.Where(x => x.Response.StatusCode == HttpStatusCode.Conflict));
            var invitations = await ownerClient.GetFromJsonAsync<PageResult<InvitationResult>>($"/api/v1/businesses/{business.Id}/invitations", JsonOptions);
            Assert.NotNull(invitations);
            Assert.Single(invitations.Items.Where(x => x.Status == "pending"));
            var activity = await ownerClient.GetFromJsonAsync<PageResult<ActivityResult>>($"/api/v1/businesses/{business.Id}/activity", JsonOptions);
            Assert.Single(activity!.Items.Where(x => x.EventType == "team.invited"));
        }
    }

    [Fact]
    public async Task InvitationsAndTransfers_CanBeDeclinedAndExpiredRecordsCannotBeReplayed()
    {
        var (ownerClient, _) = await NewUserAsync("lifecycleowner");
        var (recipientClient, recipient) = await NewUserAsync("lifecyclerecipient");
        using (ownerClient)
        using (recipientClient)
        {
            var created = await CreateBusinessAsync(ownerClient, "Lifecycle Business", "private");
            var business = (await created.Response.Content.ReadFromJsonAsync<BusinessResult>(JsonOptions))!;
            var inviteResponse = await InviteAsync(ownerClient, business.Id, recipient.Email!, "Viewer");
            var invitation = (await inviteResponse.Response.Content.ReadFromJsonAsync<InvitationResult>(JsonOptions))!;
            Assert.Equal(HttpStatusCode.NoContent, (await recipientClient.PostAsync($"/api/v1/businesses/{business.Id}/invitations/{invitation.Id}/decline", null)).StatusCode);
            Assert.Equal(HttpStatusCode.Conflict, (await recipientClient.PostAsync($"/api/v1/businesses/{business.Id}/invitations/{invitation.Id}/accept", null)).StatusCode);

            var expiringResponse = await InviteAsync(ownerClient, business.Id, recipient.Email!, "Viewer");
            var expiring = (await expiringResponse.Response.Content.ReadFromJsonAsync<InvitationResult>(JsonOptions))!;
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var row = await db.BusinessInvitations.SingleAsync(x => x.Id == Guid.Parse(expiring.Id));
                row.ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1);
                await db.SaveChangesAsync();
            }
            Assert.Equal(HttpStatusCode.Conflict, (await recipientClient.PostAsync($"/api/v1/businesses/{business.Id}/invitations/{expiring.Id}/accept", null)).StatusCode);

            var transferResponse = await ownerClient.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/ownership-transfers", new { newOwnerEmail = recipient.Email });
            var transfer = (await transferResponse.Content.ReadFromJsonAsync<TransferResult>(JsonOptions))!;
            Assert.Equal(HttpStatusCode.NoContent, (await recipientClient.PostAsync($"/api/v1/businesses/{business.Id}/ownership-transfers/{transfer.Id}/decline", null)).StatusCode);
            Assert.Equal(HttpStatusCode.Conflict, (await recipientClient.PostAsync($"/api/v1/businesses/{business.Id}/ownership-transfers/{transfer.Id}/accept", null)).StatusCode);

            var cancellableResponse = await ownerClient.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/ownership-transfers", new { newOwnerEmail = recipient.Email });
            var cancellable = (await cancellableResponse.Content.ReadFromJsonAsync<TransferResult>(JsonOptions))!;
            Assert.Equal(HttpStatusCode.NotFound, (await recipientClient.PostAsync($"/api/v1/businesses/{business.Id}/ownership-transfers/{cancellable.Id}/cancel", null)).StatusCode);
            Assert.Equal(HttpStatusCode.NoContent, (await ownerClient.PostAsync($"/api/v1/businesses/{business.Id}/ownership-transfers/{cancellable.Id}/cancel", null)).StatusCode);
            Assert.Equal(HttpStatusCode.Conflict, (await recipientClient.PostAsync($"/api/v1/businesses/{business.Id}/ownership-transfers/{cancellable.Id}/accept", null)).StatusCode);
        }
    }

    private async Task<(HttpClient Client, TestUser User)> NewUserAsync(string prefix)
    {
        var username = $"{prefix}{Guid.NewGuid():N}"[..Math.Min(prefix.Length + 10, 28)];
        var client = factory.CreateClient();
        var registration = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = username, username, email = $"{username}@example.test", phone = (string?)null,
            password = "P@ssword12345", county = "Nairobi", town = "Nairobi", interests = new[] { "Retail" }, avatar = (string?)null
        });
        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);
        var registered = (await registration.Content.ReadFromJsonAsync<UserResult>(JsonOptions))!;
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { identifier = registered.Email, password = "P@ssword12345" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var session = (await login.Content.ReadFromJsonAsync<AuthResult>(JsonOptions))!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
        return (client, new TestUser(registered.Id, registered.Email!, username));
    }

    private static async Task<(HttpResponseMessage Response, string Id)> CreateBusinessAsync(HttpClient client, string name, string visibility = "public")
    {
        var response = await client.PostAsJsonAsync("/api/v1/businesses", new
        {
            name, businessType = "hybrid", category = "Food", subcategory = "Local goods",
            description = "Fresh locally made products", about = "About this business", founder = "Founder",
            originStory = "Started locally", county = "Nairobi", town = "Nairobi", neighbourhood = "Westlands",
            serviceAreas = new[] { "Westlands", "Parklands" }, phone = "0712345678", whatsapp = "0712345678",
            email = (string?)null, website = (string?)null, priceRange = "KSh KSh", operatingHours = "Mon-Fri 9-5",
            logo = (string?)null, cover = (string?)null, visibility, socialLinks = new Dictionary<string, string>()
        });
        return (response, string.Empty);
    }

    private static async Task<(HttpResponseMessage Response, string Id)> InviteAsync(HttpClient client, string businessId, string email, string role = "Viewer") =>
        (await client.PostAsJsonAsync($"/api/v1/businesses/{businessId}/invitations", new { email, role }), string.Empty);

    private sealed record TestUser(string Id, string Email, string Username);
    private sealed record AuthResult(UserResult User, string AccessToken, string? RefreshToken, DateTimeOffset ExpiresAt);
    private sealed record UserResult(string Id, string Username, string Name, string? Email, string? Phone, string Bio, string County, string Town, bool PrivateProfile, bool EmailVerified);
    private sealed record BusinessResult(string Id, string OwnerId, string Slug, string Name, string Description, string Town, string? CurrentUserRole);
    private sealed record InvitationResult(string Id, string BusinessId, string BusinessName, string InvitedUserId, string InvitedEmail, string Role, string Status, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt, string InvitedByUserId, string InvitedByName);
    private sealed record TransferResult(string Id, string BusinessId, string BusinessName, string FromUserId, string FromName, string ToUserId, string ToEmail, string Status, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt);
    private sealed record MemberResult(string UserId, string Role, DateTimeOffset JoinedAt, string DisplayName, string? Email, string? Avatar);
    private sealed record ActivityResult(string Id, string BusinessId, string ActorUserId, string ActorName, string EventType, string Summary, DateTimeOffset CreatedAt);
    private sealed record PageResult<T>(List<T> Items, int Total, int Page, int PageSize);
}
