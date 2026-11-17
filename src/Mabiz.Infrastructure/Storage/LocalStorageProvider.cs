using Mabiz.Application.Configuration;

namespace Mabiz.Infrastructure.Storage;

/// <summary>
/// Development and single-node provider. Bytes live under a configured root and are addressed only through
/// server-generated keys. The directory is intentionally not a static-file location: reads happen through
/// the access-controlled media proxy so publication and membership checks cannot be bypassed.
/// </summary>
public sealed class LocalStorageProvider : IMediaStorageProvider
{
    private readonly string _root;

    public LocalStorageProvider(LocalStorageOptions options, string contentRootPath)
    {
        var root = Path.IsPathRooted(options.RootPath)
            ? options.RootPath
            : Path.Combine(contentRootPath, options.RootPath);
        _root = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        Directory.CreateDirectory(_root);
    }

    public string Name => Domain.Catalogue.MediaStorageProviders.Local;

    public async Task PutAsync(string storageKey, Stream content, string contentType, CancellationToken cancellationToken)
    {
        var path = Resolve(storageKey);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var target = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous);
        await content.CopyToAsync(target, cancellationToken);
        await target.FlushAsync(cancellationToken);
    }

    public Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken)
    {
        var path = Resolve(storageKey);
        if (!File.Exists(path)) throw new FileNotFoundException("The stored media object is missing.", path);
        return Task.FromResult<Stream>(new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous));
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        var path = Resolve(storageKey);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    /// <summary>Rejects any key that is not a normalised relative key, then re-checks the combined path.</summary>
    private string Resolve(string storageKey)
    {
        if (!MediaKeyBuilder.IsSafeKey(storageKey))
            throw new ArgumentException("The media storage key is not a safe relative key.", nameof(storageKey));
        var combined = Path.GetFullPath(Path.Combine(_root, storageKey));
        if (!combined.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new ArgumentException("The media storage key escapes the configured storage root.", nameof(storageKey));
        return combined;
    }
}
