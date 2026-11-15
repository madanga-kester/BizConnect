using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using BizConnect.Domain.Catalogue;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizConnect.Api.Controllers;

/// <summary>
/// Anonymous public discovery. Only published items belonging to an active, public business can ever be
/// reached here; drafts, archived items and catalogue entries of private businesses are invisible, so a
/// guessed slug or id returns the same 404 as a non-existent one.
/// </summary>
[ApiController]
[Route("api/v1/catalogue")]
public sealed class CatalogueDiscoveryController(ICatalogService catalogue) : ControllerBase
{
    [HttpGet("products")]
    [AllowAnonymous]
    [ProducesResponseType<CatalogPublicPageResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogPublicPageResponse>> Products(
        [FromQuery] string? search, [FromQuery] string? category, [FromQuery] string? county, [FromQuery] string? town,
        [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice,
        [FromQuery] string sort = "new", [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await catalogue.DiscoverAsync(CatalogItemKinds.Product, search, category, county, town, minPrice, maxPrice,
            availability: null, sort, page, pageSize, cancellationToken));

    [HttpGet("products/{slugOrId}")]
    [AllowAnonymous]
    [ProducesResponseType<CatalogPublicItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogPublicItemResponse>> Product(string slugOrId, CancellationToken cancellationToken) =>
        Ok(await catalogue.GetPublishedAsync(slugOrId, CatalogItemKinds.Product, cancellationToken));

    [HttpGet("services")]
    [AllowAnonymous]
    [ProducesResponseType<CatalogPublicPageResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogPublicPageResponse>> Services(
        [FromQuery] string? search, [FromQuery] string? category, [FromQuery] string? county, [FromQuery] string? town,
        [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice,
        [FromQuery] string? availability, [FromQuery] string sort = "new", [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await catalogue.DiscoverAsync(CatalogItemKinds.Service, search, category, county, town, minPrice, maxPrice,
            availability, sort, page, pageSize, cancellationToken));

    [HttpGet("services/{slugOrId}")]
    [AllowAnonymous]
    [ProducesResponseType<CatalogPublicItemResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogPublicItemResponse>> Service(string slugOrId, CancellationToken cancellationToken) =>
        Ok(await catalogue.GetPublishedAsync(slugOrId, CatalogItemKinds.Service, cancellationToken));
}
