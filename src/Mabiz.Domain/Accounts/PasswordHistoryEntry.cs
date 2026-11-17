namespace Mabiz.Domain.Accounts;

public sealed class PasswordHistoryEntry
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
}