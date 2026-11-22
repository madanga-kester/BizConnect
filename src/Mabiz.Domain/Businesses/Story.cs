namespace Mabiz.Domain.Businesses;

public sealed class Story
{
    public Guid Id { get; set; }
    public Guid AuthorUserId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? MediaType { get; set; }
    public string? MediaUrl { get; set; }
    public string? AltText { get; set; }
    public string Audience { get; set; } = "public";
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
}

public sealed class StoryReply
{
    public Guid Id { get; set; }
    public Guid StoryId { get; set; }
    public Guid AuthorUserId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
}