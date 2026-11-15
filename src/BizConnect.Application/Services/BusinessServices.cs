using BizConnect.Application.Contracts;

namespace BizConnect.Application.Services;

public enum BusinessPermission
{
    ViewPrivateProfile,
    ViewMembers,
    EditProfile,
    ManageTeam,
    InviteAdmin,
    AssignAdmin,
    ManageSettings,
    Archive,
    TransferOwnership,
    ViewActivity,
    PublishPosts,
    ManageCatalogue,
    PublishCatalogue,
    RespondToEnquiries
}

/// <summary>Single source of truth for business role boundaries.</summary>
public static class BusinessAccessControl
{
    public static bool Allows(string? role, BusinessPermission permission) => (role, permission) switch
    {
        ("Owner", _) => true,
        ("Admin" or "Editor", BusinessPermission.RespondToEnquiries) => true,
        ("Admin", BusinessPermission.PublishPosts or BusinessPermission.ManageCatalogue or BusinessPermission.PublishCatalogue) => true,
        ("Editor", BusinessPermission.PublishPosts or BusinessPermission.ManageCatalogue or BusinessPermission.PublishCatalogue) => true,
        ("Admin", BusinessPermission.ViewPrivateProfile or BusinessPermission.ViewMembers or BusinessPermission.EditProfile or BusinessPermission.ManageTeam or BusinessPermission.ManageSettings or BusinessPermission.ViewActivity) => true,
        ("Editor", BusinessPermission.ViewPrivateProfile or BusinessPermission.ViewMembers or BusinessPermission.EditProfile) => true,
        ("Viewer", BusinessPermission.ViewPrivateProfile or BusinessPermission.ViewMembers) => true,
        _ => false
    };

    public static bool CanAssignRole(string? actorRole, string targetRole) => actorRole switch
    {
        "Owner" => targetRole is "Admin" or "Editor" or "Viewer",
        "Admin" => targetRole is "Editor" or "Viewer",
        _ => false
    };

    public static bool CanManageMember(string? actorRole, string? targetRole) => actorRole switch
    {
        "Owner" => targetRole is "Admin" or "Editor" or "Viewer",
        "Admin" => targetRole is "Editor" or "Viewer",
        _ => false
    };
}

public interface IBusinessService
{
    Task<BusinessProfileResponse> CreateAsync(Guid actorId, BusinessCreateRequest request, CancellationToken cancellationToken);
    Task<BusinessListResponse> ListManagedAsync(Guid actorId, int page, int pageSize, CancellationToken cancellationToken);
    Task<BusinessProfileResponse> GetAsync(Guid businessId, Guid? viewerId, CancellationToken cancellationToken);
    Task<BusinessProfileResponse> UpdateAsync(Guid actorId, Guid businessId, BusinessUpdateRequest request, CancellationToken cancellationToken);
    Task ArchiveAsync(Guid actorId, Guid businessId, CancellationToken cancellationToken);
    Task<BusinessMembersResponse> GetMembersAsync(Guid actorId, Guid businessId, int page, int pageSize, CancellationToken cancellationToken);
    Task<BusinessActivityListResponse> GetActivityAsync(Guid actorId, Guid businessId, int page, int pageSize, CancellationToken cancellationToken);
    Task<BusinessInvitationResponse> InviteAsync(Guid actorId, Guid businessId, CreateBusinessInvitationRequest request, CancellationToken cancellationToken);
    Task<BusinessInvitationsResponse> GetBusinessInvitationsAsync(Guid actorId, Guid businessId, int page, int pageSize, CancellationToken cancellationToken);
    Task<BusinessInvitationsResponse> GetMyInvitationsAsync(Guid actorId, int page, int pageSize, CancellationToken cancellationToken);
    Task<BusinessInvitationResponse> AcceptInvitationAsync(Guid actorId, Guid businessId, Guid invitationId, CancellationToken cancellationToken);
    Task DeclineInvitationAsync(Guid actorId, Guid businessId, Guid invitationId, CancellationToken cancellationToken);
    Task CancelInvitationAsync(Guid actorId, Guid businessId, Guid invitationId, CancellationToken cancellationToken);
    Task<BusinessMemberResponse> UpdateMemberRoleAsync(Guid actorId, Guid businessId, Guid userId, UpdateBusinessMemberRoleRequest request, CancellationToken cancellationToken);
    Task RemoveMemberAsync(Guid actorId, Guid businessId, Guid userId, CancellationToken cancellationToken);
    Task LeaveAsync(Guid actorId, Guid businessId, CancellationToken cancellationToken);
    Task<OwnershipTransferResponse> CreateTransferAsync(Guid actorId, Guid businessId, CreateOwnershipTransferRequest request, CancellationToken cancellationToken);
    Task<OwnershipTransferResponse> AcceptTransferAsync(Guid actorId, Guid businessId, Guid transferId, CancellationToken cancellationToken);
    Task DeclineTransferAsync(Guid actorId, Guid businessId, Guid transferId, CancellationToken cancellationToken);
    Task CancelTransferAsync(Guid actorId, Guid businessId, Guid transferId, CancellationToken cancellationToken);
    Task<IReadOnlyList<OwnershipTransferResponse>> GetMyTransfersAsync(Guid actorId, CancellationToken cancellationToken);
}
