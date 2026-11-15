using System.Buffers.Binary;
using System.Globalization;
using System.Security.Cryptography;

namespace BizConnect.Infrastructure.Storage;

/// <summary>
/// Byte-level storage abstraction. Implementations address objects purely by the server-generated key so
/// that no client ever controls a path, and no raw provider URL is ever handed to a caller.
/// </summary>
public interface IMediaStorageProvider
{
    string Name { get; }
    Task PutAsync(string storageKey, Stream content, string contentType, CancellationToken cancellationToken);
    Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken);
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);
}

/// <summary>
/// Builds deterministic, filesystem-and-URL safe keys. Only GUIDs, hashes and fixed segments appear, so a
/// malicious file name can never introduce traversal, a scheme or an extension mismatch.
/// </summary>
public static class MediaKeyBuilder
{
    public static string Build(Guid businessId, Guid assetId, string sha256Hex, string extension, DateTimeOffset createdAtUtc, string keyPrefix = "media")
    {
        var safePrefix = SanitizePrefix(keyPrefix);
        var year = createdAtUtc.ToUniversalTime().ToString("yyyy", CultureInfo.InvariantCulture);
        var month = createdAtUtc.ToUniversalTime().ToString("MM", CultureInfo.InvariantCulture);
        var leaf = $"{assetId:N}-{sha256Hex[..Math.Min(12, sha256Hex.Length)]}.{extension}";
        return $"{safePrefix}/{businessId:N}/{year}/{month}/{leaf}";
    }

    private static string SanitizePrefix(string prefix)
    {
        var filtered = new string((prefix ?? string.Empty).Where(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '/').ToArray());
        // Rebuild from non-empty segments only: a configured prefix such as "../../etc/../weird prefix"
        // must never become "//etc//weirdprefix", whose empty segments would fail IsSafeKey and could
        // confuse a provider.
        var segments = filtered.Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Select(segment => new string(segment.Where(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_').ToArray()))
            .Where(segment => segment.Length > 0);
        var safe = string.Join('/', segments);
        return safe.Length == 0 ? "media" : safe;
    }

    /// <summary>True when the key is a normalised, traversal-free relative key.</summary>
    public static bool IsSafeKey(string? key) =>
        !string.IsNullOrWhiteSpace(key)
        && key.Length <= 512
        && key[0] != '/'
        && !key.Contains("..", StringComparison.Ordinal)
        && !key.Contains('\\', StringComparison.Ordinal)
        && !key.Contains(":", StringComparison.Ordinal)
        && key.Split('/').All(segment => segment.Length > 0 && segment.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.'));
}

/// <summary>
/// Validates uploaded bytes against the Stage 5 allow-list (JPEG, PNG, WebP) using magic signatures
/// rather than trusting the client supplied content type, and reads pixel dimensions when available.
/// </summary>
public static class ImageValidator
{
    public static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];

    /// <summary>Returns the canonical content type and extension, or null when the bytes are not an allowed image.</summary>
    public static ValidatedImage? Validate(ReadOnlySpan<byte> head, long totalBytes, long maximumBytes)
    {
        if (totalBytes <= 0) return null;
        if (totalBytes > maximumBytes) return null;

        if (head.Length >= 3 && head[0] == 0xFF && head[1] == 0xD8 && head[2] == 0xFF)
            return new ValidatedImage("image/jpeg", "jpg");
        if (head.Length >= 8 && head[0] == 0x89 && head[1] == 0x50 && head[2] == 0x4E && head[3] == 0x47
            && head[4] == 0x0D && head[5] == 0x0A && head[6] == 0x1A && head[7] == 0x0A)
            return new ValidatedImage("image/png", "png");
        if (head.Length >= 12 && head[0] == (byte)'R' && head[1] == (byte)'I' && head[2] == (byte)'F' && head[3] == (byte)'F'
            && head[8] == (byte)'W' && head[9] == (byte)'E' && head[10] == (byte)'B' && head[11] == (byte)'P')
            return new ValidatedImage("image/webp", "webp");
        return null;
    }

    /// <summary>Best-effort dimension probe. Null simply means "not recorded", never a rejection.</summary>
    public static (int Width, int Height)? ReadDimensions(string contentType, ReadOnlySpan<byte> head) => contentType switch
    {
        "image/png" => ReadPng(head),
        "image/jpeg" => ReadJpeg(head),
        "image/webp" => ReadWebp(head),
        _ => null
    };

    private static (int, int)? ReadPng(ReadOnlySpan<byte> b)
    {
        if (b.Length < 24) return null;
        // PNG layout: 8 signature bytes, then a 4-byte chunk length at 8, the chunk type at 12,
        // and the IHDR payload (width then height, both big-endian uint32) from 16.
        if (BinaryPrimitives.ReadUInt32BigEndian(b[12..]) != 0x49484452) return null; // "IHDR"
        var width = (int)BinaryPrimitives.ReadUInt32BigEndian(b[16..]);
        var height = (int)BinaryPrimitives.ReadUInt32BigEndian(b[20..]);
        return width > 0 && height > 0 ? (width, height) : null;
    }

    private static (int, int)? ReadJpeg(ReadOnlySpan<byte> b)
    {
        if (b.Length < 4 || b[0] != 0xFF || b[1] != 0xD8) return null;
        for (var i = 2; i + 9 < b.Length;)
        {
            if (b[i] != 0xFF) { i++; continue; }
            var marker = b[i + 1];
            if (marker is 0xD8 or 0x01 or (>= 0xD0 and <= 0xD7)) { i += 2; continue; }
            var length = BinaryPrimitives.ReadUInt16BigEndian(b[(i + 2)..]);
            if (length < 2) return null;
            // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 carry the frame size.
            var isSof = marker is >= 0xC0 and <= 0xCF and not (0xC4 or 0xC8 or 0xCC);
            if (isSof && i + 9 <= b.Length)
            {
                var height = BinaryPrimitives.ReadUInt16BigEndian(b[(i + 5)..]);
                var width = BinaryPrimitives.ReadUInt16BigEndian(b[(i + 7)..]);
                return width > 0 && height > 0 ? (width, height) : null;
            }
            i += 2 + length;
        }
        return null;
    }

    private static (int, int)? ReadWebp(ReadOnlySpan<byte> b)
    {
        if (b.Length < 30) return null;
        var fourcc = System.Text.Encoding.ASCII.GetString(b[12..16]);
        switch (fourcc)
        {
            case "VP8X":
                var w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
                var h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
                return (w, h);
            case "VP8L":
                if (b[21] != 0xFF) return null;
                var bits = b[22] | (b[23] << 8) | (b[24] << 16) | ((b[25] & 0x3F) << 24);
                return ((bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1);
            case "VP8 ":
                var lw = BinaryPrimitives.ReadUInt16LittleEndian(b[26..]) & 0x3FFF;
                var lh = BinaryPrimitives.ReadUInt16LittleEndian(b[28..]) & 0x3FFF;
                return lw > 0 && lh > 0 ? (lw, lh) : null;
            default:
                return null;
        }
    }

    public static string HashHex(ReadOnlySpan<byte> bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
}

public sealed record ValidatedImage(string ContentType, string Extension);
