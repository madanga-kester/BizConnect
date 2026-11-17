using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Mabiz.Domain.Catalogue;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Mabiz.Api.Controllers;

/// <summary>
/// Management side of the catalogue. The path segments are literal "products" and "services" because the
/// Expo adapters already address them that way; kind is taken from the route, never trusted from the body.
/// </summary>
[ApiController]
[Route("api/v1/businesses")]
public sealed class BusinessCatalogueController(ICatalogService catalogue) : ControllerBase
{
    private const string Product = CatalogItemKinds.Product;
    private const string Service = CatalogItemKinds.Service;

    [HttpGet("{businessId:guid}/products")]
    [Authorize]
    [ProducesResponseType<CatalogItemPageResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemPageResponse>> ListProducts(Guid businessId, [FromQuery] string? status,
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default) =>
        Ok(await catalogue.ListManagedAsync(CurrentUserId(), businessId, Product, status, search, page, pageSize, cancellationToken));

    [HttpGet("{businessId:guid}/services")]
    [Authorize]
    [ProducesResponseType<CatalogItemPageResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemPageResponse>> ListServices(Guid businessId, [FromQuery] string? status,
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default) =>
        Ok(await catalogue.ListManagedAsync(CurrentUserId(), businessId, Service, status, search, page, pageSize, cancellationToken));

    [HttpPost("{businessId:guid}/products")]
    [Authorize]
    [EnableRateLimiting("business-write")]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<CatalogItemResponse>> CreateProduct(Guid businessId, CatalogItemCreateRequest request, CancellationToken cancellationToken)
    {
        var created = await catalogue.CreateAsync(CurrentUserId(), businessId, Product, request, cancellationToken);
        return CreatedAtAction(nameof(GetProduct), new { businessId, productId = Guid.Parse(created.Id) }, created);
    }

    [HttpPost("{businessId:guid}/services")]
    [Authorize]
    [EnableRateLimiting("business-write")]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<CatalogItemResponse>> CreateService(Guid businessId, CatalogItemCreateRequest request, CancellationToken cancellationToken)
    {
        var created = await catalogue.CreateAsync(CurrentUserId(), businessId, Service, request, cancellationToken);
        return CreatedAtAction(nameof(GetService), new { businessId, serviceId = Guid.Parse(created.Id) }, created);
    }

    [HttpGet("{businessId:guid}/products/{productId:guid}")]
    [Authorize]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> GetProduct(Guid businessId, Guid productId, CancellationToken cancellationToken) =>
        Ok(await catalogue.GetManagedAsync(CurrentUserId(), businessId, productId, cancellationToken));

    [HttpGet("{businessId:guid}/services/{serviceId:guid}")]
    [Authorize]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> GetService(Guid businessId, Guid serviceId, CancellationToken cancellationToken) =>
        Ok(await catalogue.GetManagedAsync(CurrentUserId(), businessId, serviceId, cancellationToken));

    [HttpPatch("{businessId:guid}/products/{productId:guid}")]
    [Authorize]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> UpdateProduct(Guid businessId, Guid productId, CatalogItemUpdateRequest request, CancellationToken cancellationToken) =>
        Ok(await catalogue.UpdateAsync(CurrentUserId(), businessId, productId, request, cancellationToken));

    [HttpPatch("{businessId:guid}/services/{serviceId:guid}")]
    [Authorize]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> UpdateService(Guid businessId, Guid serviceId, CatalogItemUpdateRequest request, CancellationToken cancellationToken) =>
        Ok(await catalogue.UpdateAsync(CurrentUserId(), businessId, serviceId, request, cancellationToken));

    /// <summary>Archives rather than erases, so published history and media references stay intact.</summary>
    [HttpDelete("{businessId:guid}/products/{productId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ArchiveProduct(Guid businessId, Guid productId, CancellationToken cancellationToken)
    {
        await catalogue.SetStatusAsync(CurrentUserId(), businessId, productId, CatalogItemStatuses.Archived, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{businessId:guid}/services/{serviceId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ArchiveService(Guid businessId, Guid serviceId, CancellationToken cancellationToken)
    {
        await catalogue.SetStatusAsync(CurrentUserId(), businessId, serviceId, CatalogItemStatuses.Archived, cancellationToken);
        return NoContent();
    }

    [HttpPost("{businessId:guid}/products/{productId:guid}/status")]
    [Authorize]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> SetProductStatus(Guid businessId, Guid productId, CatalogStatusRequest request, CancellationToken cancellationToken) =>
        Ok(await catalogue.SetStatusAsync(CurrentUserId(), businessId, productId, request.Status, cancellationToken));

    [HttpPost("{businessId:guid}/services/{serviceId:guid}/status")]
    [Authorize]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> SetServiceStatus(Guid businessId, Guid serviceId, CatalogStatusRequest request, CancellationToken cancellationToken) =>
        Ok(await catalogue.SetStatusAsync(CurrentUserId(), businessId, serviceId, request.Status, cancellationToken));

    [HttpPut("{businessId:guid}/products/{productId:guid}/media")]
    [Authorize]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> ReplaceProductMedia(Guid businessId, Guid productId, CatalogMediaReplaceRequest request, CancellationToken cancellationToken) =>
        Ok(await catalogue.ReplaceMediaAsync(CurrentUserId(), businessId, productId, request, cancellationToken));

    [HttpPut("{businessId:guid}/services/{serviceId:guid}/media")]
    [Authorize]
    [ProducesResponseType<CatalogItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> ReplaceServiceMedia(Guid businessId, Guid serviceId, CatalogMediaReplaceRequest request, CancellationToken cancellationToken) =>
        Ok(await catalogue.ReplaceMediaAsync(CurrentUserId(), businessId, serviceId, request, cancellationToken));


    private Guid CurrentUserId()
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var userId))
            throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity.");
        return userId;
    }
}
