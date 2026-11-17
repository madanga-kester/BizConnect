using System.Text;
using Mabiz.Application.Configuration;
using Mabiz.Application.Services;
using Mabiz.Infrastructure.Services;
using Mabiz.Infrastructure.Storage;

namespace Mabiz.UnitTests;

public sealed class Stage5CatalogUnitTests
{
    private const string PngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

    [Theory]
    [InlineData("Owner", true, true)]
    [InlineData("Admin", true, true)]
    [InlineData("Editor", true, true)]
    [InlineData("Viewer", false, false)]
    [InlineData("Unknown", false, false)]
    [InlineData(null, false, false)]
    public void CataloguePermissions_FollowTheBusinessRoleMatrix(string? role, bool canManage, bool canPublish)
    {
        Assert.Equal(canManage, CatalogPermissions.CanManage(role));
        Assert.Equal(canPublish, CatalogPermissions.CanPublish(role));
        Assert.Equal(canManage, CatalogPermissions.CanSeeUnpublished(role));
    }

    [Fact]
    public void CataloguePermissions_DoNotWeakenExistingStage3Boundaries()
    {
        // Adding catalogue rows to the matrix must not silently grant team or ownership powers.
        Assert.False(BusinessAccessControl.Allows("Editor", BusinessPermission.ManageTeam));
        Assert.False(BusinessAccessControl.Allows("Editor", BusinessPermission.TransferOwnership));
        Assert.False(BusinessAccessControl.Allows("Viewer", BusinessPermission.ManageCatalogue));
        Assert.True(BusinessAccessControl.Allows("Owner", BusinessPermission.ManageCatalogue));
    }

    [Fact]
    public void MediaKeyBuilder_ProducesNormalisedKeysWithNoClientControlledSegments()
    {
        var businessId = Guid.NewGuid();
        var assetId = Guid.NewGuid();
        var hash = new string('a', 64);
        var key = MediaKeyBuilder.Build(businessId, assetId, hash, "png", new DateTimeOffset(2026, 11, 12, 10, 0, 0, TimeSpan.Zero));

        Assert.StartsWith($"media/{businessId:N}/2026/11/", key);
        Assert.Contains($"{assetId:N}-{hash[..12]}.png", key);
        Assert.True(MediaKeyBuilder.IsSafeKey(key));
    }

    [Theory]
    [InlineData("../../etc/passwd", false)]
    [InlineData("/absolute/passwd", false)]
    [InlineData("media/../secret.png", false)]
    [InlineData("media\\windows\\key.png", false)]
    [InlineData("C:/temp/key.png", false)]
    [InlineData("https://bucket.example/key.png", false)]
    [InlineData("", false)]
    [InlineData("media/business/2026/11/asset-hash.png", true)]
    public void MediaKeyBuilder_RejectsKeysThatCouldEscapeTheRoot(string key, bool expected) =>
        Assert.Equal(expected, MediaKeyBuilder.IsSafeKey(key));

    [Fact]
    public void MediaKeyBuilder_SanitisesConfiguredPrefix()
    {
        var key = MediaKeyBuilder.Build(Guid.NewGuid(), Guid.NewGuid(), new string('b', 64), "jpg",
            DateTimeOffset.UtcNow, "../../etc/../weird prefix!");
        Assert.StartsWith("etc/weirdprefix/", key);
        Assert.True(MediaKeyBuilder.IsSafeKey(key));
        Assert.DoesNotContain("..", key);
        Assert.DoesNotContain(" ", key);
    }

    [Fact]
    public void ImageValidator_UsesSignaturesRatherThanTheDeclaredContentType()
    {
        var png = Convert.FromBase64String(PngBase64);
        var detected = ImageValidator.Validate(png, png.LongLength, 10L * 1024 * 1024);
        Assert.NotNull(detected);
        Assert.Equal("image/png", detected!.ContentType);
        Assert.Equal("png", detected.Extension);

        var jpeg = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3 };
        Assert.Equal("image/jpeg", ImageValidator.Validate(jpeg, jpeg.LongLength, 10L * 1024 * 1024)?.ContentType);

        var webp = Encoding.ASCII.GetBytes("RIFF....WEBPVP8 ");
        Assert.Equal("image/webp", ImageValidator.Validate(webp, webp.LongLength, 10L * 1024 * 1024)?.ContentType);

        var disguised = Encoding.ASCII.GetBytes("MZ executable pretending to be a png");
        Assert.Null(ImageValidator.Validate(disguised, disguised.LongLength, 10L * 1024 * 1024));
    }

    [Fact]
    public void ImageValidator_RejectsAnythingAboveTheConfiguredCap()
    {
        var png = Convert.FromBase64String(PngBase64);
        Assert.Null(ImageValidator.Validate(png, 2L * 1024 * 1024, 1024 * 1024));
        Assert.Null(ImageValidator.Validate(png, 0, 1024 * 1024));
    }

    [Fact]
    public void ImageValidator_ReadsPngAndWebpDimensions()
    {
        var png = Convert.FromBase64String(PngBase64);
        Assert.Equal((1, 1), ImageValidator.ReadDimensions("image/png", png));

        var vp8x = new byte[30];
        Encoding.ASCII.GetBytes("RIFF").CopyTo(vp8x, 0);
        Encoding.ASCII.GetBytes("WEBP").CopyTo(vp8x, 8);
        Encoding.ASCII.GetBytes("VP8X").CopyTo(vp8x, 12);
        vp8x[24] = 99; vp8x[25] = 0; vp8x[26] = 0;   // width  - 1
        vp8x[27] = 49; vp8x[28] = 0; vp8x[29] = 0;   // height - 1
        Assert.Equal((100, 50), ImageValidator.ReadDimensions("image/webp", vp8x));

        Assert.Null(ImageValidator.ReadDimensions("image/jpeg", [0xFF, 0xD8]));
    }

    [Fact]
    public void ImageValidator_HashIsStableAndLowercaseHex()
    {
        var png = Convert.FromBase64String(PngBase64);
        var first = ImageValidator.HashHex(png);
        Assert.Equal(64, first.Length);
        Assert.Equal(first, ImageValidator.HashHex(png));
        Assert.Equal(first.ToLowerInvariant(), first);
    }

    [Fact]
    public void StorageOptions_DefaultToLocalWithTenMebibyteCap()
    {
        var options = new StorageOptions();
        Assert.Equal("local", options.Provider);
        Assert.Equal(10, options.MaximumUploadMebibytes);
        Assert.Equal(10L * 1024 * 1024, options.MaximumUploadBytes);
        Assert.Equal("App_Data/media", options.Local.RootPath);
        Assert.Equal("media", options.S3.KeyPrefix);
        Assert.False(options.S3.AllowInsecureEndpoint);
    }

    [Fact]
    public async Task LocalStorageProvider_StoresReadsAndDeletesWithinItsRoot()
    {
        var root = Path.Combine(Path.GetTempPath(), $"Mabiz-unit-{Guid.NewGuid():N}");
        var provider = new LocalStorageProvider(new LocalStorageOptions { RootPath = root }, Path.GetTempPath());
        Assert.Equal("local", provider.Name);

        var key = MediaKeyBuilder.Build(Guid.NewGuid(), Guid.NewGuid(), new string('c', 64), "png", DateTimeOffset.UtcNow);
        await provider.PutAsync(key, new MemoryStream([1, 2, 3]), "image/png", CancellationToken.None);
        await using (var read = await provider.OpenReadAsync(key, CancellationToken.None))
        using (var copy = new MemoryStream())
        {
            await read.CopyToAsync(copy);
            Assert.Equal(new byte[] { 1, 2, 3 }, copy.ToArray());
        }

        await provider.DeleteAsync(key, CancellationToken.None);
        await Assert.ThrowsAsync<FileNotFoundException>(async () => await provider.OpenReadAsync(key, CancellationToken.None));
        Directory.Delete(root, recursive: true);
    }

    [Fact]
    public async Task LocalStorageProvider_RefusesKeysThatEscapeTheRoot()
    {
        var root = Path.Combine(Path.GetTempPath(), $"Mabiz-unit-{Guid.NewGuid():N}");
        var provider = new LocalStorageProvider(new LocalStorageOptions { RootPath = root }, Path.GetTempPath());
        await Assert.ThrowsAsync<ArgumentException>(async () => await provider.OpenReadAsync("../outside.png", CancellationToken.None));
        await Assert.ThrowsAsync<ArgumentException>(async () => await provider.PutAsync("/etc/passwd", new MemoryStream(), "image/png", CancellationToken.None));
    }

    [Fact]
    public void S3Provider_ReportsMisconfigurationInsteadOfStartingSilently()
    {
        var missingBucket = Assert.Throws<ApiException>(() =>
            new S3CompatibleStorageProvider(new S3StorageOptions { Bucket = "", AccessKey = "a", SecretKey = "b" }, isProduction: false));
        Assert.Equal(503, missingBucket.StatusCode);
        Assert.Equal("STORAGE_MISCONFIGURED", missingBucket.Code);

        var missingCredentials = Assert.Throws<ApiException>(() =>
            new S3CompatibleStorageProvider(new S3StorageOptions { Bucket = "media", AccessKey = "", SecretKey = "" }, isProduction: false));
        Assert.Equal("STORAGE_MISCONFIGURED", missingCredentials.Code);

        var insecure = Assert.Throws<ApiException>(() =>
            new S3CompatibleStorageProvider(new S3StorageOptions
            {
                Bucket = "media", AccessKey = "a", SecretKey = "b", Endpoint = "http://localhost:9000"
            }, isProduction: false));
        Assert.Equal("STORAGE_MISCONFIGURED", insecure.Code);

        var productionInsecure = Assert.Throws<ApiException>(() =>
            new S3CompatibleStorageProvider(new S3StorageOptions
            {
                Bucket = "media", AccessKey = "a", SecretKey = "b", Endpoint = "http://localhost:9000", AllowInsecureEndpoint = true
            }, isProduction: true));
        Assert.Equal("STORAGE_MISCONFIGURED", productionInsecure.Code);
    }

    [Fact]
    public async Task S3Provider_AcceptsInsecureEndpointOnlyWhenExplicitlyAllowedForDevelopment()
    {
        using var provider = new S3CompatibleStorageProvider(new S3StorageOptions
        {
            Bucket = "media", AccessKey = "a", SecretKey = "b", Endpoint = "http://localhost:9000", AllowInsecureEndpoint = true
        }, isProduction: false);
        Assert.Equal("s3", provider.Name);
        // Key safety is checked before any request is built, so an unsafe key never reaches the network.
        await Assert.ThrowsAsync<ArgumentException>(async () => await provider.OpenReadAsync("../nope.png", CancellationToken.None));
    }
}
