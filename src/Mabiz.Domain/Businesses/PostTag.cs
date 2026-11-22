namespace Mabiz.Domain.Businesses;

public sealed class PostTag
{
    public Guid PostId { get; set; }
    public Guid TaggedUserId { get; set; }
    public Guid TaggedByUserId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}