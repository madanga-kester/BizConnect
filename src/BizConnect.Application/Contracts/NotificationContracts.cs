namespace BizConnect.Application.Contracts;

public sealed record NotificationResponse(
    string Id,
    string Type,
    string? ActorUserId,
    string? ActorName,
    string Title,
    string Body,
    string TargetType,
    string? TargetId,
    string? BusinessId,
    string? PostId,
    string? ConversationId,
    string? CatalogItemId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReadAt,
    bool Read);

public sealed record NotificationPageResponse(IReadOnlyList<NotificationResponse> Items, int Total, int Page, int PageSize);
public sealed record NotificationUnreadCountResponse(int Count);

public sealed record NotificationPreferencesResponse(
    bool InAppEnabled,
    bool PushEnabled,
    bool Messages,
    bool Likes,
    bool Comments,
    bool NewFollowers,
    bool BusinessTeamActivity,
    bool BusinessUpdates);

public sealed record NotificationPreferencesUpdateRequest
{
    public bool? InAppEnabled { get; init; }
    public bool? PushEnabled { get; init; }
    public bool? Messages { get; init; }
    public bool? Likes { get; init; }
    public bool? Comments { get; init; }
    public bool? NewFollowers { get; init; }
    public bool? BusinessTeamActivity { get; init; }
    public bool? BusinessUpdates { get; init; }
}

/// <summary>Internal event input. EventKey must identify the persisted source event, not an HTTP attempt.</summary>
public sealed record NotificationEventRequest(
    Guid ActorUserId,
    IReadOnlyCollection<Guid> RecipientUserIds,
    string Type,
    string Title,
    string Body,
    string TargetType,
    Guid? TargetId,
    string EventKey,
    Guid? BusinessId = null,
    Guid? PostId = null,
    Guid? ConversationId = null,
    Guid? CatalogItemId = null);
