namespace BizConnect.Application.Contracts;

/// <summary>Server-side upload envelope built by the media controller from a multipart request. Alt text is
/// recorded per gallery entry, not on the asset, because one image can be reused across items.</summary>
public sealed record MediaUploadRequest(string FileName, string ContentType, long DeclaredSize, Stream Content);

/// <summary>A validated upload persisted through the configured storage provider.</summary>
public sealed record MediaAssetResponse(
    string Id, string BusinessId, string Provider, string ContentType, long SizeBytes, string Sha256,
    int? WidthPx, int? HeightPx, string Status, string AccessUrl, DateTimeOffset CreatedAt);

/// <summary>Bytes plus the content type the proxy should replay for the client.</summary>
public sealed record MediaContentResponse(Stream Content, string ContentType, long SizeBytes, string ETag);
