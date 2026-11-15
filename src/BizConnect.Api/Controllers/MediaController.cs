using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BizConnect.Api.Controllers;

/// <summary>
/// Media intake and delivery. Uploads are accepted only for a business the actor can manage, and every
/// read streams through this API: the configured bucket or filesystem is never exposed as a public origin,
/// so publication and membership checks cannot be bypassed with a raw storage or CDN URL.
/// </summary>
[ApiController]
[Route("api/v1")]
public sealed class MediaController(IMediaService media) : ControllerBase
{
    /// <summary>
    /// Ceiling of the configurable 1-64 MiB limit. Attribute values must be compile-time constants, so the
    /// effective cap comes from Storage:MaximumUploadMebibytes and is enforced again inside MediaService.
    /// </summary>
    private const long MaximumFormBytes = 64L * 1024 * 1024;

    [HttpPost("businesses/{businessId:guid}/media")]
    [Authorize]
    [EnableRateLimiting("business-write")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumFormBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaximumFormBytes)]
    [ProducesResponseType<MediaAssetResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<MediaAssetResponse>> Upload(Guid businessId, IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            throw ApiException.BadRequest("MEDIA_EMPTY", "Attach an image file in the 'file' form field.");
        await using var stream = file.OpenReadStream();
        var uploaded = await media.UploadAsync(CurrentUserId(), businessId,
            new MediaUploadRequest(file.FileName, file.ContentType, file.Length, stream), cancellationToken);
        return Created($"/api/v1/media/{uploaded.Id}", uploaded);
    }

    [HttpGet("media/{mediaId:guid}")]
    [Authorize]
    [ProducesResponseType<MediaAssetResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<MediaAssetResponse>> Metadata(Guid mediaId, CancellationToken cancellationToken) =>
        Ok(await media.GetAsync(CurrentUserId(), mediaId, cancellationToken));

    /// <summary>
    /// The access-controlled image proxy. Anonymous access is granted only when the asset is attached to a
    /// published catalogue item of a public, active business; members may preview their own drafts.
    /// </summary>
    [HttpGet("media/{mediaId:guid}/content")]
    [AllowAnonymous]
    [Produces("image/jpeg", "image/png", "image/webp")]
    public async Task<IActionResult> Content(Guid mediaId, CancellationToken cancellationToken)
    {
        var content = await media.GetContentAsync(CurrentUserIdOrNull(), mediaId, cancellationToken);
        Response.Headers.ETag = content.ETag;
        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        return File(content.Content, content.ContentType, enableRangeProcessing: true);
    }

    [HttpDelete("media/{mediaId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid mediaId, CancellationToken cancellationToken)
    {
        await media.DeleteAsync(CurrentUserId(), mediaId, cancellationToken);
        return NoContent();
    }

    private Guid CurrentUserId()
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var userId))
            throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity.");
        return userId;
    }

    private Guid? CurrentUserIdOrNull()
    {
        if (User.Identity?.IsAuthenticated != true) return null;
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(subject, out var userId) ? userId : null;
    }
}
