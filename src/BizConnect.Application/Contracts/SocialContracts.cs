using System.ComponentModel.DataAnnotations;

namespace BizConnect.Application.Contracts;

public sealed record MediaReferenceRequest
{
    [Required, RegularExpression("^(image|video)$")] public string MediaType { get; init; } = "image";
    [Required, StringLength(2048)] public string Url { get; init; } = string.Empty;
    [StringLength(500)] public string? AltText { get; init; }
}
public sealed record CreatePostRequest
{
    [Required, RegularExpression("^(text|image|video|product|announcement)$")] public string Kind { get; init; } = "text";
    [StringLength(5000)] public string Text { get; init; } = string.Empty;
    [RegularExpression("^(public|followers|private)$")] public string Audience { get; init; } = "public";
    public bool Discoverable { get; init; } = true;
    public bool AllowComments { get; init; } = true;
    [StringLength(200)] public string? Location { get; init; }
    public Guid? BusinessId { get; init; }
    [StringLength(10000)] public string? ProductJson { get; init; }
    public IReadOnlyList<MediaReferenceRequest> Media { get; init; } = [];
}
public sealed record UpdatePostRequest
{
    [RegularExpression("^(text|image|video|product|announcement)$")] public string? Kind { get; init; }
    [StringLength(5000)] public string? Text { get; init; }
    [RegularExpression("^(public|followers|private)$")] public string? Audience { get; init; }
    public bool? Discoverable { get; init; }
    public bool? AllowComments { get; init; }
    [StringLength(200)] public string? Location { get; init; }
    [StringLength(10000)] public string? ProductJson { get; init; }
    public IReadOnlyList<MediaReferenceRequest>? Media { get; init; }
}
public sealed record PostDto(Guid Id, Guid AuthorUserId, Guid? BusinessId, string Kind, string Audience, bool Discoverable, bool AllowComments, string? Location, string Text, string? ProductJson, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, IReadOnlyList<MediaReferenceDto> Media, int LikeCount, int CommentCount, bool ViewerLiked, Guid? PollId, PostPublisherDto Publisher, PollDto? Poll);
public sealed record PostPublisherDto(Guid UserId, string Name, string Username, string? Avatar, BusinessPublisherDto? Business);
public sealed record BusinessPublisherDto(Guid Id, string Name, string Slug, string? Logo, string? Cover);
public sealed record MediaReferenceDto(Guid Id, string MediaType, string Url, string? AltText, int SortOrder);
public sealed record CursorPage<T>(IReadOnlyList<T> Items, string? NextCursor);
public sealed record LikeDto(Guid UserId, string DisplayName, DateTimeOffset CreatedAt);
public sealed record CommentRequest { [Required, StringLength(2000, MinimumLength = 1)] public string Text { get; init; } = string.Empty; }
public sealed record CommentDto(Guid Id, Guid PostId, Guid AuthorUserId, Guid? ParentCommentId, string Text, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, int ReplyCount, string AuthorName, string AuthorUsername, string? AuthorAvatar);
public sealed record CreatePollRequest { [Required, StringLength(500, MinimumLength = 1)] public string Question { get; init; } = string.Empty; [Required, MinLength(2), MaxLength(10)] public IReadOnlyList<string> Options { get; init; } = []; public DateTimeOffset? ClosesAt { get; init; } }
public sealed record PollOptionDto(Guid Id, string Text, int Votes);
public sealed record PollDto(Guid Id, Guid PostId, string Question, DateTimeOffset? ClosesAt, bool IsClosed, IReadOnlyList<PollOptionDto> Options, Guid? ViewerOptionId);
public sealed record FollowStateDto(bool Following, int FollowerCount);
public sealed record FollowProfileDto(Guid UserId, string Username, string Name, string? Avatar, DateTimeOffset FollowedAt);
public sealed record FollowListDto(IReadOnlyList<FollowProfileDto> Items, int Total, int Page, int PageSize);
public sealed record BusinessFollowProfileDto(Guid UserId, string Username, string Name, string? Avatar, DateTimeOffset FollowedAt);
public sealed record BusinessFollowListDto(IReadOnlyList<BusinessFollowProfileDto> Items, int Total, int Page, int PageSize);
public sealed record ModerationStateDto(bool Active);
