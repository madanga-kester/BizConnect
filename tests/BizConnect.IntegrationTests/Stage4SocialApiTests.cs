using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BizConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BizConnect.IntegrationTests;

[Collection(PostgresApiCollection.Name)]
public sealed class Stage4SocialApiTests(PostgresApiFactory factory)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private const string Password = "P@ssword12345";

    [Fact]
    public async Task PersonalPosts_EnforceOwnershipPrivacyAndModeration_AndSupportEngagementAndPolls()
    {
        var aliceSetup = await NewUserAsync("socialalice"); using var alice = aliceSetup.Client; var aliceId = aliceSetup.Id;
        var bobSetup = await NewUserAsync("socialbob"); using var bob = bobSetup.Client; var bobId = bobSetup.Id;

        var created = await CreatePostAsync(alice, new { text = "photo post", kind = "image", media = new[] { new { mediaType = "image", url = "https://cdn.example.test/image.jpg", altText = "sample" } } });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var body = await created.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var postId = body.GetProperty("id").GetGuid();
        Assert.StartsWith("socialalice", body.GetProperty("publisher").GetProperty("username").GetString());
        Assert.Equal("https://cdn.example.test/image.jpg", body.GetProperty("media")[0].GetProperty("url").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, (await CreatePostAsync(alice, new { text = "bad", media = new[] { new { mediaType = "image", url = "/device/photo.jpg" } } })).StatusCode);

        Assert.Equal(HttpStatusCode.Forbidden, (await bob.PatchAsJsonAsync($"/api/v1/posts/{postId}", new { text = "not yours" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await alice.PatchAsJsonAsync($"/api/v1/posts/{postId}", new { text = "edited" })).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await bob.PostAsync($"/api/v1/posts/{postId}/likes", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await bob.PostAsync($"/api/v1/posts/{postId}/likes", null)).StatusCode);
        var likedPost = await alice.GetFromJsonAsync<JsonElement>($"/api/v1/posts/{postId}", JsonOptions);
        Assert.Equal(1, likedPost.GetProperty("likeCount").GetInt32());
        Assert.Equal(HttpStatusCode.NoContent, (await bob.DeleteAsync($"/api/v1/posts/{postId}/likes")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await bob.DeleteAsync($"/api/v1/posts/{postId}/likes")).StatusCode);

        var commentResponse = await bob.PostAsJsonAsync($"/api/v1/posts/{postId}/comments", new { text = "root comment" });
        Assert.Equal(HttpStatusCode.Created, commentResponse.StatusCode);
        var comment = await commentResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var commentId = comment.GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.Forbidden, (await alice.PatchAsJsonAsync($"/api/v1/comments/{commentId}", new { text = "cannot edit Bob's comment" })).StatusCode);
        var replyResponse = await alice.PostAsJsonAsync($"/api/v1/comments/{commentId}/replies", new { text = "reply" });
        Assert.Equal(HttpStatusCode.Created, replyResponse.StatusCode);
        var rootList = await alice.GetFromJsonAsync<JsonElement>($"/api/v1/posts/{postId}/comments", JsonOptions);
        Assert.Equal(1, rootList.GetProperty("items").GetArrayLength());
        Assert.Equal(1, rootList.GetProperty("items")[0].GetProperty("replyCount").GetInt32());
        Assert.Equal(HttpStatusCode.OK, (await bob.PatchAsJsonAsync($"/api/v1/comments/{commentId}", new { text = "edited by author" })).StatusCode);

        var badPoll = await alice.PostAsJsonAsync($"/api/v1/posts/{postId}/polls", new { question = "Choose", options = new[] { "Yes", " yes " } });
        Assert.Equal(HttpStatusCode.BadRequest, badPoll.StatusCode);
        var pollResponse = await alice.PostAsJsonAsync($"/api/v1/posts/{postId}/polls", new { question = "Choose", options = new[] { "Yes", "No" } });
        Assert.Equal(HttpStatusCode.Created, pollResponse.StatusCode);
        var poll = await pollResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var pollId = poll.GetProperty("id").GetGuid();
        var yesId = poll.GetProperty("options")[0].GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.Conflict, (await alice.PostAsJsonAsync($"/api/v1/posts/{postId}/polls", new { question = "Second", options = new[] { "One", "Two" } })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await bob.PostAsJsonAsync($"/api/v1/polls/{pollId}/votes", new { optionId = yesId })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await bob.PostAsJsonAsync($"/api/v1/polls/{pollId}/votes", new { optionId = yesId })).StatusCode);
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var stored = await db.Polls.SingleAsync(x => x.Id == pollId);
            stored.ClosesAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.Conflict, (await alice.PostAsJsonAsync($"/api/v1/polls/{pollId}/votes", new { optionId = yesId })).StatusCode);
        var embedded = await alice.GetFromJsonAsync<JsonElement>($"/api/v1/posts/{postId}", JsonOptions);
        Assert.Equal(pollId, embedded.GetProperty("poll").GetProperty("id").GetGuid());

        Assert.Equal(HttpStatusCode.NoContent, (await bob.PostAsync($"/api/v1/users/{aliceId}/follow", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await bob.PostAsync($"/api/v1/users/{aliceId}/follow", null)).StatusCode);
        var follow = await bob.GetFromJsonAsync<JsonElement>($"/api/v1/users/{aliceId}/follow", JsonOptions);
        Assert.True(follow.GetProperty("following").GetBoolean());
        Assert.Equal(HttpStatusCode.NoContent, (await bob.DeleteAsync($"/api/v1/users/{aliceId}/follow")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await bob.DeleteAsync($"/api/v1/users/{aliceId}/follow")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await bob.PostAsync($"/api/v1/moderation/hidden-posts/{postId}", null)).StatusCode);
        var feedAfterHide = await bob.GetFromJsonAsync<JsonElement>("/api/v1/feed/for-you", JsonOptions);
        Assert.DoesNotContain(feedAfterHide.GetProperty("items").EnumerateArray(), x => x.GetProperty("id").GetGuid() == postId);
        Assert.Equal(HttpStatusCode.NoContent, (await alice.PostAsync($"/api/v1/moderation/blocks/{bobId}", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await bob.GetAsync($"/api/v1/posts/{postId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await bob.GetAsync($"/api/v1/comments/{commentId}/replies")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await alice.PatchAsJsonAsync("/api/v1/users/me", new { privateProfile = true })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await alice.GetAsync($"/api/v1/users/{aliceId}/posts")).StatusCode);
        Assert.NotEqual(HttpStatusCode.OK, (await bob.GetAsync($"/api/v1/users/{aliceId}/posts")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await alice.DeleteAsync($"/api/v1/posts/{postId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await bob.GetAsync($"/api/v1/polls/{pollId}")).StatusCode);
    }

    [Fact]
    public async Task CurrentUserRoutes_ReturnSelfPostsAndRelationshipListsWithProfileCounts()
    {
        var aliceSetup = await NewUserAsync("selfroutesalice"); using var alice = aliceSetup.Client; var aliceId = aliceSetup.Id;
        var bobSetup = await NewUserAsync("selfroutesbob"); using var bob = bobSetup.Client; var bobId = bobSetup.Id;
        var postResponse = await CreatePostAsync(alice, new { text = "self route post" });
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);
        var postId = (await postResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions)).GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.NoContent, (await bob.PostAsync($"/api/v1/users/{aliceId}/follow", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await alice.PostAsync($"/api/v1/users/{bobId}/follow", null)).StatusCode);

        var followers = await alice.GetFromJsonAsync<JsonElement>("/api/v1/users/me/followers", JsonOptions);
        var following = await alice.GetFromJsonAsync<JsonElement>("/api/v1/users/me/following", JsonOptions);
        Assert.Contains(followers.GetProperty("items").EnumerateArray(), item => item.GetProperty("userId").GetGuid() == bobId);
        Assert.Contains(following.GetProperty("items").EnumerateArray(), item => item.GetProperty("userId").GetGuid() == bobId);

        var profile = await alice.GetFromJsonAsync<JsonElement>("/api/v1/users/me", JsonOptions);
        Assert.Equal(1, profile.GetProperty("followers").GetInt32());
        Assert.Equal(1, profile.GetProperty("following").GetInt32());
        var ownPosts = await alice.GetFromJsonAsync<JsonElement>("/api/v1/posts", JsonOptions);
        Assert.Contains(ownPosts.GetProperty("items").EnumerateArray(), item => item.GetProperty("id").GetGuid() == postId);
    }

    [Fact]
    public async Task BusinessPublishing_AllowsOwnerAdminEditorAndDeniesViewer_AndPrivateBusinessPostsStayPrivate()
    {
        var ownerSetup = await NewUserAsync("pubowner"); using var owner = ownerSetup.Client;
        var adminSetup = await NewUserAsync("pubadmin"); using var admin = adminSetup.Client; var adminEmail = adminSetup.Email;
        var editorSetup = await NewUserAsync("pubeditor"); using var editor = editorSetup.Client; var editorEmail = editorSetup.Email;
        var viewerSetup = await NewUserAsync("pubviewer"); using var viewer = viewerSetup.Client; var viewerEmail = viewerSetup.Email;
        var outsiderSetup = await NewUserAsync("puboutsider"); using var outsider = outsiderSetup.Client;
        var businessResponse = await CreateBusinessAsync(owner, "Stage4 Publishing", "private");
        Assert.Equal(HttpStatusCode.Created, businessResponse.StatusCode);
        var business = await businessResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var businessId = business.GetProperty("id").GetGuid();
        await AddMemberAsync(owner, businessId, admin, adminEmail, "Admin");
        await AddMemberAsync(owner, businessId, editor, editorEmail, "Editor");
        await AddMemberAsync(owner, businessId, viewer, viewerEmail, "Viewer");

        foreach (var client in new[] { owner, admin, editor })
        {
            var response = await CreatePostAsync(client, new { text = "authorized business post", businessId });
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
            Assert.Equal(businessId, json.GetProperty("publisher").GetProperty("business").GetProperty("id").GetGuid());
        }
        Assert.Equal(HttpStatusCode.Forbidden, (await CreatePostAsync(viewer, new { text = "denied", businessId })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/api/v1/businesses/{businessId}/posts")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/api/v1/businesses/{businessId}/posts")).StatusCode);
    }

    [Fact]
    public async Task FeedKeysetPages_AreStableAndDoNotRepeatPosts()
    {
        var authorSetup = await NewUserAsync("feedauthor"); using var author = authorSetup.Client;
        for (var i = 0; i < 4; i++)
            Assert.Equal(HttpStatusCode.Created, (await CreatePostAsync(author, new { text = $"keyset-{i}" })).StatusCode);

        var seen = new HashSet<Guid>();
        string? cursor = null;
        do
        {
            var url = "/api/v1/feed/for-you?limit=2" + (cursor is null ? string.Empty : "&cursor=" + Uri.EscapeDataString(cursor));
            var page = await author.GetFromJsonAsync<JsonElement>(url, JsonOptions);
            foreach (var item in page.GetProperty("items").EnumerateArray().Where(x => x.GetProperty("text").GetString()?.StartsWith("keyset-", StringComparison.Ordinal) == true)) Assert.True(seen.Add(item.GetProperty("id").GetGuid()), "A feed post was repeated across keyset pages.");
            cursor = page.TryGetProperty("nextCursor", out var next) && next.ValueKind == JsonValueKind.String ? next.GetString() : null;
        } while (cursor is not null);
        Assert.Equal(4, seen.Count);
    }

    private async Task<(HttpClient Client, Guid Id, string Email)> NewUserAsync(string prefix)
    {
        var username = $"{prefix}{Guid.NewGuid():N}"[..Math.Min(prefix.Length + 10, 28)];
        var email = $"{username}@example.test";
        var client = factory.CreateClient();
        var registration = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = username, username, email, phone = (string?)null, password = Password,
            county = "Nairobi", town = "Nairobi", interests = new[] { "Retail" }, avatar = (string?)null
        });
        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);
        var user = await registration.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var id = user.GetProperty("id").GetGuid();
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { identifier = email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var auth = await login.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.GetProperty("accessToken").GetString());
        return (client, id, email);
    }

    private static Task<HttpResponseMessage> CreatePostAsync(HttpClient client, object request) => client.PostAsJsonAsync("/api/v1/posts", request);

    private static Task<HttpResponseMessage> CreateBusinessAsync(HttpClient client, string name, string visibility) => client.PostAsJsonAsync("/api/v1/businesses", new
    {
        name, businessType = "hybrid", category = "Food", subcategory = "Local goods", description = "Fresh local products",
        about = "About this business", founder = "Founder", originStory = "Started locally", county = "Nairobi", town = "Nairobi",
        neighbourhood = "Westlands", serviceAreas = new[] { "Westlands" }, phone = "0712345678", whatsapp = "0712345678",
        email = (string?)null, website = (string?)null, priceRange = "KSh KSh", operatingHours = "Mon-Fri 9-5",
        logo = (string?)null, cover = (string?)null, visibility, socialLinks = new Dictionary<string, string>()
    });

    private static async Task AddMemberAsync(HttpClient owner, Guid businessId, HttpClient member, string email, string role)
    {
        var inviteResponse = await owner.PostAsJsonAsync($"/api/v1/businesses/{businessId}/invitations", new { email, role });
        Assert.Equal(HttpStatusCode.Created, inviteResponse.StatusCode);
        var invite = await inviteResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        Assert.Equal(HttpStatusCode.OK, (await member.PostAsync($"/api/v1/businesses/{businessId}/invitations/{invite.GetProperty("id").GetGuid()}/accept", null)).StatusCode);
    }
}
