using System.ComponentModel.DataAnnotations;

namespace Mabiz.Application.Contracts;

public sealed record CreateStoryRequest
{
    [StringLength(500)] public string Text { get; init; } = string.Empty;
    [RegularExpression("^(image|video)$")] public string? MediaType { get; init; }
    [StringLength(2048)] public string? MediaUrl { get; init; }
    [StringLength(500)] public string? AltText { get; init; }
    [RegularExpression("^(public|followers)$")] public string Audience { get; init; } = "public";
}
public sealed record StoryReplyRequest { [Required, StringLength(1000, MinimumLength = 1)] public string Text { get; init; } = string.Empty; }
public sealed record StoryDto(Guid Id, Guid AuthorUserId, string AuthorName, string AuthorUsername, string? AuthorAvatar, string Text, string? MediaType, string? MediaUrl, string? AltText, string Audience, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt);
public sealed record StoryReplyDto(Guid Id, Guid StoryId, Guid AuthorUserId, string AuthorName, string AuthorUsername, string? AuthorAvatar, string Text, DateTimeOffset CreatedAt);