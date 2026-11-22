namespace Mabiz.Application.Contracts;

public sealed record TagUserRequest { public Guid UserId { get; init; } }
public sealed record TaggedUserDto(Guid UserId, string Username, string Name, string? Avatar, DateTimeOffset TaggedAt);