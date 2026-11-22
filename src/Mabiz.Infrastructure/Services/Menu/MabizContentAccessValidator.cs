using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Mabiz.Application.Interfaces;
using Mabiz.Domain.Businesses;
using Mabiz.Domain.Menu;
using Mabiz.Infrastructure.Persistence;

namespace Mabiz.Infrastructure.Menu;

public sealed class MabizContentAccessValidator(AppDbContext db, IMenuPrivacyPolicy privacy) : IContentAccessValidator
{
    public async Task<bool> ExistsAndAccessibleAsync(Guid actorUserId, Guid contentId, SavedContentKind kind, CancellationToken ct)
    {
        return kind switch
        {
            SavedContentKind.Post => await CanReadPostAsync(actorUserId, contentId, ct),
            SavedContentKind.Business => await CanReadBusinessAsync(actorUserId, contentId, ct),
            // The clean context does not include the growth/story entity declarations. Reject these
            // until their authoritative service is connected; never accept an arbitrary ID.
            SavedContentKind.Story or SavedContentKind.Opportunity => false,
            _ => false
        };
    }

    private async Task<bool> CanReadPostAsync(Guid actor, Guid id, CancellationToken ct)
    {
        var post = await db.Posts.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (post is null || await BlockedAsync(actor, post.AuthorUserId, ct)) return false;
        if (post.AuthorUserId == actor) return true;
        if (post.BusinessId is Guid businessId)
        {
            var business = await db.Businesses.AsNoTracking().SingleOrDefaultAsync(x => x.Id == businessId && x.Status == BusinessStatuses.Active, ct);
            if (business is null || await BlockedAsync(actor, business.OwnerUserId, ct)) return false;
            var member = await db.BusinessMemberships.AnyAsync(x => x.BusinessId == businessId && x.UserId == actor && x.RevokedAtUtc == null, ct);
            var followed = await db.BusinessFollows.AnyAsync(x => x.BusinessId == businessId && x.UserId == actor, ct);
            return business.Visibility == BusinessVisibility.Public && (post.Audience == PostAudiences.Public || (post.Audience == PostAudiences.Followers && (followed || member)) || member);
        }
        var profile = await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == post.AuthorUserId, ct);
        if (profile is null) return false;
        var follower = await db.UserFollows.AnyAsync(x => x.FollowerUserId == actor && x.FollowedUserId == post.AuthorUserId, ct);
        var configured = await db.Set<MenuSettings>().Where(x => x.UserId == post.AuthorUserId).Select(x => x.ProfileVisibility).SingleOrDefaultAsync(ct);
        var visibility = MenuPrivacyCompatibility.EffectiveProfileVisibility(profile.PrivateProfile, configured);
        if (!privacy.CanViewProfile(visibility, follower, actor == post.AuthorUserId).Allowed) return false;
        return post.Audience == PostAudiences.Public || (post.Audience == PostAudiences.Followers && follower);
    }

    private async Task<bool> CanReadBusinessAsync(Guid actor, Guid id, CancellationToken ct)
    {
        var business = await db.Businesses.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.Status == BusinessStatuses.Active, ct);
        if (business is null || await BlockedAsync(actor, business.OwnerUserId, ct)) return false;
        return business.Visibility == BusinessVisibility.Public || await db.BusinessMemberships.AnyAsync(x => x.BusinessId == id && x.UserId == actor && x.RevokedAtUtc == null, ct);
    }

    private Task<bool> BlockedAsync(Guid a, Guid b, CancellationToken ct) => db.UserBlocks.AnyAsync(x => (x.BlockerUserId == a && x.BlockedUserId == b) || (x.BlockerUserId == b && x.BlockedUserId == a), ct);
}
