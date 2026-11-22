using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mabiz.Application.Contracts.MenuContracts;
using Mabiz.Application.Interfaces;

namespace Mabiz.Api.Controllers;

[ApiController, Authorize, Route("api/v1/menu")]
public sealed class MenuController(IMenuService menu) : ControllerBase
{
    [HttpGet("settings")] public Task<MenuSettingsResponse> GetSettings(CancellationToken ct) => menu.GetSettingsAsync(CurrentUserId(), ct);
    [HttpPut("settings")] public Task<MenuSettingsResponse> UpdateSettings(UpdateMenuSettingsRequest request, CancellationToken ct) => menu.UpdateSettingsAsync(CurrentUserId(), request, ct);
    [HttpPost("account/export")] public Task<AccountExportResponse> RequestExport(RequestAccountExportRequest request, CancellationToken ct) => menu.RequestExportAsync(CurrentUserId(), request, ct);
    [HttpPost("account/deletion")] public Task<AccountDeletionResponse> RequestDeletion(RequestAccountDeletionRequest request, CancellationToken ct) => menu.RequestDeletionAsync(CurrentUserId(), request, ct);
    [HttpGet("support/tickets")] public Task<PagedResponse<SupportTicketResponse>> GetTickets([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) => menu.GetTicketsAsync(CurrentUserId(), page, pageSize, ct);
    [HttpPost("support/tickets")] public Task<SupportTicketResponse> CreateTicket(CreateSupportTicketRequest request, CancellationToken ct) => menu.CreateTicketAsync(CurrentUserId(), request, ct);
    [AllowAnonymous, HttpGet("subscriptions/plans")] public Task<IReadOnlyList<SubscriptionPlanResponse>> GetPlans(CancellationToken ct) => menu.GetPlansAsync(ct);
    [HttpGet("subscriptions/current")] public Task<SubscriptionResponse> GetSubscription(CancellationToken ct) => menu.GetSubscriptionAsync(CurrentUserId(), ct);
    [HttpPost("subscriptions/change")] public Task<SubscriptionResponse> ChangeSubscription(ChangeSubscriptionRequest request, CancellationToken ct) => menu.RequestSubscriptionChangeAsync(CurrentUserId(), request, ct);

    private Guid CurrentUserId()
    {
        var value = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out var id) ? id : throw new UnauthorizedAccessException("Authenticated user id is missing or invalid.");
    }
}
