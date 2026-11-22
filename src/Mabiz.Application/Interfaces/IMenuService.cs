using System;
using System.Threading;
using System.Threading.Tasks;
using Mabiz.Application.Contracts.MenuContracts;

namespace Mabiz.Application.Interfaces;

public interface IMenuService
{
    Task<MenuSettingsResponse> GetSettingsAsync(Guid userId, CancellationToken ct);
    Task<MenuSettingsResponse> UpdateSettingsAsync(Guid userId, UpdateMenuSettingsRequest request, CancellationToken ct);
    Task<AccountExportResponse> RequestExportAsync(Guid userId, RequestAccountExportRequest request, CancellationToken ct);
    Task<AccountDeletionResponse> RequestDeletionAsync(Guid userId, RequestAccountDeletionRequest request, CancellationToken ct);
    Task<PagedResponse<SupportTicketResponse>> GetTicketsAsync(Guid userId, int page, int pageSize, CancellationToken ct);
    Task<SupportTicketResponse> CreateTicketAsync(Guid userId, CreateSupportTicketRequest request, CancellationToken ct);
    Task<IReadOnlyList<SubscriptionPlanResponse>> GetPlansAsync(CancellationToken ct);
    Task<SubscriptionResponse> GetSubscriptionAsync(Guid userId, CancellationToken ct);
    Task<SubscriptionResponse> RequestSubscriptionChangeAsync(Guid userId, ChangeSubscriptionRequest request, CancellationToken ct);
}
