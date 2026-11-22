using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mabiz.Application.Contracts.MenuContracts;
using Mabiz.Domain.Menu;
using Mabiz.Infrastructure.Menu;

namespace Mabiz.Api.Controllers;

[ApiController, Authorize, Route("api/v1/menu/account")]
public sealed class MenuAccountWorkflowController(IAccountWorkflowService workflow) : ControllerBase
{
    [HttpPost("export/{exportId:guid}/process")]
    public Task<AccountWorkflowResponse> ProcessExport(Guid exportId, CancellationToken ct) => workflow.ProcessExportAsync(CurrentUserId(), exportId, ct);
    [HttpGet("export/{exportId:guid}/download")]
    public async Task<IActionResult> DownloadExport(Guid exportId, [FromQuery] string token, CancellationToken ct)
    {
        var content = await workflow.OpenExportAsync(CurrentUserId(), exportId, token, ct);
        Response.Headers["Content-Disposition"] = $"attachment; filename=mbz-export-{exportId:N}.json";
        return File(content, "application/json", enableRangeProcessing: false);
    }
    [HttpPost("deletion/{deletionId:guid}/confirm")]
    public Task<AccountWorkflowResponse> ConfirmDeletion(Guid deletionId, CancellationToken ct) => workflow.ConfirmDeletionAsync(CurrentUserId(), deletionId, ct);
    [HttpPost("deletion/{deletionId:guid}/cancel")]
    public Task<AccountWorkflowResponse> CancelDeletion(Guid deletionId, CancellationToken ct) => workflow.CancelDeletionAsync(CurrentUserId(), deletionId, ct);
    private Guid CurrentUserId() => Guid.TryParse(User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : throw new UnauthorizedAccessException();
}

[ApiController, Authorize, Route("api/v1/menu/activity")]
public sealed class MenuActivityController(ISavedActivityService service) : ControllerBase
{
    [HttpPost("saved")] public Task Save(SavedContentRequest request, CancellationToken ct) => service.SaveAsync(CurrentUserId(), request, ct);
    [HttpDelete("saved/{kind}/{contentId:guid}")] public Task Unsave(SavedContentKind kind, Guid contentId, CancellationToken ct) => service.UnsaveAsync(CurrentUserId(), contentId, kind, ct);
    [HttpGet("saved")] public Task<PagedResponse<SavedContentResponse>> GetSaved([FromQuery] SavedContentKind? kind = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) => service.GetSavedAsync(CurrentUserId(), kind, page, pageSize, ct);
    [HttpPost("events")] public Task<ActivityEventResponse> Record(ActivityEventRequest request, CancellationToken ct) => service.RecordAsync(CurrentUserId(), request, ct);
    [HttpGet("events")] public Task<PagedResponse<ActivityEventResponse>> GetActivity([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) => service.GetActivityAsync(CurrentUserId(), page, pageSize, ct);
    private Guid CurrentUserId() => Guid.TryParse(User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : throw new UnauthorizedAccessException();
}
