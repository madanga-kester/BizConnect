using System;

namespace Mabiz.Domain.Menu;

public enum MenuSettingScope { Account = 0, Device = 1 }
public enum SupportTicketStatus { Open = 0, InProgress = 1, Resolved = 2, Closed = 3 }
public enum SubscriptionStatus { None = 0, Trialing = 1, Active = 2, PastDue = 3, Canceled = 4, Expired = 5 }
public enum BillingCycle { Monthly = 0, Yearly = 1 }

/// <summary>Smallest new persistence surface for Menu-owned settings not represented by the reported model.</summary>
public sealed class MenuSettings
{
    public Guid UserId { get; set; }
    public string TextSize { get; set; } = "default";
    public bool HighContrast { get; set; }
    public string ProfileVisibility { get; set; } = "public";
    public string MessagePermission { get; set; } = "everyone";
    public string StoryReplyPermission { get; set; } = "everyone";
    public string CommentPermission { get; set; } = "everyone";
    public string TagPermission { get; set; } = "everyone";
    public string MentionPermission { get; set; } = "everyone";
    public string SharingPermission { get; set; } = "everyone";
    public bool AllowPostResharing { get; set; } = true;
    public bool AllowStorySharing { get; set; } = true;
    public bool AllowExternalSharing { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class AccountDataExportRequest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Status { get; set; } = "requested";
    public string? DownloadTokenProtected { get; set; }
    public DateTimeOffset RequestedAtUtc { get; set; }
    public DateTimeOffset? CompletedAtUtc { get; set; }
    public DateTimeOffset? ExpiresAtUtc { get; set; }
}

public sealed class AccountDeletionRequest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Status { get; set; } = "requested";
    public DateTimeOffset RequestedAtUtc { get; set; }
    public DateTimeOffset? ConfirmedAtUtc { get; set; }
    public DateTimeOffset? ScheduledDeletionAtUtc { get; set; }
    public DateTimeOffset? CanceledAtUtc { get; set; }
}

public sealed class SupportTicket
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public SupportTicketStatus Status { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class SubscriptionPlan
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Currency { get; set; } = "KES";
    public decimal MonthlyPrice { get; set; }
    public decimal YearlyPrice { get; set; }
    public bool IsActive { get; set; }
}

public sealed class UserSubscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public SubscriptionStatus Status { get; set; }
    public BillingCycle BillingCycle { get; set; }
    public DateTimeOffset? CurrentPeriodEndsAtUtc { get; set; }
    public DateTimeOffset? CanceledAtUtc { get; set; }
    public string? Provider { get; set; }
    public string? ProviderSubscriptionId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
