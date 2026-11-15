using System.Globalization;
using System.Text;
using BizConnect.Application.Services;

namespace BizConnect.Infrastructure.Services;

public readonly record struct SocialCursorKey(DateTimeOffset CreatedAtUtc, Guid Id);

public static class SocialCursorCodec
{
    public static SocialCursorKey? Decode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        try
        {
            var raw = Encoding.UTF8.GetString(Convert.FromBase64String(value.Replace('-', '+').Replace('_', '/').PadRight((value.Length + 3) / 4 * 4, '=')));
            var parts = raw.Split('|');
            if (parts.Length != 2 || !DateTimeOffset.TryParse(parts[0], CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var at) || !Guid.TryParseExact(parts[1], "D", out var id))
                throw new FormatException();
            return new(at.ToUniversalTime(), id);
        }
        catch (Exception ex) when (ex is FormatException or ArgumentException or DecoderFallbackException)
        {
            throw ApiException.BadRequest("INVALID_CURSOR", "The pagination cursor is invalid.");
        }
    }

    public static string Encode(DateTimeOffset createdAtUtc, Guid id) =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes(createdAtUtc.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture) + "|" + id.ToString("D")))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
