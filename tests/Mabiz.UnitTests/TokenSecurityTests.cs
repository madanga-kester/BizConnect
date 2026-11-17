using Mabiz.Infrastructure.Security;

namespace Mabiz.UnitTests;

public sealed class TokenSecurityTests
{
    private const string Pepper = "test-only-challenge-pepper-material-32-bytes";

    [Fact]
    public void RefreshTokens_AreRandomAndNotRawHashes()
    {
        var first = OpaqueTokenSecurity.CreateRefreshToken();
        var second = OpaqueTokenSecurity.CreateRefreshToken();
        Assert.NotEqual(first, second);
        Assert.True(first.Length >= 80);
        Assert.NotEqual(first, OpaqueTokenSecurity.Hash(first, Pepper));
    }

    [Fact]
    public void HashVerification_AcceptsOnlyTheOriginalSecretAndPepper()
    {
        const string code = "001234";
        var hash = OpaqueTokenSecurity.Hash(code, Pepper);
        Assert.True(OpaqueTokenSecurity.VerifyHash(code, hash, Pepper));
        Assert.False(OpaqueTokenSecurity.VerifyHash("001235", hash, Pepper));
        Assert.False(OpaqueTokenSecurity.VerifyHash(code, hash, Pepper + "different"));
    }

    [Fact]
    public void VerificationCodes_AreSixDigitsIncludingLeadingZeroes()
    {
        for (var index = 0; index < 100; index++)
            Assert.Matches("^[0-9]{6}$", OpaqueTokenSecurity.CreateSixDigitCode());
    }
}
