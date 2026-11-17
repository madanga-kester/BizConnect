namespace Mabiz.Domain.Catalogue;

public static class MediaStorageProviders
{
    public const string Local = "local";
    public const string S3 = "s3";
    public static readonly string[] All = [Local, S3];
}

public static class MediaAssetStatuses
{
    public const string Ready = "ready";
    public const string Deleted = "deleted";
    public static readonly string[] All = [Ready, Deleted];
}

/// <summary>
/// Server-owned record of an uploaded image. The storage key is never returned to anonymous callers and
/// raw provider URLs are not exposed: bytes are always served through the access-controlled media proxy.
/// </summary>
public sealed class MediaAsset
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string Provider { get; set; } = MediaStorageProviders.Local;
    public string StorageKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Sha256 { get; set; } = string.Empty;
    public int? WidthPx { get; set; }
    public int? HeightPx { get; set; }
    public string Status { get; set; } = MediaAssetStatuses.Ready;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
}
