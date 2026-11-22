using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Mabiz.Domain.Menu;

namespace Mabiz.Application.Contracts.MenuContracts;

public sealed record MenuSettingsResponse(Guid UserId, string TextSize, bool HighContrast, string ProfileVisibility, string MessagePermission, string StoryReplyPermission, string CommentPermission, string TagPermission, string MentionPermission, string SharingPermission, bool AllowPostResharing, bool AllowStorySharing, bool AllowExternalSharing, DateTimeOffset UpdatedAtUtc);
public sealed record UpdateMenuSettingsRequest(string? TextSize, bool? HighContrast, string? ProfileVisibility, string? MessagePermission, string? StoryReplyPermission, string? CommentPermission, string? TagPermission, string? MentionPermission, string? SharingPermission, bool? AllowPostResharing = null, bool? AllowStorySharing = null, bool? AllowExternalSharing = null);
public sealed record AccountExportResponse(Guid Id, string Status, DateTimeOffset RequestedAtUtc, DateTimeOffset? CompletedAtUtc, DateTimeOffset? ExpiresAtUtc, string? DownloadUrl);
public sealed record RequestAccountExportRequest(bool IncludeMedia = false);
public sealed record AccountDeletionResponse(Guid Id, string Status, DateTimeOffset RequestedAtUtc, DateTimeOffset? ScheduledDeletionAtUtc);
public sealed record RequestAccountDeletionRequest([Required] string Confirmation, string? Reason);
public sealed record SupportTicketResponse(Guid Id, string Subject, string Message, SupportTicketStatus Status, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc);
public sealed record CreateSupportTicketRequest([Required, StringLength(160, MinimumLength = 3)] string Subject, [Required, StringLength(5000, MinimumLength = 8)] string Message);
public sealed record SubscriptionPlanResponse(Guid Id, string Code, string DisplayName, string Currency, decimal MonthlyPrice, decimal YearlyPrice, bool IsActive);
public sealed record SubscriptionResponse(Guid? Id, SubscriptionStatus Status, string? PlanCode, BillingCycle? BillingCycle, DateTimeOffset? CurrentPeriodEndsAtUtc, bool CanChangePlan);
public sealed record ChangeSubscriptionRequest([Required] string PlanCode, BillingCycle BillingCycle);
public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total);
public sealed record SavedContentResponse(Guid Id, string Kind, string? Title, DateTimeOffset SavedAtUtc);
public sealed record ActivitySummaryResponse(int Drafts, int SavedPosts, int SavedStories, int SavedBusinesses, int SavedIdeas, DateTimeOffset? LastActivityAtUtc);
