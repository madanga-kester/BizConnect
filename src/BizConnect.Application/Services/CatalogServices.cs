using BizConnect.Application.Contracts;

namespace BizConnect.Application.Services;

/// <summary>Stage 5 role boundaries for catalogue work, expressed through the single business permission matrix.</summary>
public static class CatalogPermissions
{
    /// <summary>Owner/Admin/Editor manage catalogue items; Viewer is read-only.</summary>
    public static bool CanManage(string? role) =>
        BusinessAccessControl.Allows(role, BusinessPermission.ManageCatalogue);

    public static bool CanPublish(string? role) =>
        BusinessAccessControl.Allows(role, BusinessPermission.PublishCatalogue);

    /// <summary>Drafts and archived items are only visible to members with catalogue access.</summary>
    public static bool CanSeeUnpublished(string? role) => CanManage(role);
}

public interface ICatalogService
{
    Task<CatalogItemPageResponse> ListManagedAsync(Guid actorId, Guid businessId, string? kind, string? status, string? search, int page, int pageSize, CancellationToken cancellationToken);
    Task<CatalogItemResponse> CreateAsync(Guid actorId, Guid businessId, string kind, CatalogItemCreateRequest request, CancellationToken cancellationToken);
    Task<CatalogItemResponse> GetManagedAsync(Guid actorId, Guid businessId, Guid itemId, CancellationToken cancellationToken);
    Task<CatalogItemResponse> UpdateAsync(Guid actorId, Guid businessId, Guid itemId, CatalogItemUpdateRequest request, CancellationToken cancellationToken);
    Task<CatalogItemResponse> SetStatusAsync(Guid actorId, Guid businessId, Guid itemId, string status, CancellationToken cancellationToken);
    Task<CatalogItemResponse> ReplaceMediaAsync(Guid actorId, Guid businessId, Guid itemId, CatalogMediaReplaceRequest request, CancellationToken cancellationToken);
    Task<CatalogPublicPageResponse> DiscoverAsync(string kind, string? search, string? category, string? county, string? town, decimal? minPrice, decimal? maxPrice, string? availability, string sort, int page, int pageSize, CancellationToken cancellationToken);
    Task<CatalogPublicItemResponse> GetPublishedAsync(string slugOrId, string kind, CancellationToken cancellationToken);
}

public interface IMediaService
{
    Task<MediaAssetResponse> UploadAsync(Guid actorId, Guid businessId, MediaUploadRequest request, CancellationToken cancellationToken);
    Task<MediaAssetResponse> GetAsync(Guid actorId, Guid mediaId, CancellationToken cancellationToken);
    Task<MediaContentResponse> GetContentAsync(Guid? viewerId, Guid mediaId, CancellationToken cancellationToken);
    Task DeleteAsync(Guid actorId, Guid mediaId, CancellationToken cancellationToken);
}
