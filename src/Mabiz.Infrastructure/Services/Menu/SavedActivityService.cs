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

public sealed class SavedActivityService(AppDbContext db, TimeProvider clock, IContentAccessValidator access) : ISavedActivityService
{
    public async Task SaveAsync(Guid userId, SavedContentRequest request, CancellationToken ct)
    {
        if (!await access.ExistsAndAccessibleAsync(userId, request.ContentId, request.Kind, ct)) throw new KeyNotFoundException("Content was not found or is not accessible.");
        var exists = await db.Set<SavedContent>().AnyAsync(x => x.UserId == userId && x.ContentId == request.ContentId && x.Kind == request.Kind, ct);
        if (!exists) { db.Set<SavedContent>().Add(new SavedContent { Id = Guid.NewGuid(), UserId = userId, ContentId = request.ContentId, Kind = request.Kind, SavedAtUtc = clock.GetUtcNow() }); await db.SaveChangesAsync(ct); }
    }
    public async Task UnsaveAsync(Guid userId, Guid contentId, SavedContentKind kind, CancellationToken ct)
    {
        var item = await db.Set<SavedContent>().SingleOrDefaultAsync(x => x.UserId == userId && x.ContentId == contentId && x.Kind == kind, ct);
        if (item is not null) { db.Set<SavedContent>().Remove(item); await db.SaveChangesAsync(ct); }
    }
    public async Task<PagedResponse<SavedContentResponse>> GetSavedAsync(Guid userId, SavedContentKind? kind, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Set<SavedContent>().AsNoTracking().Where(x => x.UserId == userId && (!kind.HasValue || x.Kind == kind)).OrderByDescending(x => x.SavedAtUtc);
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).Select(x => new SavedContentResponse(x.ContentId, x.Kind.ToString(), null, x.SavedAtUtc)).ToListAsync(ct);
        return new(items, page, pageSize, total);
    }
    public async Task<ActivityEventResponse> RecordAsync(Guid userId, ActivityEventRequest request, CancellationToken ct)
    {
        var allowed = new[] { "profile_updated", "settings_updated", "followed_user", "unfollowed_user", "saved_content", "unsaved_content", "draft_created", "draft_updated", "draft_deleted", "support_ticket_created" };
        if (!allowed.Contains(request.EventType, StringComparer.OrdinalIgnoreCase)) throw new ArgumentException("EventType is not a permitted client action.", nameof(request));
        if (request.MetadataJson is { Length: > 2048 }) throw new ArgumentException("Metadata is too large.", nameof(request));
        var item = new MenuActivityEvent { Id = Guid.NewGuid(), UserId = userId, EventType = request.EventType.Trim(), SubjectType = request.SubjectType?.Trim(), SubjectId = request.SubjectId, MetadataJson = request.MetadataJson, CreatedAtUtc = clock.GetUtcNow() };
        db.Set<MenuActivityEvent>().Add(item); await db.SaveChangesAsync(ct); return Map(item);
    }
    public async Task<PagedResponse<ActivityEventResponse>> GetActivityAsync(Guid userId, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Set<MenuActivityEvent>().AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAtUtc);
        var total = await query.CountAsync(ct); var items = await query.Skip((page - 1) * pageSize).Take(pageSize).Select(x => new ActivityEventResponse(x.Id, x.EventType, x.SubjectType, x.SubjectId, x.MetadataJson, x.CreatedAtUtc)).ToListAsync(ct);
        return new(items, page, pageSize, total);
    }
    private static ActivityEventResponse Map(MenuActivityEvent x) => new(x.Id, x.EventType, x.SubjectType, x.SubjectId, x.MetadataJson, x.CreatedAtUtc);
}
