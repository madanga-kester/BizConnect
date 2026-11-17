using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace Mabiz.IntegrationTests;

[Collection(PostgresApiCollection.Name)]
public sealed class Stage6MessagingApiTests(PostgresApiFactory factory)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task DirectMessages_ArePrivate_Idempotent_TrackUnreadReadAndBlock()
    {
        var aliceSetup = await NewUserAsync("msgalice"); using var alice = aliceSetup.Client;
        var bobSetup = await NewUserAsync("msgbob"); using var bob = bobSetup.Client;
        var outsiderSetup = await NewUserAsync("msgoutsider"); using var outsider = outsiderSetup.Client;

        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/api/v1/conversations")).StatusCode);
        var started = await alice.PostAsJsonAsync("/api/v1/conversations", new { participantId = bobSetup.Id, firstMessage = "Hello Bob" });
        Assert.Equal(HttpStatusCode.Created, started.StatusCode);
        var conversation = await started.Content.ReadFromJsonAsync<ConversationDto>(Json);
        Assert.NotNull(conversation);
        Assert.Equal("direct", conversation.Kind);
        Assert.Equal("Hello Bob", conversation.LastMessage);

        Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/api/v1/conversations/{conversation.Id}/messages")).StatusCode);
        var bobInbox = await bob.GetFromJsonAsync<PageDto<ConversationDto>>("/api/v1/conversations", Json);
        Assert.NotNull(bobInbox);
        Assert.Single(bobInbox.Items);
        Assert.Equal(1, bobInbox.Items[0].UnreadCount);

        Assert.Equal(HttpStatusCode.NoContent, (await bob.PostAsync($"/api/v1/conversations/{conversation.Id}/read", null)).StatusCode);
        bobInbox = await bob.GetFromJsonAsync<PageDto<ConversationDto>>("/api/v1/conversations", Json);
        Assert.Equal(0, bobInbox!.Items.Single().UnreadCount);

        var clientMessageId = Guid.NewGuid();
        var body = new { clientMessageId, text = "Can you share the details?" };
        var first = await alice.PostAsJsonAsync($"/api/v1/conversations/{conversation.Id}/messages", body);
        var retry = await alice.PostAsJsonAsync($"/api/v1/conversations/{conversation.Id}/messages", body);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, retry.StatusCode);
        var sent = await first.Content.ReadFromJsonAsync<MessageDto>(Json);
        var retried = await retry.Content.ReadFromJsonAsync<MessageDto>(Json);
        Assert.Equal(sent!.Id, retried!.Id);
        Assert.Equal(clientMessageId.ToString(), sent.ClientMessageId);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await alice.PostAsJsonAsync($"/api/v1/conversations/{conversation.Id}/messages", new { clientMessageId = Guid.NewGuid(), text = "   " })).StatusCode);
        var messages = await bob.GetFromJsonAsync<PageDto<MessageDto>>($"/api/v1/conversations/{conversation.Id}/messages?page=1&pageSize=20", Json);
        Assert.NotNull(messages);
        Assert.Equal(2, messages.Total);
        Assert.Equal("Hello Bob", messages.Items[0].Text);
        Assert.Equal("delivered", messages.Items[1].Status);
        bobInbox = await bob.GetFromJsonAsync<PageDto<ConversationDto>>("/api/v1/conversations", Json);
        Assert.Equal(1, bobInbox!.Items.Single().UnreadCount);

        Assert.Equal(HttpStatusCode.NoContent, (await bob.PostAsync($"/api/v1/conversations/{conversation.Id}/block", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await alice.PostAsJsonAsync($"/api/v1/conversations/{conversation.Id}/messages", new { clientMessageId = Guid.NewGuid(), text = "Blocked" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await alice.DeleteAsync($"/api/v1/conversations/{conversation.Id}/block")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await bob.DeleteAsync($"/api/v1/conversations/{conversation.Id}/block")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await alice.PostAsync($"/api/v1/conversations/{conversation.Id}/archive", null)).StatusCode);
        var aliceInbox = await alice.GetFromJsonAsync<PageDto<ConversationDto>>("/api/v1/conversations", Json);
        Assert.Empty(aliceInbox!.Items);
        Assert.Equal(HttpStatusCode.Created, (await bob.PostAsJsonAsync($"/api/v1/conversations/{conversation.Id}/messages", new { clientMessageId = Guid.NewGuid(), text = "Following up after the archive." })).StatusCode);
        aliceInbox = await alice.GetFromJsonAsync<PageDto<ConversationDto>>("/api/v1/conversations", Json);
        Assert.Contains(aliceInbox!.Items, x => x.Id == conversation.Id && !x.IsArchived);
    }

    [Fact]
    public async Task PrivateUser_DirectConversationRequiresFollowingTarget()
    {
        var requesterSetup = await NewUserAsync("msgprivateask"); using var requester = requesterSetup.Client;
        var privateSetup = await NewUserAsync("msgprivateuser"); using var privateUser = privateSetup.Client;
        var outsiderSetup = await NewUserAsync("msgprivateout"); using var outsider = outsiderSetup.Client;
        Assert.Equal(HttpStatusCode.NoContent, (await requester.PostAsync($"/api/v1/users/{privateSetup.Id}/follow", null)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await privateUser.PatchAsJsonAsync("/api/v1/users/me", new { privateProfile = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await outsider.PostAsJsonAsync("/api/v1/conversations", new { participantId = privateSetup.Id })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await requester.PostAsJsonAsync("/api/v1/conversations", new { participantId = privateSetup.Id })).StatusCode);
    }

    [Fact]
    public async Task BusinessEnquiry_IsLinkedToPublishedItem_AndEditorCanRespondButViewerCannotAccess()
    {
        var ownerSetup = await NewUserAsync("msgowner"); using var owner = ownerSetup.Client;
        var buyerSetup = await NewUserAsync("msgbuyer"); using var buyer = buyerSetup.Client;
        var editorSetup = await NewUserAsync("msgeditor"); using var editor = editorSetup.Client;
        var viewerSetup = await NewUserAsync("msgviewer"); using var viewer = viewerSetup.Client;
        var outsiderSetup = await NewUserAsync("msgoutsider2"); using var outsider = outsiderSetup.Client;
        var business = await CreateBusinessAsync(owner, "Message Enquiry Shop", "public");
        var productResponse = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", new
        {
            title = "Stage 6 enquiry product", description = "Published for enquiries", category = "Retail", subcategory = "Test",
            status = "published", priceKsh = 250m, sku = $"S6-{Guid.NewGuid():N}"[..14], stockQuantity = 5, inStock = true
        });
        Assert.Equal(HttpStatusCode.Created, productResponse.StatusCode);
        var product = await productResponse.Content.ReadFromJsonAsync<CatalogDto>(Json);
        Assert.NotNull(product);

        await InviteAndAcceptAsync(owner, editor, editorSetup.Email, business.Id, "Editor");
        await InviteAndAcceptAsync(owner, viewer, viewerSetup.Email, business.Id, "Viewer");

        var started = await buyer.PostAsJsonAsync("/api/v1/conversations", new { businessId = business.Id, catalogItemId = product.Id, firstMessage = "Is this available?" });
        Assert.Equal(HttpStatusCode.Created, started.StatusCode);
        var conversation = await started.Content.ReadFromJsonAsync<ConversationDto>(Json);
        Assert.NotNull(conversation);
        Assert.Equal("business", conversation.Kind);
        Assert.Equal(business.Id, conversation.BusinessId);
        Assert.Equal(product.Id, conversation.CatalogItemId);
        Assert.Equal(product.Title, conversation.CatalogItemTitle);

        var buyerStartAgain = await buyer.PostAsJsonAsync("/api/v1/conversations", new { businessId = business.Id, catalogItemId = product.Id });
        Assert.Equal(HttpStatusCode.Created, buyerStartAgain.StatusCode);
        var sameConversation = await buyerStartAgain.Content.ReadFromJsonAsync<ConversationDto>(Json);
        Assert.Equal(conversation.Id, sameConversation!.Id);

        var editorInbox = await editor.GetFromJsonAsync<PageDto<ConversationDto>>("/api/v1/conversations", Json);
        Assert.NotNull(editorInbox);
        Assert.Contains(editorInbox.Items, x => x.Id == conversation.Id && x.CatalogItemTitle == product.Title);
        Assert.Equal(HttpStatusCode.NotFound, (await viewer.GetAsync($"/api/v1/conversations/{conversation.Id}/messages")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/api/v1/conversations/{conversation.Id}/messages")).StatusCode);

        var sent = await editor.PostAsJsonAsync($"/api/v1/conversations/{conversation.Id}/messages", new { clientMessageId = Guid.NewGuid(), text = "Yes, it is available." });
        Assert.Equal(HttpStatusCode.Created, sent.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await editor.PostAsync($"/api/v1/conversations/{conversation.Id}/read", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await viewer.PostAsJsonAsync($"/api/v1/conversations/{conversation.Id}/messages", new { clientMessageId = Guid.NewGuid(), text = "Viewer should not respond" })).StatusCode);
        var buyerMessages = await buyer.GetFromJsonAsync<PageDto<MessageDto>>($"/api/v1/conversations/{conversation.Id}/messages", Json);
        Assert.Equal(2, buyerMessages!.Total);
        Assert.Equal("Yes, it is available.", buyerMessages.Items[1].Text);
    }

    [Fact]
    public async Task SignalRNegotiation_RequiresAuthenticatedSession_AndConversationGroupRequiresMembership()
    {
        using var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsync("/hubs/messaging/negotiate?negotiateVersion=1", new StringContent(""))).StatusCode);
        var userSetup = await NewUserAsync("msghub"); using var user = userSetup.Client;
        var response = await user.PostAsync("/hubs/messaging/negotiate?negotiateVersion=1", new StringContent(""));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await user.GetAsync($"/api/v1/conversations/{Guid.NewGuid()}/messages")).StatusCode);
    }

    private async Task<(HttpClient Client, UserDto User, string Id, string Email)> NewUserAsync(string prefix)
    {
        var username = $"{prefix}{Guid.NewGuid():N}"[..Math.Min(prefix.Length + 10, 28)];
        var email = $"{username}@example.test";
        var client = factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = username, username, email, phone = (string?)null, password = "P@ssword12345", county = "Nairobi", town = "Nairobi", interests = new[] { "Retail" }, avatar = (string?)null
        });
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);
        var user = await register.Content.ReadFromJsonAsync<UserDto>(Json);
        Assert.NotNull(user);
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { identifier = email, password = "P@ssword12345" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var session = await login.Content.ReadFromJsonAsync<AuthDto>(Json);
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
        return (client, user, user.Id, email);
    }

    private static async Task<BusinessDto> CreateBusinessAsync(HttpClient client, string name, string visibility)
    {
        var response = await client.PostAsJsonAsync("/api/v1/businesses", new
        {
            name, businessType = "hybrid", category = "Retail", subcategory = "Goods", description = "Messaging test business", about = "Business enquiry fixture",
            founder = "Owner", originStory = "Created for test", county = "Nairobi", town = "Nairobi", neighbourhood = "Westlands", serviceAreas = new[] { "Nairobi" },
            phone = "0712345678", whatsapp = "0712345678", email = (string?)null, website = (string?)null, priceRange = "KSh KSh", operatingHours = "Mon-Fri 9-5",
            logo = (string?)null, cover = (string?)null, visibility, socialLinks = new Dictionary<string, string>()
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<BusinessDto>(Json))!;
    }

    private static async Task InviteAndAcceptAsync(HttpClient owner, HttpClient recipient, string email, string businessId, string role)
    {
        var invite = await owner.PostAsJsonAsync($"/api/v1/businesses/{businessId}/invitations", new { email, role });
        Assert.Equal(HttpStatusCode.Created, invite.StatusCode);
        var invitation = await invite.Content.ReadFromJsonAsync<InvitationDto>(Json);
        Assert.NotNull(invitation);
        var accepted = await recipient.PostAsync($"/api/v1/businesses/{businessId}/invitations/{invitation.Id}/accept", null);
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
    }

    private sealed record UserDto(string Id, string Username, string Name, string? Email);
    private sealed record AuthDto(string AccessToken);
    private sealed record BusinessDto(string Id, string Name);
    private sealed record CatalogDto(string Id, string Title, string Status);
    private sealed record InvitationDto(string Id);
    private sealed record ConversationDto(string Id, string Kind, string? BusinessId, string? BusinessName, string? CatalogItemId, string? CatalogItemTitle, string? ParticipantId, string ParticipantName, string LastMessage, DateTimeOffset? LastMessageAt, int UnreadCount, bool IsArchived, bool IsBlocked, string? BlockedByUserId, DateTimeOffset CreatedAt);
    private sealed record MessageDto(string Id, string ConversationId, string SenderUserId, string SenderName, string Text, DateTimeOffset CreatedAt, string Status, string ClientMessageId);
    private sealed record PageDto<T>(List<T> Items, int Total, int Page, int PageSize);
}
