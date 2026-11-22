using System;

namespace Mabiz.Domain.Menu;

public enum SavedContentKind { Post = 0, Story = 1, Business = 2, Opportunity = 3 }

public sealed class SavedContent
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ContentId { get; set; }
    public SavedContentKind Kind { get; set; }
    public DateTimeOffset SavedAtUtc { get; set; }
}

public sealed class MenuActivityEvent
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? SubjectType { get; set; }
    public Guid? SubjectId { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}
