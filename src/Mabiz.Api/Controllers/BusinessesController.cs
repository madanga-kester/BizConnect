using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Mabiz.Api.Controllers;

[ApiController]
[Route("api/v1/businesses")]
public sealed class BusinessesController(IBusinessService businesses) : ControllerBase
{
    [HttpPost]
    [Authorize]
    [ProducesResponseType<BusinessProfileResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<BusinessProfileResponse>> Create(BusinessCreateRequest request, CancellationToken cancellationToken)
    {
        var created = await businesses.CreateAsync(CurrentUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { businessId = Guid.Parse(created.Id) }, created);
    }

    [HttpGet]
    [Authorize]
    [ProducesResponseType<BusinessListResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessListResponse>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default) =>
        Ok(await businesses.ListManagedAsync(CurrentUserId(), page, pageSize, cancellationToken));

    [HttpGet("me/invitations")]
    [Authorize]
    [ProducesResponseType<BusinessInvitationsResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessInvitationsResponse>> MyInvitations([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default) =>
        Ok(await businesses.GetMyInvitationsAsync(CurrentUserId(), page, pageSize, cancellationToken));

    [HttpGet("me/ownership-transfers")]
    [Authorize]
    [ProducesResponseType<IReadOnlyList<OwnershipTransferResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<OwnershipTransferResponse>>> MyOwnershipTransfers(CancellationToken cancellationToken) =>
        Ok(await businesses.GetMyTransfersAsync(CurrentUserId(), cancellationToken));

    [HttpGet("{businessId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<BusinessProfileResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessProfileResponse>> Get(Guid businessId, CancellationToken cancellationToken)
    {
        Guid? viewerId = User.Identity?.IsAuthenticated == true ? CurrentUserId() : null;
        return Ok(await businesses.GetAsync(businessId, viewerId, cancellationToken));
    }

    [HttpPatch("{businessId:guid}")]
    [Authorize]
    [ProducesResponseType<BusinessProfileResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessProfileResponse>> Update(Guid businessId, BusinessUpdateRequest request, CancellationToken cancellationToken) =>
        Ok(await businesses.UpdateAsync(CurrentUserId(), businessId, request, cancellationToken));

    [HttpDelete("{businessId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Archive(Guid businessId, CancellationToken cancellationToken)
    {
        await businesses.ArchiveAsync(CurrentUserId(), businessId, cancellationToken);
        return NoContent();
    }

    [HttpGet("{businessId:guid}/members")]
    [Authorize]
    [ProducesResponseType<BusinessMembersResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessMembersResponse>> Members(Guid businessId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default) =>
        Ok(await businesses.GetMembersAsync(CurrentUserId(), businessId, page, pageSize, cancellationToken));

    [HttpGet("{businessId:guid}/activity")]
    [Authorize]
    [ProducesResponseType<BusinessActivityListResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessActivityListResponse>> Activity(Guid businessId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default) =>
        Ok(await businesses.GetActivityAsync(CurrentUserId(), businessId, page, pageSize, cancellationToken));

    [HttpPost("{businessId:guid}/invitations")]
    [Authorize]
    [EnableRateLimiting("business-write")]
    [ProducesResponseType<BusinessInvitationResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<BusinessInvitationResponse>> Invite(Guid businessId, CreateBusinessInvitationRequest request, CancellationToken cancellationToken)
    {
        var result = await businesses.InviteAsync(CurrentUserId(), businessId, request, cancellationToken);
        return CreatedAtAction(nameof(GetInvitations), new { businessId, page = 1, pageSize = 50 }, result);
    }

    [HttpGet("{businessId:guid}/invitations")]
    [Authorize]
    [ProducesResponseType<BusinessInvitationsResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessInvitationsResponse>> GetInvitations(Guid businessId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default) =>
        Ok(await businesses.GetBusinessInvitationsAsync(CurrentUserId(), businessId, page, pageSize, cancellationToken));

    [HttpPost("{businessId:guid}/invitations/{invitationId:guid}/accept")]
    [Authorize]
    [ProducesResponseType<BusinessInvitationResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessInvitationResponse>> AcceptInvitation(Guid businessId, Guid invitationId, CancellationToken cancellationToken) =>
        Ok(await businesses.AcceptInvitationAsync(CurrentUserId(), businessId, invitationId, cancellationToken));

    [HttpPost("{businessId:guid}/invitations/{invitationId:guid}/decline")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeclineInvitation(Guid businessId, Guid invitationId, CancellationToken cancellationToken)
    {
        await businesses.DeclineInvitationAsync(CurrentUserId(), businessId, invitationId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{businessId:guid}/invitations/{invitationId:guid}")]
    [Authorize]
    public async Task<IActionResult> CancelInvitation(Guid businessId, Guid invitationId, CancellationToken cancellationToken)
    {
        await businesses.CancelInvitationAsync(CurrentUserId(), businessId, invitationId, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{businessId:guid}/members/{userId:guid}/role")]
    [Authorize]
    public async Task<ActionResult<BusinessMemberResponse>> ChangeRole(Guid businessId, Guid userId, UpdateBusinessMemberRoleRequest request, CancellationToken cancellationToken) =>
        Ok(await businesses.UpdateMemberRoleAsync(CurrentUserId(), businessId, userId, request, cancellationToken));

    [HttpDelete("{businessId:guid}/members/{userId:guid}")]
    [Authorize]
    public async Task<IActionResult> RemoveMember(Guid businessId, Guid userId, CancellationToken cancellationToken)
    {
        await businesses.RemoveMemberAsync(CurrentUserId(), businessId, userId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{businessId:guid}/leave")]
    [Authorize]
    public async Task<IActionResult> Leave(Guid businessId, CancellationToken cancellationToken)
    {
        await businesses.LeaveAsync(CurrentUserId(), businessId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{businessId:guid}/ownership-transfers")]
    [Authorize]
    [EnableRateLimiting("business-write")]
    [ProducesResponseType<OwnershipTransferResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<OwnershipTransferResponse>> CreateTransfer(Guid businessId, CreateOwnershipTransferRequest request, CancellationToken cancellationToken)
    {
        var transfer = await businesses.CreateTransferAsync(CurrentUserId(), businessId, request, cancellationToken);
        return CreatedAtAction(nameof(MyOwnershipTransfers), new { }, transfer);
    }

    [HttpPost("{businessId:guid}/ownership-transfers/{transferId:guid}/accept")]
    [Authorize]
    public async Task<ActionResult<OwnershipTransferResponse>> AcceptTransfer(Guid businessId, Guid transferId, CancellationToken cancellationToken) =>
        Ok(await businesses.AcceptTransferAsync(CurrentUserId(), businessId, transferId, cancellationToken));

    [HttpPost("{businessId:guid}/ownership-transfers/{transferId:guid}/decline")]
    [Authorize]
    public async Task<IActionResult> DeclineTransfer(Guid businessId, Guid transferId, CancellationToken cancellationToken)
    {
        await businesses.DeclineTransferAsync(CurrentUserId(), businessId, transferId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{businessId:guid}/ownership-transfers/{transferId:guid}/cancel")]
    [Authorize]
    public async Task<IActionResult> CancelTransfer(Guid businessId, Guid transferId, CancellationToken cancellationToken)
    {
        await businesses.CancelTransferAsync(CurrentUserId(), businessId, transferId, cancellationToken);
        return NoContent();
    }

    private Guid CurrentUserId()
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var userId)) throw Application.Services.ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity.");
        return userId;
    }
}
