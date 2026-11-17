using System.ComponentModel.DataAnnotations;

namespace Mabiz.Application.Configuration;

/// <summary>
/// Stage 5 media storage configuration. Bind section "Storage". Nested keys must stay nested: in
/// environment-variable form they are Storage__Provider, Storage__S3__Bucket, Storage__S3__AccessKey
/// and so on. Flattening them (for example Storage__S3Bucket) silently leaves the section empty.
/// </summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>Active provider: "local" for the development filesystem, "s3" for any S3-compatible endpoint.</summary>
    [RegularExpression("^(local|s3)$")]
    public string Provider { get; init; } = "local";

    /// <summary>Hard cap for a single upload, configurable between 1 and 64 MiB. Default 10 MiB.</summary>
    [Range(1, 64)]
    public int MaximumUploadMebibytes { get; init; } = 10;

    public LocalStorageOptions Local { get; init; } = new();
    public S3StorageOptions S3 { get; init; } = new();

    public long MaximumUploadBytes => (long)MaximumUploadMebibytes * 1024L * 1024L;
}

public sealed class LocalStorageOptions
{
    /// <summary>Directory holding uploaded bytes. Relative paths resolve against the API content root.</summary>
    [Required]
    public string RootPath { get; init; } = "App_Data/media";

    /// <summary>Public base path used when the operator reverse-proxies the storage directory directly.</summary>
    public bool ServeThroughApiOnly { get; init; } = true;
}

/// <summary>
/// Credentials here are server-only secrets. They are never returned to a client and the bucket is
/// expected to stay private: every read goes through the Mabiz media proxy.
/// </summary>
public sealed class S3StorageOptions
{
    /// <summary>Provider endpoint URL, e.g. https://s3.example-cloud.com. Empty means the AWS default endpoint.</summary>
    [Url, StringLength(512)]
    public string Endpoint { get; init; } = string.Empty;

    [Required, StringLength(200)]
    public string Bucket { get; init; } = string.Empty;

    [Required, StringLength(80)]
    public string Region { get; init; } = "auto";

    [Required, StringLength(200)]
    public string AccessKey { get; init; } = string.Empty;

    [Required, StringLength(200)]
    public string SecretKey { get; init; } = string.Empty;

    /// <summary>Required by MinIO and several other compatible providers.</summary>
    public bool UsePathStyle { get; init; }

    /// <summary>Allow a non-TLS endpoint. Development only; refused in Production unless explicitly enabled.</summary>
    public bool AllowInsecureEndpoint { get; init; }

    /// <summary>Optional key prefix inside the bucket.</summary>
    [StringLength(120)]
    public string KeyPrefix { get; init; } = "media";
}
