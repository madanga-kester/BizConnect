using BizConnect.Application.Services;
using BizConnect.Infrastructure.Services;

namespace BizConnect.UnitTests;

public sealed class SocialCursorCodecTests
{
    [Fact]
    public void EncodeDecode_RoundTripsUtcTimestampAndIdExactly()
    {
        var id = Guid.Parse("0d477688-862f-49e8-a5cb-2f5173747c81");
        var at = new DateTimeOffset(2026, 11, 12, 17, 29, 5, TimeSpan.Zero).AddTicks(1234);

        var decoded = SocialCursorCodec.Decode(SocialCursorCodec.Encode(at, id));

        Assert.Equal(new SocialCursorKey(at, id), decoded);
    }

    [Fact]
    public void Decode_AcceptsMissingCursorAsFirstPage()
    {
        Assert.Null(SocialCursorCodec.Decode(null));
        Assert.Null(SocialCursorCodec.Decode(" "));
    }

    [Theory]
    [InlineData("not-base64!")]
    [InlineData("YWJj")]
    public void Decode_RejectsMalformedCursor(string cursor) =>
        Assert.Throws<ApiException>(() => SocialCursorCodec.Decode(cursor));
}
