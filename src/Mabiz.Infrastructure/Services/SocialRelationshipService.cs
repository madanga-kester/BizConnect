using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Mabiz.Application.Interfaces;
using Mabiz.Domain.Accounts;
using Mabiz.Domain.Businesses;
using Mabiz.Domain.Menu;
using Mabiz.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Mabiz.Infrastructure.Services;

public sealed class SocialRelationshipService(AppDbContext db, TimeProvider clock, INotificationService notificationWriter, IMenuPrivacyPolicy privacy)
{
    public async Task<FollowStateDto> UserState(Guid actor, Guid target, CancellationToken ct) { await UserVisible(actor, target, ct); return new(await db.UserFollows.AnyAsync(x => x.FollowerUserId == actor && x.FollowedUserId == target, ct), await db.UserFollows.CountAsync(x => x.FollowedUserId == target, ct)); }
    public async Task FollowUser(Guid actor, Guid target, CancellationToken ct)
    {
        if (actor == target) throw ApiException.BadRequest("SELF_FOLLOW", "You cannot follow yourself.");
        await UserVisible(actor, target, ct);
        if (await Blocked(actor, target, ct)) throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found.");
        if (!await db.UserFollows.AnyAsync(x => x.FollowerUserId == actor && x.FollowedUserId == target, ct))
        {
            var now = clock.GetUtcNow();
            db.UserFollows.Add(new UserFollow { FollowerUserId = actor, FollowedUserId = target, CreatedAtUtc = now });
            await notificationWriter.CreateEventAsync(new NotificationEventRequest(actor, [target], "follow", "New follower", "Someone started following you.",
                "person", actor, $"user-follow:{actor:N}:{target:N}:{now.UtcDateTime.Ticks}"), ct);
            await db.SaveChangesAsync(ct);
        }
    }
    public async Task UnfollowUser(Guid actor, Guid target, CancellationToken ct) { await UserVisible(actor, target, ct); var f = await db.UserFollows.FindAsync([actor, target], ct); if (f is not null) { db.UserFollows.Remove(f); await db.SaveChangesAsync(ct); } }
    public async Task<FollowListDto> UserList(Guid actor, Guid target, bool followers, int page, int pageSize, CancellationToken ct)
    {
        await UserVisible(actor, target, ct); (page, pageSize) = Normalize(page, pageSize);
        var q = from f in db.UserFollows.AsNoTracking() join p in db.UserProfiles.AsNoTracking() on (followers ? f.FollowerUserId : f.FollowedUserId) equals p.UserId where followers ? f.FollowedUserId == target : f.FollowerUserId == target select new { Id = followers ? f.FollowerUserId : f.FollowedUserId, p.Username, p.Name, p.Avatar, f.CreatedAtUtc, p.PrivateProfile };
        q = q.Where(x => x.Id == actor || (!x.PrivateProfile && (!db.MenuSettings.Any(m => m.UserId == x.Id && m.ProfileVisibility != "public") || (db.MenuSettings.Any(m => m.UserId == x.Id && m.ProfileVisibility == "followers") && db.UserFollows.Any(f2 => f2.FollowerUserId == actor && f2.FollowedUserId == x.Id))))).Where(x => !db.UserBlocks.Any(b => (b.BlockerUserId == actor && b.BlockedUserId == x.Id) || (b.BlockerUserId == x.Id && b.BlockedUserId == actor)));
        var total = await q.CountAsync(ct); var rows = await q.OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct); return new(rows.Select(x => new FollowProfileDto(x.Id, x.Username, x.Name, x.Avatar, x.CreatedAtUtc)).ToList(), total, page, pageSize);
    }
    public async Task<FollowStateDto> BusinessState(Guid actor, Guid id, CancellationToken ct) { await BusinessVisible(actor, id, ct); return new(await db.BusinessFollows.AnyAsync(x => x.UserId == actor && x.BusinessId == id, ct), await db.BusinessFollows.CountAsync(x => x.BusinessId == id, ct)); }
    public async Task FollowBusiness(Guid actor, Guid id, CancellationToken ct)
    {
        await BusinessVisible(actor, id, ct);
        if (!await db.BusinessFollows.AnyAsync(x => x.UserId == actor && x.BusinessId == id, ct))
        {
            var now = clock.GetUtcNow();
            db.BusinessFollows.Add(new BusinessFollow { UserId = actor, BusinessId = id, CreatedAtUtc = now });
            var recipients = await db.BusinessMemberships.AsNoTracking().Where(x => x.BusinessId == id && x.RevokedAtUtc == null
                && (x.Role == BusinessRoles.Owner || x.Role == BusinessRoles.Admin || x.Role == BusinessRoles.Editor)).Select(x => x.UserId).ToListAsync(ct);
            await notificationWriter.CreateEventAsync(new NotificationEventRequest(actor, recipients, "follow", "New business follower", "Someone started following your business.",
                "business", id, $"business-follow:{actor:N}:{id:N}:{now.UtcDateTime.Ticks}", BusinessId: id), ct);
            await db.SaveChangesAsync(ct);
        }
    }
    public async Task UnfollowBusiness(Guid actor, Guid id, CancellationToken ct) { await BusinessVisible(actor, id, ct); var f = await db.BusinessFollows.FindAsync([actor, id], ct); if (f is not null) { db.BusinessFollows.Remove(f); await db.SaveChangesAsync(ct); } }
    public async Task<BusinessFollowListDto> BusinessFollowers(Guid actor, Guid id, int page, int pageSize, CancellationToken ct)
    {
        await BusinessVisible(actor, id, ct); (page, pageSize) = Normalize(page, pageSize); var q = from f in db.BusinessFollows.AsNoTracking() join p in db.UserProfiles.AsNoTracking() on f.UserId equals p.UserId where f.BusinessId == id && (f.UserId == actor || (!p.PrivateProfile && (!db.MenuSettings.Any(m => m.UserId == f.UserId && m.ProfileVisibility != "public") || (db.MenuSettings.Any(m => m.UserId == f.UserId && m.ProfileVisibility == "followers") && db.UserFollows.Any(f2 => f2.FollowerUserId == actor && f2.FollowedUserId == f.UserId))))) && !db.UserBlocks.Any(x => (x.BlockerUserId == actor && x.BlockedUserId == f.UserId) || (x.BlockerUserId == f.UserId && x.BlockedUserId == actor)) select new BusinessFollowProfileDto(p.UserId, p.Username, p.Name, p.Avatar, f.CreatedAtUtc);
        var total = await q.CountAsync(ct); return new(await q.OrderByDescending(x => x.FollowedAt).ThenByDescending(x => x.UserId).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct), total, page, pageSize);
    }
    public async Task Block(Guid actor, Guid target, CancellationToken ct)
    {
        if (actor == target) throw ApiException.BadRequest("SELF_BLOCK", "You cannot block yourself."); if (!await db.Users.AnyAsync(x => x.Id == target && x.IsActive, ct)) throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found.");
        if (!await db.UserBlocks.AnyAsync(x => x.BlockerUserId == actor && x.BlockedUserId == target, ct)) db.UserBlocks.Add(new UserBlock { BlockerUserId = actor, BlockedUserId = target, CreatedAtUtc = clock.GetUtcNow() });
        var follows = await db.UserFollows.Where(x => (x.FollowerUserId == actor && x.FollowedUserId == target) || (x.FollowerUserId == target && x.FollowedUserId == actor)).ToListAsync(ct); db.UserFollows.RemoveRange(follows); await db.SaveChangesAsync(ct);
    }
    public async Task Unblock(Guid actor, Guid target, CancellationToken ct) { var block = await db.UserBlocks.FindAsync([actor, target], ct); if (block is not null) { db.UserBlocks.Remove(block); await db.SaveChangesAsync(ct); } }
    public Task<bool> BlockState(Guid actor, Guid target, CancellationToken ct) => db.UserBlocks.AsNoTracking().AnyAsync(x => x.BlockerUserId == actor && x.BlockedUserId == target, ct);
    public async Task Hide(Guid actor, Guid post, CancellationToken ct) { if (!await db.Posts.AnyAsync(x => x.Id == post, ct)) throw ApiException.NotFound("POST_NOT_FOUND", "The post was not found."); if (!await db.HiddenPosts.AnyAsync(x => x.UserId == actor && x.PostId == post, ct)) { db.HiddenPosts.Add(new HiddenPost { UserId = actor, PostId = post, CreatedAtUtc = clock.GetUtcNow() }); await db.SaveChangesAsync(ct); } }
    public async Task Unhide(Guid actor, Guid post, CancellationToken ct) { var h = await db.HiddenPosts.FindAsync([actor, post], ct); if (h is not null) { db.HiddenPosts.Remove(h); await db.SaveChangesAsync(ct); } }
    public Task<bool> Hidden(Guid actor, Guid post, CancellationToken ct) => db.HiddenPosts.AsNoTracking().AnyAsync(x => x.UserId == actor && x.PostId == post, ct);
    private async Task UserVisible(Guid actor, Guid target, CancellationToken ct)
    {
        var p = await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == target, ct);
        if (p is null || await Blocked(actor, target, ct)) throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found.");
        var follower = await db.UserFollows.AnyAsync(x => x.FollowerUserId == actor && x.FollowedUserId == target, ct);
        var visibility = await EffectiveProfileVisibility(target, p.PrivateProfile, ct);
        var decision = privacy.CanViewProfile(visibility, follower, actor == target);
        if (!decision.Allowed) throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found.");
    }
    private async Task<string> EffectiveProfileVisibility(Guid userId, bool legacyPrivate, CancellationToken ct)
    {
        var configured = await db.Set<MenuSettings>().Where(x => x.UserId == userId).Select(x => x.ProfileVisibility).SingleOrDefaultAsync(ct);
        return MenuPrivacyCompatibility.EffectiveProfileVisibility(legacyPrivate, configured);
    }
    private async Task<bool> Blocked(Guid a, Guid b, CancellationToken ct) => await db.UserBlocks.AnyAsync(x => (x.BlockerUserId == a && x.BlockedUserId == b) || (x.BlockerUserId == b && x.BlockedUserId == a), ct);
    private async Task BusinessVisible(Guid actor, Guid id, CancellationToken ct) { var b = await db.Businesses.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.Status == BusinessStatuses.Active, ct); if (b is null || (b.Visibility == BusinessVisibility.Private && !await db.BusinessMemberships.AnyAsync(x => x.BusinessId == id && x.UserId == actor && x.RevokedAtUtc == null, ct))) throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found."); }
    private static (int Page, int Size) Normalize(int p, int s) => (Math.Max(1, p), Math.Clamp(s, 1, 100));
}
