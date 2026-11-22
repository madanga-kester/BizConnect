using System;
using System.IO;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Mabiz.Domain.Menu;

namespace Mabiz.Application.Contracts.MenuContracts;

public sealed record AccountWorkflowResponse(Guid Id, string Status, DateTimeOffset? CompletedAtUtc, DateTimeOffset? ExpiresAtUtc, string? DownloadUrl);
public sealed record SavedContentRequest(Guid ContentId, SavedContentKind Kind);
public sealed record ActivityEventRequest(string EventType, string? SubjectType, Guid? SubjectId, string? MetadataJson);
public sealed record ActivityEventResponse(Guid Id, string EventType, string? SubjectType, Guid? SubjectId, string? MetadataJson, DateTimeOffset CreatedAtUtc);
public sealed record PrivacyDecision(bool Allowed, string Code);
public sealed record AccountDataExportDocument(Guid UserId, DateTimeOffset GeneratedAtUtc, object Profile, object Preferences, object Notifications, object Devices, object Social, object MenuData);

public interface IAccountWorkflowService
{
    Task<AccountWorkflowResponse> ProcessExportAsync(Guid userId, Guid exportId, CancellationToken ct);
    Task<Stream> OpenExportAsync(Guid userId, Guid exportId, string token, CancellationToken ct);
    Task<AccountWorkflowResponse> ConfirmDeletionAsync(Guid userId, Guid deletionId, CancellationToken ct);
    Task<AccountWorkflowResponse> CancelDeletionAsync(Guid userId, Guid deletionId, CancellationToken ct);
    Task<int> ExecuteScheduledDeletionsAsync(CancellationToken ct);
}

public interface ISavedActivityService
{
    Task SaveAsync(Guid userId, SavedContentRequest request, CancellationToken ct);
    Task UnsaveAsync(Guid userId, Guid contentId, SavedContentKind kind, CancellationToken ct);
    Task<PagedResponse<SavedContentResponse>> GetSavedAsync(Guid userId, SavedContentKind? kind, int page, int pageSize, CancellationToken ct);
    Task<ActivityEventResponse> RecordAsync(Guid userId, ActivityEventRequest request, CancellationToken ct);
    Task<PagedResponse<ActivityEventResponse>> GetActivityAsync(Guid userId, int page, int pageSize, CancellationToken ct);
}
