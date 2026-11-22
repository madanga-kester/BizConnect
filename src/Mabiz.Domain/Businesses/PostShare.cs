namespace Mabiz.Domain.Businesses;

public sealed class PostShare
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid SharedByUserId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}