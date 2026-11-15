using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace BizConnect.IntegrationTests;

[Collection(PostgresApiCollection.Name)]
public sealed class Stage7NotificationApiTests(PostgresApiFactory factory)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task MessageNotifications_ArePrivate_Idempotent_ReadableAndDismissible()
    {
        var senderSetup = await NewUserAsync("notsender"); using var sender = senderSetup.Client;
        var recipientSetup = await NewUserAsync("notrecipient"); using var recipient = recipientSetup.Client;
        var outsiderSetup = await NewUserAsync("notoutsider"); using var outsider = outsiderSetup.Client;

        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/api/v1/notifications")).StatusCode);
        var createdConversation = await sender.PostAsJsonAsync("/api/v1/conversations", new { participantId = recipientSetup.Id });
        Assert.Equal(HttpStatusCode.Created, createdConversation.StatusCode);
        var conversation = await createdConversation.Content.ReadFromJsonAsync<ConversationDto>(Json);
        Assert.NotNull(conversation);
        var request = new { clientMessageId = Guid.NewGuid(), text = "Hello without a push-body copy" };
        Assert.Equal(HttpStatusCode.Created, (await sender.PostAsJsonAsync($"/api/v1/conversations/{conversation.Id}/messages", request)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await sender.PostAsJsonAsync($"/api/v1/conversations/{conversation.Id}/messages", request)).StatusCode);

        var recipientInbox = await recipient.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications?page=1&pageSize=20", Json);
        Assert.NotNull(recipientInbox);
        var messageNotification = Assert.Single(recipientInbox.Items);
        Assert.Equal("message", messageNotification.Type);
        Assert.Equal("conversation", messageNotification.TargetType);
        Assert.Equal(conversation.Id, messageNotification.ConversationId);
        Assert.DoesNotContain("Hello without a push-body copy", messageNotification.Body, StringComparison.Ordinal);
        Assert.Empty((await sender.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications", Json))!.Items);
        Assert.Empty((await outsider.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications", Json))!.Items);
        Assert.Equal(HttpStatusCode.NotFound, (await outsider.PostAsync($"/api/v1/notifications/{messageNotification.Id}/read", null)).StatusCode);
        Assert.Equal(1, (await recipient.GetFromJsonAsync<UnreadCountDto>("/api/v1/notifications/unread-count", Json))!.Count);

        Assert.Equal(HttpStatusCode.NoContent, (await recipient.PostAsync($"/api/v1/notifications/{messageNotification.Id}/read", null)).StatusCode);
        Assert.Equal(0, (await recipient.GetFromJsonAsync<UnreadCountDto>("/api/v1/notifications/unread-count", Json))!.Count);
        Assert.Equal(HttpStatusCode.NoContent, (await recipient.DeleteAsync($"/api/v1/notifications/{messageNotification.Id}")).StatusCode);
        Assert.Empty((await recipient.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications", Json))!.Items);
    }

    [Fact]
    public async Task NotificationPreferences_FilterEvents_AndPushTokensAreMaskedAndScoped()
    {
        var senderSetup = await NewUserAsync("notprefsender"); using var sender = senderSetup.Client;
        var recipientSetup = await NewUserAsync("notprefrecipient"); using var recipient = recipientSetup.Client;
        var original = await recipient.GetFromJsonAsync<PreferencesDto>("/api/v1/users/me/notification-preferences", Json);
        Assert.NotNull(original);
        Assert.True(original.Messages);
        Assert.Equal(HttpStatusCode.OK, (await recipient.PatchAsJsonAsync("/api/v1/users/me/notification-preferences", new { messages = false, pushEnabled = true })).StatusCode);
        var prefs = await recipient.GetFromJsonAsync<PreferencesDto>("/api/v1/users/me/notification-preferences", Json);
        Assert.False(prefs!.Messages);
        Assert.True(prefs.PushEnabled);

        var token = "ExponentPushToken[ABCDEFGHIJKLMNOPQRST123456]";
        var registration = await recipient.PostAsJsonAsync("/api/v1/users/me/devices", new
        {
            deviceIdentifier = $"install-{Guid.NewGuid():N}", platform = "android", deviceName = "test handset", pushToken = token
        });
        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);
        var registrationJson = await registration.Content.ReadAsStringAsync();
        Assert.DoesNotContain(token, registrationJson, StringComparison.Ordinal);
        Assert.Contains("hasPushToken", registrationJson, StringComparison.OrdinalIgnoreCase);
        var devices = await recipient.GetFromJsonAsync<List<DeviceDto>>("/api/v1/users/me/devices", Json);
        Assert.NotNull(devices);
        Assert.True(Assert.Single(devices).HasPushToken);
        Assert.Empty((await sender.GetFromJsonAsync<List<DeviceDto>>("/api/v1/users/me/devices", Json))!);

        var conversationResponse = await sender.PostAsJsonAsync("/api/v1/conversations", new { participantId = recipientSetup.Id, firstMessage = "This should be filtered" });
        Assert.Equal(HttpStatusCode.Created, conversationResponse.StatusCode);
        Assert.Empty((await recipient.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications", Json))!.Items);
    }

    [Fact]
    public async Task LikeCommentReplyAndFollow_CreateSeparateRecipientNotifications()
    {
        var authorSetup = await NewUserAsync("notauthor"); using var author = authorSetup.Client;
        var actorSetup = await NewUserAsync("notactor"); using var actor = actorSetup.Client;
        var postResponse = await author.PostAsJsonAsync("/api/v1/posts", new { text = "A notification test post" });
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);
        var post = await postResponse.Content.ReadFromJsonAsync<JsonElement>(Json);
        var postId = post.GetProperty("id").GetGuid();

        Assert.Equal(HttpStatusCode.NoContent, (await actor.PostAsync($"/api/v1/posts/{postId}/likes", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await actor.PostAsync($"/api/v1/posts/{postId}/likes", null)).StatusCode);
        var authorList = await author.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications", Json);
        Assert.Equal("like", Assert.Single(authorList!.Items).Type);
        Assert.Equal(HttpStatusCode.NoContent, (await actor.DeleteAsync($"/api/v1/posts/{postId}/likes")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await actor.PostAsync($"/api/v1/posts/{postId}/likes", null)).StatusCode);
        authorList = await author.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications", Json);
        Assert.Equal(2, authorList!.Total);

        var commentResponse = await actor.PostAsJsonAsync($"/api/v1/posts/{postId}/comments", new { text = "private body does not enter push" });
        Assert.Equal(HttpStatusCode.Created, commentResponse.StatusCode);
        var comment = await commentResponse.Content.ReadFromJsonAsync<JsonElement>(Json);
        var commentId = comment.GetProperty("id").GetGuid();
        authorList = await author.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications", Json);
        Assert.Contains(authorList!.Items, x => x.Type == "comment");
        var replyResponse = await author.PostAsJsonAsync($"/api/v1/comments/{commentId}/replies", new { text = "reply" });
        Assert.Equal(HttpStatusCode.Created, replyResponse.StatusCode);
        var actorList = await actor.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications", Json);
        Assert.Contains(actorList!.Items, x => x.Type == "reply");

        Assert.Equal(HttpStatusCode.NoContent, (await actor.PostAsync($"/api/v1/users/{authorSetup.Id}/follow", null)).StatusCode);
        actorList = await author.GetFromJsonAsync<PageDto<NotificationDto>>("/api/v1/notifications", Json);
        Assert.Contains(actorList!.Items, x => x.Type == "follow");
    }

    private async Task<(HttpClient Client, string Id)> NewUserAsync(string prefix)
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
        return (client, user.Id);
    }

    private sealed record UserDto(string Id);
    private sealed record AuthDto(string AccessToken);
    private sealed record NotificationDto(string Id, string Type, string? ActorUserId, string? ActorName, string Title, string Body, string TargetType, string? TargetId, string? BusinessId, string? PostId, string? ConversationId, string? CatalogItemId, DateTimeOffset CreatedAt, DateTimeOffset? ReadAt, bool Read);
    private sealed record PageDto<T>(List<T> Items, int Total, int Page, int PageSize);
    private sealed record UnreadCountDto(int Count);
    private sealed record PreferencesDto(bool InAppEnabled, bool PushEnabled, bool Messages, bool Likes, bool Comments, bool NewFollowers, bool BusinessTeamActivity, bool BusinessUpdates);
    private sealed record DeviceDto(string Id, string DeviceIdentifier, string Platform, string? DeviceName, bool HasPushToken, DateTimeOffset CreatedAt, DateTimeOffset LastSeenAt);
    private sealed record ConversationDto(string Id);
}
