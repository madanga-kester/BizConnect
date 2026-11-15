using System.Data;
using System.Text.Json;
using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using BizConnect.Domain.Accounts;
using BizConnect.Domain.Businesses;
using BizConnect.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BizConnect.Infrastructure.Services;

public sealed class BusinessService(AppDbContext db, UserManager<BizConnectUser> users, TimeProvider clock, INotificationService notificationWriter) : IBusinessService
{
    private static readonly string[] SupportedCounties = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos", "Kajiado", "Kakamega", "Kilifi"];
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly HashSet<string> SocialPlatforms = new(StringComparer.OrdinalIgnoreCase)
    { "facebook", "instagram", "tiktok", "linkedin", "x", "youtube", "website" };

    public async Task<BusinessProfileResponse> CreateAsync(Guid actorId, BusinessCreateRequest request, CancellationToken cancellationToken)
    {
        ValidateBusinessInput(request.County, request.Town, request.Neighbourhood, request.ServiceAreas, request.SocialLinks);
        var owner = await users.FindByIdAsync(actorId.ToString()) ?? throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The account was not found.");
        var profile = await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == actorId, cancellationToken)
            ?? throw ApiException.Conflict("PROFILE_REQUIRED", "Complete your user profile before creating a business.");
        var now = clock.GetUtcNow();
        var business = new Business
        {
            Id = Guid.NewGuid(), OwnerUserId = actorId, Slug = await UniqueSlugAsync(request.Name, cancellationToken),
            Name = request.Name.Trim(), BusinessType = request.BusinessType, Category = request.Category.Trim(), Subcategory = request.Subcategory.Trim(),
            Description = request.Description.Trim(), About = request.About.Trim(), Founder = request.Founder.Trim(), OriginStory = request.OriginStory.Trim(),
            County = request.County.Trim(), Town = request.Town.Trim(), Neighbourhood = request.Neighbourhood.Trim(),
            ServiceAreas = NormalizeList(request.ServiceAreas), Phone = NormalizePhone(request.Phone), Whatsapp = NormalizePhone(request.Whatsapp),
            Email = NormalizeNullable(request.Email)?.ToLowerInvariant(), Website = NormalizeNullable(request.Website), PriceRange = request.PriceRange,
            OperatingHours = request.OperatingHours.Trim(), Logo = NormalizeNullable(request.Logo), Cover = NormalizeNullable(request.Cover),
            Visibility = request.Visibility, SocialLinksJson = SerializeLinks(request.SocialLinks), Status = BusinessStatuses.Active,
            CreatedAtUtc = now, UpdatedAtUtc = now, Version = Guid.NewGuid()
        };
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        db.Businesses.Add(business);
        db.BusinessMemberships.Add(new BusinessMembership
        {
            Id = Guid.NewGuid(), BusinessId = business.Id, UserId = actorId, Role = BusinessRoles.Owner,
            GrantedByUserId = actorId, JoinedAtUtc = now, UpdatedAtUtc = now, Version = Guid.NewGuid()
        });
        AddActivity(business.Id, actorId, "business.created", $"Created business {business.Name}.", now);
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return Map(business, BusinessRoles.Owner);
    }

    public async Task<BusinessListResponse> ListManagedAsync(Guid actorId, int page, int pageSize, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePage(page, pageSize);
        var query = from membership in db.BusinessMemberships.AsNoTracking()
                    join business in db.Businesses.AsNoTracking() on membership.BusinessId equals business.Id
                    where membership.UserId == actorId && membership.RevokedAtUtc == null && business.Status == BusinessStatuses.Active
                    orderby business.UpdatedAtUtc descending
                    select new { Business = business, membership.Role };
        var total = await query.CountAsync(cancellationToken);
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new BusinessListResponse(rows.Select(x => Map(x.Business, x.Role)).ToList(), total, page, pageSize);
    }

    public async Task<BusinessProfileResponse> GetAsync(Guid businessId, Guid? viewerId, CancellationToken cancellationToken)
    {
        var business = await db.Businesses.AsNoTracking().SingleOrDefaultAsync(x => x.Id == businessId && x.Status == BusinessStatuses.Active, cancellationToken)
            ?? throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");
        string? role = null;
        if (viewerId.HasValue)
            role = await ActiveRoleAsync(businessId, viewerId.Value, cancellationToken);
        if (business.Visibility == BusinessVisibility.Private && role is null)
            throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");
        return Map(business, role);
    }

    public async Task<BusinessProfileResponse> UpdateAsync(Guid actorId, Guid businessId, BusinessUpdateRequest request, CancellationToken cancellationToken)
    {
        var business = await GetActiveBusinessAsync(businessId, cancellationToken);
        var role = await RequirePermissionAsync(actorId, businessId, BusinessPermission.EditProfile, cancellationToken);
        ValidateBusinessInput(request.County ?? business.County, request.Town ?? business.Town, request.Neighbourhood ?? business.Neighbourhood,
            request.ServiceAreas ?? business.ServiceAreas.ToList(), request.SocialLinks);
        if (request.Name is not null)
        {
            business.Name = request.Name.Trim();
            business.Slug = await UniqueSlugAsync(request.Name, cancellationToken, business.Id);
        }
        if (request.BusinessType is not null) business.BusinessType = request.BusinessType;
        if (request.Category is not null) business.Category = request.Category.Trim();
        if (request.Subcategory is not null) business.Subcategory = request.Subcategory.Trim();
        if (request.Description is not null) business.Description = request.Description.Trim();
        if (request.About is not null) business.About = request.About.Trim();
        if (request.Founder is not null) business.Founder = request.Founder.Trim();
        if (request.OriginStory is not null) business.OriginStory = request.OriginStory.Trim();
        if (request.County is not null) business.County = request.County.Trim();
        if (request.Town is not null) business.Town = request.Town.Trim();
        if (request.Neighbourhood is not null) business.Neighbourhood = request.Neighbourhood.Trim();
        if (request.ServiceAreas is not null) business.ServiceAreas = NormalizeList(request.ServiceAreas);
        if (request.Phone is not null) business.Phone = NormalizePhone(request.Phone);
        if (request.Whatsapp is not null) business.Whatsapp = NormalizePhone(request.Whatsapp);
        if (request.Email is not null) business.Email = NormalizeNullable(request.Email)?.ToLowerInvariant();
        if (request.Website is not null) business.Website = NormalizeNullable(request.Website);
        if (request.PriceRange is not null) business.PriceRange = request.PriceRange;
        if (request.OperatingHours is not null) business.OperatingHours = request.OperatingHours.Trim();
        if (request.Logo is not null) business.Logo = NormalizeNullable(request.Logo);
        if (request.Cover is not null) business.Cover = NormalizeNullable(request.Cover);
        if (request.Visibility is not null) business.Visibility = request.Visibility;
        if (request.SocialLinks is not null) business.SocialLinksJson = SerializeLinks(request.SocialLinks);
        business.UpdatedAtUtc = clock.GetUtcNow();
        business.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "business.updated", $"Updated business {business.Name}.", business.UpdatedAtUtc);
        var followers = await db.BusinessFollows.AsNoTracking().Where(x => x.BusinessId == businessId).Select(x => x.UserId).ToListAsync(cancellationToken);
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actorId, followers, "business_update", "Business update",
            $"{business.Name} updated its business profile.", "business", businessId, $"business-update:{businessId:N}:{business.Version:N}", BusinessId: businessId), cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return Map(business, role);
    }

    public async Task ArchiveAsync(Guid actorId, Guid businessId, CancellationToken cancellationToken)
    {
        var business = await GetActiveBusinessAsync(businessId, cancellationToken);
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.Archive, cancellationToken);
        var now = clock.GetUtcNow();
        business.Status = BusinessStatuses.Archived;
        business.ArchivedAtUtc = now;
        business.UpdatedAtUtc = now;
        business.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "business.archived", $"Archived business {business.Name}.", now);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<BusinessMembersResponse> GetMembersAsync(Guid actorId, Guid businessId, int page, int pageSize, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePage(page, pageSize);
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.ViewMembers, cancellationToken);
        var query = from membership in db.BusinessMemberships.AsNoTracking()
                    join user in db.Users.AsNoTracking() on membership.UserId equals user.Id
                    join profile in db.UserProfiles.AsNoTracking() on user.Id equals profile.UserId
                    where membership.BusinessId == businessId && membership.RevokedAtUtc == null
                    orderby membership.Role == BusinessRoles.Owner descending, profile.Name
                    select new { membership.UserId, membership.Role, membership.JoinedAtUtc, profile.Name, user.Email, profile.Avatar };
        var total = await query.CountAsync(cancellationToken);
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new BusinessMembersResponse(rows.Select(x => new BusinessMemberResponse(x.UserId.ToString(), x.Role, x.JoinedAtUtc, x.Name, x.Email, x.Avatar)).ToList(), total, page, pageSize);
    }

    public async Task<BusinessActivityListResponse> GetActivityAsync(Guid actorId, Guid businessId, int page, int pageSize, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePage(page, pageSize);
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.ViewActivity, cancellationToken);
        var query = from activity in db.BusinessActivities.AsNoTracking()
                    join profile in db.UserProfiles.AsNoTracking() on activity.ActorUserId equals profile.UserId
                    where activity.BusinessId == businessId
                    orderby activity.CreatedAtUtc descending
                    select new BusinessActivityResponse(activity.Id.ToString(), activity.BusinessId.ToString(), activity.ActorUserId.ToString(), profile.Name, activity.EventType, activity.Summary, activity.CreatedAtUtc);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new BusinessActivityListResponse(items, total, page, pageSize);
    }

    public async Task<BusinessInvitationResponse> InviteAsync(Guid actorId, Guid businessId, CreateBusinessInvitationRequest request, CancellationToken cancellationToken)
    {
        var business = await GetActiveBusinessAsync(businessId, cancellationToken);
        var actorRole = await RequirePermissionAsync(actorId, businessId, BusinessPermission.ManageTeam, cancellationToken);
        if (!BusinessAccessControl.CanAssignRole(actorRole, request.Role))
            throw ApiException.Forbidden("ROLE_ASSIGNMENT_DENIED", "Your role cannot assign the requested business role.");
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var invitee = await db.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail && x.IsActive, cancellationToken)
            ?? throw ApiException.NotFound("INVITEE_NOT_FOUND", "Invitations can only be sent to an existing active account.");
        if (invitee.Id == actorId) throw ApiException.Conflict("SELF_INVITATION", "You already have access to this business.");
        var now = clock.GetUtcNow();
        var member = await db.BusinessMemberships.SingleOrDefaultAsync(x => x.BusinessId == businessId && x.UserId == invitee.Id, cancellationToken);
        if (member?.RevokedAtUtc is null && member is not null)
            throw ApiException.Conflict("ALREADY_MEMBER", "This account is already an active business member.");
        var oldInvites = await db.BusinessInvitations.Where(x => x.BusinessId == businessId && x.InvitedUserId == invitee.Id && x.Status == InvitationStatuses.Pending).ToListAsync(cancellationToken);
        foreach (var old in oldInvites)
        {
            if (old.ExpiresAtUtc > now) throw ApiException.Conflict("INVITATION_PENDING", "A pending invitation already exists for this account.");
            old.Status = InvitationStatuses.Expired;
            old.Version = Guid.NewGuid();
        }
        var invitation = new BusinessInvitation
        {
            Id = Guid.NewGuid(), BusinessId = businessId, InvitedUserId = invitee.Id, InvitedByUserId = actorId,
            Role = request.Role, Status = InvitationStatuses.Pending, CreatedAtUtc = now, ExpiresAtUtc = now.AddDays(7), Version = Guid.NewGuid()
        };
        db.BusinessInvitations.Add(invitation);
        AddActivity(businessId, actorId, "team.invited", $"Invited {invitee.Email} as {request.Role}.", now);
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actorId, [invitee.Id], "team_invitation", "Business team invitation",
            $"You were invited to join {business.Name} as {request.Role}.", "team", businessId, $"team-invitation:{invitation.Id:N}", BusinessId: businessId), cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await MapInvitationAsync(invitation, cancellationToken);
    }

    public async Task<BusinessInvitationsResponse> GetBusinessInvitationsAsync(Guid actorId, Guid businessId, int page, int pageSize, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePage(page, pageSize);
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.ManageTeam, cancellationToken);
        var now = clock.GetUtcNow();
        var expired = await db.BusinessInvitations.Where(x => x.BusinessId == businessId && x.Status == InvitationStatuses.Pending && x.ExpiresAtUtc <= now).ToListAsync(cancellationToken);
        foreach (var invitation in expired) { invitation.Status = InvitationStatuses.Expired; invitation.Version = Guid.NewGuid(); }
        if (expired.Count > 0) await db.SaveChangesAsync(cancellationToken);
        var query = db.BusinessInvitations.AsNoTracking().Where(x => x.BusinessId == businessId).OrderByDescending(x => x.CreatedAtUtc);
        var total = await query.CountAsync(cancellationToken);
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        var items = new List<BusinessInvitationResponse>(rows.Count);
        foreach (var row in rows) items.Add(await MapInvitationAsync(row, cancellationToken));
        return new BusinessInvitationsResponse(items, total, page, pageSize);
    }

    public async Task<BusinessInvitationsResponse> GetMyInvitationsAsync(Guid actorId, int page, int pageSize, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePage(page, pageSize);
        var now = clock.GetUtcNow();
        var query = db.BusinessInvitations.AsNoTracking().Where(x => x.InvitedUserId == actorId && x.Status == InvitationStatuses.Pending && x.ExpiresAtUtc > now)
            .OrderByDescending(x => x.CreatedAtUtc);
        var total = await query.CountAsync(cancellationToken);
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        var items = new List<BusinessInvitationResponse>(rows.Count);
        foreach (var row in rows) items.Add(await MapInvitationAsync(row, cancellationToken));
        return new BusinessInvitationsResponse(items, total, page, pageSize);
    }

    public async Task<BusinessInvitationResponse> AcceptInvitationAsync(Guid actorId, Guid businessId, Guid invitationId, CancellationToken cancellationToken)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var invitation = await db.BusinessInvitations.SingleOrDefaultAsync(x => x.Id == invitationId && x.BusinessId == businessId && x.InvitedUserId == actorId, cancellationToken)
            ?? throw ApiException.NotFound("INVITATION_NOT_FOUND", "The invitation was not found.");
        var now = clock.GetUtcNow();
        EnsurePending(invitation.Status, invitation.ExpiresAtUtc, now, "INVITATION");
        var business = await GetActiveBusinessAsync(businessId, cancellationToken);
        var membership = await db.BusinessMemberships.SingleOrDefaultAsync(x => x.BusinessId == businessId && x.UserId == actorId, cancellationToken);
        if (membership is null)
        {
            membership = new BusinessMembership { Id = Guid.NewGuid(), BusinessId = businessId, UserId = actorId, Role = invitation.Role,
                GrantedByUserId = invitation.InvitedByUserId, JoinedAtUtc = now, UpdatedAtUtc = now, Version = Guid.NewGuid() };
            db.BusinessMemberships.Add(membership);
        }
        else
        {
            if (membership.RevokedAtUtc is null) throw ApiException.Conflict("ALREADY_MEMBER", "This account is already an active business member.");
            membership.Role = invitation.Role; membership.GrantedByUserId = invitation.InvitedByUserId;
            membership.RevokedAtUtc = null; membership.JoinedAtUtc = now; membership.UpdatedAtUtc = now; membership.Version = Guid.NewGuid();
        }
        invitation.Status = InvitationStatuses.Accepted; invitation.RespondedAtUtc = now; invitation.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "team.invitation_accepted", $"Accepted invitation to {business.Name} as {invitation.Role}.", now);
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actorId, [invitation.InvitedByUserId], "team_invitation_accepted", "Invitation accepted",
            $"A team invitation for {business.Name} was accepted.", "team", businessId, $"team-invitation-accepted:{invitation.Id:N}", BusinessId: businessId), cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return await MapInvitationAsync(invitation, cancellationToken);
    }

    public async Task DeclineInvitationAsync(Guid actorId, Guid businessId, Guid invitationId, CancellationToken cancellationToken)
    {
        var invitation = await GetRecipientInvitationAsync(actorId, businessId, invitationId, cancellationToken);
        var now = clock.GetUtcNow(); EnsurePending(invitation.Status, invitation.ExpiresAtUtc, now, "INVITATION");
        invitation.Status = InvitationStatuses.Declined; invitation.RespondedAtUtc = now; invitation.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "team.invitation_declined", "A business invitation was declined.", now);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task CancelInvitationAsync(Guid actorId, Guid businessId, Guid invitationId, CancellationToken cancellationToken)
    {
        var invitation = await db.BusinessInvitations.SingleOrDefaultAsync(x => x.Id == invitationId && x.BusinessId == businessId, cancellationToken)
            ?? throw ApiException.NotFound("INVITATION_NOT_FOUND", "The invitation was not found.");
        var actorRole = await RequirePermissionAsync(actorId, businessId, BusinessPermission.ManageTeam, cancellationToken);
        if (!BusinessAccessControl.CanManageMember(actorRole, invitation.Role)) throw ApiException.Forbidden("MEMBER_MANAGEMENT_DENIED", "Your role cannot cancel this invitation.");
        EnsurePending(invitation.Status, invitation.ExpiresAtUtc, clock.GetUtcNow(), "INVITATION");
        var now = clock.GetUtcNow(); invitation.Status = InvitationStatuses.Cancelled; invitation.CancelledAtUtc = now; invitation.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "team.invitation_cancelled", "Cancelled a team invitation.", now);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<BusinessMemberResponse> UpdateMemberRoleAsync(Guid actorId, Guid businessId, Guid userId, UpdateBusinessMemberRoleRequest request, CancellationToken cancellationToken)
    {
        var member = await db.BusinessMemberships.SingleOrDefaultAsync(x => x.BusinessId == businessId && x.UserId == userId && x.RevokedAtUtc == null, cancellationToken)
            ?? throw ApiException.NotFound("MEMBER_NOT_FOUND", "The active business member was not found.");
        var actorRole = await RequirePermissionAsync(actorId, businessId, BusinessPermission.ManageTeam, cancellationToken);
        if (!BusinessAccessControl.CanManageMember(actorRole, member.Role) || !BusinessAccessControl.CanAssignRole(actorRole, request.Role))
            throw ApiException.Forbidden("ROLE_ASSIGNMENT_DENIED", "Your role cannot change this member to the requested role.");
        var oldRole = member.Role;
        member.Role = request.Role; member.UpdatedAtUtc = clock.GetUtcNow(); member.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "team.role_changed", $"Changed a team member role from {oldRole} to {request.Role}.", member.UpdatedAtUtc);
        var businessName = await db.Businesses.AsNoTracking().Where(x => x.Id == businessId).Select(x => x.Name).SingleAsync(cancellationToken);
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actorId, [userId], "team_role_changed", "Business role updated",
            $"Your role in {businessName} changed from {oldRole} to {request.Role}.", "team", businessId, $"team-role:{member.Id:N}:{member.Version:N}", BusinessId: businessId), cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await MapMemberAsync(member, cancellationToken);
    }

    public async Task RemoveMemberAsync(Guid actorId, Guid businessId, Guid userId, CancellationToken cancellationToken)
    {
        var member = await db.BusinessMemberships.SingleOrDefaultAsync(x => x.BusinessId == businessId && x.UserId == userId && x.RevokedAtUtc == null, cancellationToken)
            ?? throw ApiException.NotFound("MEMBER_NOT_FOUND", "The active business member was not found.");
        var actorRole = await RequirePermissionAsync(actorId, businessId, BusinessPermission.ManageTeam, cancellationToken);
        if (userId == actorId) throw ApiException.Conflict("USE_LEAVE_ENDPOINT", "Use the leave endpoint to remove your own membership.");
        if (!BusinessAccessControl.CanManageMember(actorRole, member.Role)) throw ApiException.Forbidden("MEMBER_MANAGEMENT_DENIED", "Your role cannot remove this member.");
        var now = clock.GetUtcNow(); member.RevokedAtUtc = now; member.UpdatedAtUtc = now; member.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "team.member_removed", "Removed a business team member.", now);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task LeaveAsync(Guid actorId, Guid businessId, CancellationToken cancellationToken)
    {
        var membership = await db.BusinessMemberships.SingleOrDefaultAsync(x => x.BusinessId == businessId && x.UserId == actorId && x.RevokedAtUtc == null, cancellationToken)
            ?? throw ApiException.NotFound("MEMBER_NOT_FOUND", "The active membership was not found.");
        if (membership.Role == BusinessRoles.Owner)
            throw ApiException.Conflict("OWNER_CANNOT_LEAVE", "Transfer ownership before leaving this business.");
        var now = clock.GetUtcNow(); membership.RevokedAtUtc = now; membership.UpdatedAtUtc = now; membership.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "team.member_left", "A team member left the business.", now);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<OwnershipTransferResponse> CreateTransferAsync(Guid actorId, Guid businessId, CreateOwnershipTransferRequest request, CancellationToken cancellationToken)
    {
        var business = await GetActiveBusinessAsync(businessId, cancellationToken);
        var role = await RequirePermissionAsync(actorId, businessId, BusinessPermission.TransferOwnership, cancellationToken);
        if (role != BusinessRoles.Owner) throw ApiException.Forbidden("OWNERSHIP_TRANSFER_DENIED", "Only the current owner can transfer business ownership.");
        var recipient = await FindExistingUserAsync(request.NewOwnerEmail, cancellationToken)
            ?? throw ApiException.NotFound("TRANSFER_RECIPIENT_NOT_FOUND", "The new owner must already have an active account.");
        if (recipient.Id == actorId) throw ApiException.Conflict("SELF_TRANSFER", "The current owner already owns this business.");
        var now = clock.GetUtcNow();
        var activeTransfer = await db.BusinessOwnershipTransfers.AnyAsync(x => x.BusinessId == businessId && x.Status == OwnershipTransferStatuses.Pending && x.ExpiresAtUtc > now, cancellationToken);
        if (activeTransfer) throw ApiException.Conflict("TRANSFER_PENDING", "A transfer request is already pending for this business.");
        var expired = await db.BusinessOwnershipTransfers.Where(x => x.BusinessId == businessId && x.Status == OwnershipTransferStatuses.Pending).ToListAsync(cancellationToken);
        foreach (var item in expired) { item.Status = OwnershipTransferStatuses.Expired; item.Version = Guid.NewGuid(); }
        var transfer = new BusinessOwnershipTransfer
        {
            Id = Guid.NewGuid(), BusinessId = businessId, FromUserId = actorId, ToUserId = recipient.Id,
            RequestedByUserId = actorId, Status = OwnershipTransferStatuses.Pending, CreatedAtUtc = now,
            ExpiresAtUtc = now.AddDays(7), Version = Guid.NewGuid()
        };
        db.BusinessOwnershipTransfers.Add(transfer);
        AddActivity(businessId, actorId, "ownership.transfer_requested", $"Requested ownership transfer to {recipient.Email}.", now);
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actorId, [recipient.Id], "ownership_transfer", "Ownership transfer requested",
            $"You received an ownership transfer request for {business.Name}.", "team", businessId, $"ownership-transfer-request:{transfer.Id:N}", BusinessId: businessId), cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await MapTransferAsync(transfer, cancellationToken);
    }

    public async Task<OwnershipTransferResponse> AcceptTransferAsync(Guid actorId, Guid businessId, Guid transferId, CancellationToken cancellationToken)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var transfer = await db.BusinessOwnershipTransfers.SingleOrDefaultAsync(x => x.Id == transferId && x.BusinessId == businessId && x.ToUserId == actorId, cancellationToken)
            ?? throw ApiException.NotFound("TRANSFER_NOT_FOUND", "The ownership transfer was not found.");
        var now = clock.GetUtcNow(); EnsurePending(transfer.Status, transfer.ExpiresAtUtc, now, "TRANSFER");
        var business = await GetActiveBusinessAsync(businessId, cancellationToken);
        if (business.OwnerUserId != transfer.FromUserId) throw ApiException.Conflict("OWNER_CHANGED", "The current owner changed before this transfer was accepted.");
        var oldOwner = await db.BusinessMemberships.SingleOrDefaultAsync(x => x.BusinessId == businessId && x.UserId == transfer.FromUserId && x.Role == BusinessRoles.Owner && x.RevokedAtUtc == null, cancellationToken)
            ?? throw ApiException.Conflict("OWNER_MEMBERSHIP_MISSING", "The current owner membership is inconsistent.");
        var newOwner = await db.BusinessMemberships.SingleOrDefaultAsync(x => x.BusinessId == businessId && x.UserId == actorId, cancellationToken);
        oldOwner.Role = BusinessRoles.Admin; oldOwner.UpdatedAtUtc = now; oldOwner.Version = Guid.NewGuid();
        // Save the owner demotion first to satisfy the database's one-active-owner partial unique index.
        await db.SaveChangesAsync(cancellationToken);
        if (newOwner is null)
        {
            newOwner = new BusinessMembership { Id = Guid.NewGuid(), BusinessId = businessId, UserId = actorId,
                Role = BusinessRoles.Owner, GrantedByUserId = transfer.FromUserId, JoinedAtUtc = now, UpdatedAtUtc = now, Version = Guid.NewGuid() };
            db.BusinessMemberships.Add(newOwner);
        }
        else
        {
            newOwner.Role = BusinessRoles.Owner; newOwner.RevokedAtUtc = null; newOwner.GrantedByUserId = transfer.FromUserId;
            newOwner.JoinedAtUtc = newOwner.JoinedAtUtc == default ? now : newOwner.JoinedAtUtc; newOwner.UpdatedAtUtc = now; newOwner.Version = Guid.NewGuid();
        }
        business.OwnerUserId = actorId; business.UpdatedAtUtc = now; business.Version = Guid.NewGuid();
        transfer.Status = OwnershipTransferStatuses.Accepted; transfer.RespondedAtUtc = now; transfer.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "ownership.transferred", "Accepted ownership transfer; the previous owner remains an Admin.", now);
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actorId, [transfer.FromUserId], "ownership_transfer", "Business ownership transferred",
            $"Ownership of {business.Name} was transferred; you remain an Admin.", "team", businessId, $"ownership-transfer-accepted:{transfer.Id:N}", BusinessId: businessId), cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return await MapTransferAsync(transfer, cancellationToken);
    }

    public async Task DeclineTransferAsync(Guid actorId, Guid businessId, Guid transferId, CancellationToken cancellationToken)
    {
        var transfer = await db.BusinessOwnershipTransfers.SingleOrDefaultAsync(x => x.Id == transferId && x.BusinessId == businessId && x.ToUserId == actorId, cancellationToken)
            ?? throw ApiException.NotFound("TRANSFER_NOT_FOUND", "The ownership transfer was not found.");
        var now = clock.GetUtcNow(); EnsurePending(transfer.Status, transfer.ExpiresAtUtc, now, "TRANSFER");
        transfer.Status = OwnershipTransferStatuses.Declined; transfer.RespondedAtUtc = now; transfer.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "ownership.transfer_declined", "Declined an ownership transfer.", now);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task CancelTransferAsync(Guid actorId, Guid businessId, Guid transferId, CancellationToken cancellationToken)
    {
        var transfer = await db.BusinessOwnershipTransfers.SingleOrDefaultAsync(x => x.Id == transferId && x.BusinessId == businessId && x.FromUserId == actorId, cancellationToken)
            ?? throw ApiException.NotFound("TRANSFER_NOT_FOUND", "The ownership transfer was not found.");
        var now = clock.GetUtcNow(); EnsurePending(transfer.Status, transfer.ExpiresAtUtc, now, "TRANSFER");
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.TransferOwnership, cancellationToken);
        transfer.Status = OwnershipTransferStatuses.Cancelled; transfer.CancelledAtUtc = now; transfer.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "ownership.transfer_cancelled", "Cancelled an ownership transfer request.", now);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<OwnershipTransferResponse>> GetMyTransfersAsync(Guid actorId, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var transfers = await db.BusinessOwnershipTransfers.AsNoTracking().Where(x => (x.ToUserId == actorId || x.FromUserId == actorId) && x.Status == OwnershipTransferStatuses.Pending && x.ExpiresAtUtc > now)
            .OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
        var result = new List<OwnershipTransferResponse>(transfers.Count);
        foreach (var transfer in transfers) result.Add(await MapTransferAsync(transfer, cancellationToken));
        return result;
    }

    private async Task<Business> GetActiveBusinessAsync(Guid businessId, CancellationToken cancellationToken) =>
        await db.Businesses.SingleOrDefaultAsync(x => x.Id == businessId && x.Status == BusinessStatuses.Active, cancellationToken)
        ?? throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");

    private async Task<string?> ActiveRoleAsync(Guid businessId, Guid userId, CancellationToken cancellationToken) =>
        await db.BusinessMemberships.AsNoTracking().Where(x => x.BusinessId == businessId && x.UserId == userId && x.RevokedAtUtc == null)
            .Select(x => x.Role).SingleOrDefaultAsync(cancellationToken);

    private async Task<string> RequirePermissionAsync(Guid userId, Guid businessId, BusinessPermission permission, CancellationToken cancellationToken)
    {
        var role = await ActiveRoleAsync(businessId, userId, cancellationToken);
        if (role is null) throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");
        if (!BusinessAccessControl.Allows(role, permission)) throw ApiException.Forbidden("BUSINESS_PERMISSION_DENIED", "Your business role does not permit this operation.");
        return role;
    }

    private async Task<BusinessInvitation> GetRecipientInvitationAsync(Guid actorId, Guid businessId, Guid invitationId, CancellationToken cancellationToken) =>
        await db.BusinessInvitations.SingleOrDefaultAsync(x => x.Id == invitationId && x.BusinessId == businessId && x.InvitedUserId == actorId, cancellationToken)
        ?? throw ApiException.NotFound("INVITATION_NOT_FOUND", "The invitation was not found.");

    private static void EnsurePending(string status, DateTimeOffset expiresAt, DateTimeOffset now, string kind)
    {
        if (status != InvitationStatuses.Pending || expiresAt <= now)
            throw ApiException.Conflict($"{kind}_NOT_PENDING", $"The {kind.ToLowerInvariant()} is expired, already used, or no longer pending.");
    }

    private async Task<BizConnectUser?> FindExistingUserAsync(string email, CancellationToken cancellationToken)
    {
        var normalized = email.Trim().ToUpperInvariant();
        return await db.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalized && x.IsActive, cancellationToken);
    }

    private async Task<BusinessInvitationResponse> MapInvitationAsync(BusinessInvitation invitation, CancellationToken cancellationToken)
    {
        var businessName = await db.Businesses.Where(x => x.Id == invitation.BusinessId).Select(x => x.Name).SingleAsync(cancellationToken);
        var invitee = await users.FindByIdAsync(invitation.InvitedUserId.ToString());
        var inviterProfile = await db.UserProfiles.AsNoTracking().Where(x => x.UserId == invitation.InvitedByUserId).Select(x => x.Name).SingleOrDefaultAsync(cancellationToken);
        return new BusinessInvitationResponse(invitation.Id.ToString(), invitation.BusinessId.ToString(), businessName,
            invitation.InvitedUserId.ToString(), invitee?.Email ?? string.Empty, invitation.Role, invitation.Status,
            invitation.CreatedAtUtc, invitation.ExpiresAtUtc, invitation.InvitedByUserId.ToString(), inviterProfile ?? "BizConnect user");
    }

    private async Task<OwnershipTransferResponse> MapTransferAsync(BusinessOwnershipTransfer transfer, CancellationToken cancellationToken)
    {
        var businessName = await db.Businesses.Where(x => x.Id == transfer.BusinessId).Select(x => x.Name).SingleAsync(cancellationToken);
        var fromName = await db.UserProfiles.AsNoTracking().Where(x => x.UserId == transfer.FromUserId).Select(x => x.Name).SingleOrDefaultAsync(cancellationToken) ?? "BizConnect user";
        var recipient = await users.FindByIdAsync(transfer.ToUserId.ToString());
        return new OwnershipTransferResponse(transfer.Id.ToString(), transfer.BusinessId.ToString(), businessName,
            transfer.FromUserId.ToString(), fromName, transfer.ToUserId.ToString(), recipient?.Email ?? string.Empty,
            transfer.Status, transfer.CreatedAtUtc, transfer.ExpiresAtUtc);
    }

    private async Task<BusinessMemberResponse> MapMemberAsync(BusinessMembership membership, CancellationToken cancellationToken)
    {
        var profile = await db.UserProfiles.AsNoTracking().SingleAsync(x => x.UserId == membership.UserId, cancellationToken);
        var user = await users.FindByIdAsync(membership.UserId.ToString());
        return new BusinessMemberResponse(membership.UserId.ToString(), membership.Role, membership.JoinedAtUtc, profile.Name, user?.Email, profile.Avatar);
    }

    private void AddActivity(Guid businessId, Guid actorId, string eventType, string summary, DateTimeOffset now) =>
        db.BusinessActivities.Add(new BusinessActivity { Id = Guid.NewGuid(), BusinessId = businessId, ActorUserId = actorId,
            EventType = eventType, Summary = summary, CreatedAtUtc = now });

    private static BusinessProfileResponse Map(Business business, string? role)
    {
        Dictionary<string, string> links;
        try { links = JsonSerializer.Deserialize<Dictionary<string, string>>(business.SocialLinksJson, JsonOptions) ?? new(StringComparer.OrdinalIgnoreCase); }
        catch (JsonException) { links = new(StringComparer.OrdinalIgnoreCase); }
        return new BusinessProfileResponse(business.Id.ToString(), business.OwnerUserId.ToString(), business.Slug, business.Name,
            business.BusinessType, business.Category, business.Subcategory, business.Description, business.About, business.Founder,
            business.OwnerUserId.ToString(), business.OriginStory, business.County, business.Town, business.Neighbourhood,
            business.ServiceAreas, business.Phone, business.Whatsapp, business.Email, business.Website, business.PriceRange,
            business.OperatingHours, business.Logo, business.Cover, business.Visibility, business.Status, links,
            business.CreatedAtUtc, business.UpdatedAtUtc, role);
    }

    private async Task<string> UniqueSlugAsync(string name, CancellationToken cancellationToken, Guid? exceptBusinessId = null)
    {
        var baseSlug = new string(name.Trim().ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());
        baseSlug = string.Join('-', baseSlug.Split('-', StringSplitOptions.RemoveEmptyEntries));
        if (baseSlug.Length == 0) baseSlug = "business";
        if (baseSlug.Length > 115) baseSlug = baseSlug[..115].TrimEnd('-');
        var slug = baseSlug;
        for (var suffix = 2; await db.Businesses.AnyAsync(x => x.Slug == slug && x.Id != exceptBusinessId, cancellationToken); suffix++)
        {
            var tail = $"-{suffix}";
            slug = baseSlug[..Math.Min(baseSlug.Length, 150 - tail.Length)] + tail;
        }
        return slug;
    }

    private static void ValidateBusinessInput(string county, string town, string neighbourhood, IEnumerable<string> serviceAreas, IDictionary<string, string>? socialLinks)
    {
        if (!SupportedCounties.Contains(county.Trim(), StringComparer.OrdinalIgnoreCase))
            throw ApiException.BadRequest("UNSUPPORTED_COUNTY", "Select one of the counties currently available in the BizConnect location list.");
        if (string.IsNullOrWhiteSpace(town)) throw ApiException.BadRequest("TOWN_REQUIRED", "A town is required.");
        if (string.IsNullOrWhiteSpace(neighbourhood)) throw ApiException.BadRequest("NEIGHBOURHOOD_REQUIRED", "A neighbourhood or town-level area is required.");
        if (serviceAreas.Any(x => string.IsNullOrWhiteSpace(x) || x.Length > 100)) throw ApiException.BadRequest("INVALID_SERVICE_AREA", "Service areas must be non-empty and at most 100 characters.");
        if (socialLinks is not null && socialLinks.Any(x => !SocialPlatforms.Contains(x.Key) || x.Value.Length > 2048 || !Uri.TryCreate(x.Value, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp)))
            throw ApiException.BadRequest("INVALID_SOCIAL_LINK", "Social links must use a supported platform key and an absolute HTTP(S) URL.");
    }

    private static string[] NormalizeList(IEnumerable<string> values) => values.Select(x => x.Trim()).Where(x => x.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    private static string? NormalizeNullable(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string? NormalizePhone(string? value)
    {
        var phone = NormalizeNullable(value);
        return phone is null ? null : phone.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
    }
    private static string SerializeLinks(IDictionary<string, string>? links) => JsonSerializer.Serialize(
        (links ?? new Dictionary<string, string>()).Where(x => !string.IsNullOrWhiteSpace(x.Value))
            .ToDictionary(x => x.Key.ToLowerInvariant(), x => x.Value.Trim()), JsonOptions);
    private static (int page, int pageSize) NormalizePage(int page, int pageSize) => (Math.Max(1, page), Math.Clamp(pageSize, 1, 100));
}
