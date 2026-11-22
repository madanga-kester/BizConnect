using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Mabiz.Application.Contracts.MenuContracts;
using Mabiz.Application.Interfaces;
using Mabiz.Domain.Menu;
using Mabiz.Infrastructure.Persistence;

namespace Mabiz.Infrastructure.Menu;

public sealed class MenuService(AppDbContext db, TimeProvider clock) : IMenuService
{
    private const int MaxPageSize = 100;
    private DateTimeOffset Now => clock.GetUtcNow();

    public async Task<MenuSettingsResponse> GetSettingsAsync(Guid userId, CancellationToken ct)
    {
        var item = await db.Set<MenuSettings>().SingleOrDefaultAsync(x => x.UserId == userId, ct);
        if (item is null)
        {
            item = NewSettings(userId);
            db.Set<MenuSettings>().Add(item);
            await db.SaveChangesAsync(ct);
        }
        return Map(item);
    }

    public async Task<MenuSettingsResponse> UpdateSettingsAsync(Guid userId, UpdateMenuSettingsRequest request, CancellationToken ct)
    {
        var item = await db.Set<MenuSettings>().SingleOrDefaultAsync(x => x.UserId == userId, ct) ?? NewSettings(userId);
        Apply(item, request);
        item.UpdatedAtUtc = Now;
        if (db.Entry(item).State == EntityState.Detached) db.Set<MenuSettings>().Add(item);
        await db.SaveChangesAsync(ct);
        return Map(item);
    }

    public async Task<AccountExportResponse> RequestExportAsync(Guid userId, RequestAccountExportRequest request, CancellationToken ct)
    {
        var pending = await db.Set<AccountDataExportRequest>().AnyAsync(x => x.UserId == userId && x.Status == "requested", ct);
        if (pending) throw new InvalidOperationException("An account export is already pending.");
        var item = new AccountDataExportRequest { Id = Guid.NewGuid(), UserId = userId, Status = "requested", RequestedAtUtc = Now };
        db.Set<AccountDataExportRequest>().Add(item);
        await db.SaveChangesAsync(ct);
        return new(item.Id, item.Status, item.RequestedAtUtc, item.CompletedAtUtc, item.ExpiresAtUtc, null);
    }

    public async Task<AccountDeletionResponse> RequestDeletionAsync(Guid userId, RequestAccountDeletionRequest request, CancellationToken ct)
    {
        if (!string.Equals(request.Confirmation?.Trim(), "DELETE MY ACCOUNT", StringComparison.Ordinal))
            throw new ArgumentException("Confirmation must be DELETE MY ACCOUNT.", nameof(request));
        var existing = await db.Set<AccountDeletionRequest>().SingleOrDefaultAsync(x => x.UserId == userId && x.Status == "requested", ct);
        if (existing is not null) return Map(existing);
        var item = new AccountDeletionRequest { Id = Guid.NewGuid(), UserId = userId, Status = "requested", RequestedAtUtc = Now, ScheduledDeletionAtUtc = Now.AddDays(30) };
        db.Set<AccountDeletionRequest>().Add(item);
        await db.SaveChangesAsync(ct);
        return Map(item);
    }

    public async Task<PagedResponse<SupportTicketResponse>> GetTicketsAsync(Guid userId, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        var query = db.Set<SupportTicket>().AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAtUtc);
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).Select(x => new SupportTicketResponse(x.Id, x.Subject, x.Message, x.Status, x.CreatedAtUtc, x.UpdatedAtUtc)).ToListAsync(ct);
        return new(items, page, pageSize, total);
    }

    public async Task<SupportTicketResponse> CreateTicketAsync(Guid userId, CreateSupportTicketRequest request, CancellationToken ct)
    {
        var subject = request.Subject.Trim(); var message = request.Message.Trim();
        if (subject.Length is < 3 or > 160) throw new ArgumentException("Subject must be 3 to 160 characters.", nameof(request));
        if (message.Length is < 8 or > 5000) throw new ArgumentException("Message must be 8 to 5000 characters.", nameof(request));
        var now = Now;
        var item = new SupportTicket { Id = Guid.NewGuid(), UserId = userId, Subject = subject, Message = message, Status = SupportTicketStatus.Open, CreatedAtUtc = now, UpdatedAtUtc = now };
        db.Set<SupportTicket>().Add(item); await db.SaveChangesAsync(ct);
        return new(item.Id, item.Subject, item.Message, item.Status, item.CreatedAtUtc, item.UpdatedAtUtc);
    }

    public async Task<IReadOnlyList<SubscriptionPlanResponse>> GetPlansAsync(CancellationToken ct) =>
        await db.Set<SubscriptionPlan>().AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.MonthlyPrice).Select(x => new SubscriptionPlanResponse(x.Id, x.Code, x.DisplayName, x.Currency, x.MonthlyPrice, x.YearlyPrice, x.IsActive)).ToListAsync(ct);

    public async Task<SubscriptionResponse> GetSubscriptionAsync(Guid userId, CancellationToken ct)
    {
        var item = await (from s in db.Set<UserSubscription>().AsNoTracking() join p in db.Set<SubscriptionPlan>() on s.PlanId equals p.Id where s.UserId == userId orderby s.UpdatedAtUtc descending select new { s, p }).FirstOrDefaultAsync(ct);
        return item is null ? new(null, SubscriptionStatus.None, null, null, null, false) : new(item.s.Id, item.s.Status, item.p.Code, item.s.BillingCycle, item.s.CurrentPeriodEndsAtUtc, item.s.Status is SubscriptionStatus.Active or SubscriptionStatus.Trialing);
    }

    public async Task<SubscriptionResponse> RequestSubscriptionChangeAsync(Guid userId, ChangeSubscriptionRequest request, CancellationToken ct)
    {
        var plan = await db.Set<SubscriptionPlan>().SingleOrDefaultAsync(x => x.Code == request.PlanCode && x.IsActive, ct) ?? throw new KeyNotFoundException("Subscription plan was not found.");
        var current = await db.Set<UserSubscription>().SingleOrDefaultAsync(x => x.UserId == userId && (x.Status == SubscriptionStatus.Active || x.Status == SubscriptionStatus.Trialing), ct);
        if (current is null) throw new InvalidOperationException("A payment-provider confirmation is required before activating a subscription.");
        current.PlanId = plan.Id; current.BillingCycle = request.BillingCycle; current.UpdatedAtUtc = Now;
        await db.SaveChangesAsync(ct);
        return new(current.Id, current.Status, plan.Code, current.BillingCycle, current.CurrentPeriodEndsAtUtc, true);
    }

    private MenuSettings NewSettings(Guid userId) { var now = Now; return new() { UserId = userId, CreatedAtUtc = now, UpdatedAtUtc = now }; }
    private static MenuSettingsResponse Map(MenuSettings x) => new(x.UserId, x.TextSize, x.HighContrast, x.ProfileVisibility, x.MessagePermission, x.StoryReplyPermission, x.CommentPermission, x.TagPermission, x.MentionPermission, x.SharingPermission, x.AllowPostResharing, x.AllowStorySharing, x.AllowExternalSharing, x.UpdatedAtUtc);
    private static AccountDeletionResponse Map(AccountDeletionRequest x) => new(x.Id, x.Status, x.RequestedAtUtc, x.ScheduledDeletionAtUtc);
    private static void Apply(MenuSettings x, UpdateMenuSettingsRequest r)
    {
        if (r.TextSize is not null) x.TextSize = Require(r.TextSize, "textSize");
        if (r.HighContrast.HasValue) x.HighContrast = r.HighContrast.Value;
        if (r.ProfileVisibility is not null) x.ProfileVisibility = MenuPermissionOptions.Normalize(r.ProfileVisibility, "profileVisibility", MenuPermissionOptions.ProfileVisibility);
        if (r.MessagePermission is not null) x.MessagePermission = MenuPermissionOptions.Normalize(r.MessagePermission, "messagePermission", MenuPermissionOptions.AudiencePermission);
        if (r.StoryReplyPermission is not null) x.StoryReplyPermission = MenuPermissionOptions.Normalize(r.StoryReplyPermission, "storyReplyPermission", MenuPermissionOptions.AudiencePermission);
        if (r.CommentPermission is not null) x.CommentPermission = MenuPermissionOptions.Normalize(r.CommentPermission, "commentPermission", MenuPermissionOptions.AudiencePermission);
        if (r.TagPermission is not null) x.TagPermission = MenuPermissionOptions.Normalize(r.TagPermission, "tagPermission", MenuPermissionOptions.AudiencePermission);
        if (r.MentionPermission is not null) x.MentionPermission = MenuPermissionOptions.Normalize(r.MentionPermission, "mentionPermission", MenuPermissionOptions.AudiencePermission);
        if (r.SharingPermission is not null) x.SharingPermission = MenuPermissionOptions.Normalize(r.SharingPermission, "sharingPermission", MenuPermissionOptions.AudiencePermission);
        if (r.AllowPostResharing.HasValue) x.AllowPostResharing = r.AllowPostResharing.Value;
        if (r.AllowStorySharing.HasValue) x.AllowStorySharing = r.AllowStorySharing.Value;
        if (r.AllowExternalSharing.HasValue) x.AllowExternalSharing = r.AllowExternalSharing.Value;
    }
    private static string Require(string value, string name) => value.Trim() switch { var s when s.Length is > 0 and <= 64 => s, _ => throw new ArgumentException($"{name} is invalid.", name) };
}
