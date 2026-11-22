namespace Mabiz.Application.Contracts;

public sealed record PostShareDto(Guid Id, Guid PostId, Guid SharedByUserId, DateTimeOffset CreatedAt);
public sealed record ShareStateDto(int ShareCount, bool ViewerShared);
public sealed record ShareLinkDto(Guid PostId, string Url);