using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Mabiz.Application.Configuration;
using Mabiz.Application.Services;

namespace Mabiz.Infrastructure.Storage;

/// <summary>
/// S3-compatible provider (AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, Backblaze B2 and similar).
///
/// IMPORTANT: this code is configurable but has not been validated against a real endpoint, bucket and
/// credential set. It is not evidence that cloud storage works. Credentials are read server-side only and
/// the bucket is expected to remain private; clients never receive a raw bucket or CDN URL.
/// </summary>
public sealed class S3CompatibleStorageProvider : IMediaStorageProvider, IDisposable
{
    private readonly IAmazonS3 _client;
    private readonly string _bucket;

    public S3CompatibleStorageProvider(S3StorageOptions options, bool isProduction)
        : this(BuildClient(options, isProduction), options.Bucket)
    {
    }

    /// <summary>Testing seam so the access rules can be exercised without a network endpoint.</summary>
    public S3CompatibleStorageProvider(IAmazonS3 client, string bucket)
    {
        _client = client;
        _bucket = bucket;
    }

    public string Name => Domain.Catalogue.MediaStorageProviders.S3;

    public async Task PutAsync(string storageKey, Stream content, string contentType, CancellationToken cancellationToken)
    {
        EnsureKey(storageKey);
        try
        {
            await _client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = _bucket,
                Key = storageKey,
                InputStream = content,
                ContentType = contentType,
                DisablePayloadSigning = false
            }, cancellationToken);
        }
        catch (Exception ex) when (ex is AmazonServiceException or AmazonClientException)
        {
            throw Unavailable(ex);
        }
    }

    public async Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken)
    {
        EnsureKey(storageKey);
        try
        {
            var response = await _client.GetObjectAsync(_bucket, storageKey, cancellationToken);
            // The SDK stream is tied to the response; copy to memory so the response can be disposed.
            var buffer = new MemoryStream();
            using (response)
            {
                await response.ResponseStream.CopyToAsync(buffer, cancellationToken);
            }
            buffer.Position = 0;
            return buffer;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            throw new FileNotFoundException("The stored media object is missing.", storageKey);
        }
        catch (Exception ex) when (ex is AmazonServiceException or AmazonClientException)
        {
            throw Unavailable(ex);
        }
    }

    public async Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        EnsureKey(storageKey);
        try
        {
            await _client.DeleteObjectAsync(new DeleteObjectRequest { BucketName = _bucket, Key = storageKey }, cancellationToken);
        }
        catch (Exception ex) when (ex is AmazonServiceException or AmazonClientException)
        {
            throw Unavailable(ex);
        }
    }

    public void Dispose() => _client.Dispose();

    private static void EnsureKey(string storageKey)
    {
        if (!MediaKeyBuilder.IsSafeKey(storageKey))
            throw new ArgumentException("The media storage key is not a safe object key.", nameof(storageKey));
    }

    private static ApiException Unavailable(Exception ex) =>
        ApiException.Unavailable("MEDIA_STORAGE_UNAVAILABLE",
            $"The configured media storage endpoint could not be reached ({ex.GetType().Name}). Retry later or fall back to local storage.");

    private static IAmazonS3 BuildClient(S3StorageOptions options, bool isProduction)
    {
        if (string.IsNullOrWhiteSpace(options.Bucket))
            throw ApiException.Unavailable("STORAGE_MISCONFIGURED", "Storage:Provider is 's3' but Storage:S3:Bucket is not configured.");
        if (string.IsNullOrWhiteSpace(options.AccessKey) || string.IsNullOrWhiteSpace(options.SecretKey))
            throw ApiException.Unavailable("STORAGE_MISCONFIGURED", "S3 credentials must be supplied through Storage__S3__AccessKey and Storage__S3__SecretKey.");
        if (!string.IsNullOrWhiteSpace(options.Endpoint)
            && !Uri.TryCreate(options.Endpoint, UriKind.Absolute, out var endpointUri)
            && !options.Endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            && !options.Endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            throw ApiException.Unavailable("STORAGE_MISCONFIGURED", "Storage:S3:Endpoint must be an absolute URL including the scheme.");

        if (isProduction && options.AllowInsecureEndpoint)
            throw ApiException.Unavailable("STORAGE_MISCONFIGURED", "Storage:S3:AllowInsecureEndpoint cannot be used in Production.");

        var config = new AmazonS3Config
        {
            ForcePathStyle = options.UsePathStyle,
            Timeout = TimeSpan.FromSeconds(100)
        };

        if (!string.IsNullOrWhiteSpace(options.Endpoint))
        {
            config.ServiceURL = options.Endpoint.TrimEnd('/');
            if (Uri.TryCreate(config.ServiceURL, UriKind.Absolute, out var parsed)
                && parsed.Scheme == Uri.UriSchemeHttp && !options.AllowInsecureEndpoint)
                throw ApiException.Unavailable("STORAGE_MISCONFIGURED", "Plain HTTP S3 endpoints require Storage:S3:AllowInsecureEndpoint=true.");
        }
        else
        {
            config.RegionEndpoint = RegionEndpoint.GetBySystemName(string.IsNullOrWhiteSpace(options.Region) ? "us-east-1" : options.Region);
        }

        if (!string.IsNullOrWhiteSpace(options.Region))
            config.AuthenticationRegion = options.Region;

        return new AmazonS3Client(new BasicAWSCredentials(options.AccessKey, options.SecretKey), config);
    }
}
