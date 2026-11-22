using Mabiz.Application.Contracts;
using Mabiz.Application.Interfaces;
using Mabiz.Application.Services;
using Mabiz.Domain.Businesses;
using Mabiz.Domain.Menu;
using Mabiz.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Mabiz.Infrastructure.Services;

public sealed class SocialTaggingService(AppDbContext db, TimeProvider clock, INotificationService notificationWriter, IMenuPrivacyPolicy privacy, SocialService social)
{
    private const int MaxTagsPerPost = 20;

    public async Task<IReadOnlyList<TaggedUserDto>> TagUser(Guid actor, Guid postId, Guid userId, CancellationToken ct)
    {
        if (userId == Guid.Empty) throw ApiException.BadRequest("TAG_USER_REQUIRED", "A user to tag is required.");
        var post = await social.GetPost(actor, postId, ct);
        if (post.AuthorUserId != actor) throw ApiException.Forbidden("POST_AUTHOR_ONLY", "Only the post author may tag people.");
        if (post.Audience != PostAudiences.Public) throw ApiException.Conflict("POST_NOT_TAGGABLE", "Only public posts can tag people.");
        if (!await db.Users.AsNoTracking().AnyAsync(x => x.Id == userId && x.IsActive, ct) || await IsBlocked(actor, userId, ct))
            throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found.");
        await EnsureTagAllowed(actor, userId, ct);
        var exists = await db.PostTags.AnyAsync(x => x.PostId == postId && x.TaggedUserId == userId, ct);
        if (!exists)
        {
            if (await db.PostTags.CountAsync(x => x.PostId == postId, ct) >= MaxTagsPerPost)
                throw ApiException.Conflict("TOO_MANY_TAGS", "A post may tag at most 20 people.");
            db.PostTags.Add(new PostTag { PostId = postId, TaggedUserId = userId, TaggedByUserId = actor, CreatedAtUtc = clock.GetUtcNow() });
            await notificationWriter.CreateEventAsync(new NotificationEventRequest(actor, [userId], "tag", "You were tagged", "Someone tagged you in a post.",
                "post", postId, $"tag:{postId:N}:{userId:N}", post.BusinessId, PostId: postId), ct);
            await db.SaveChangesAsync(ct);
        }
        return await List(actor, postId, ct);
    }

    public async Task Untag(Guid actor, Guid postId, Guid userId, CancellationToken ct)
    {
        var tag = await db.PostTags.SingleOrDefaultAsync(x => x.PostId == postId && x.TaggedUserId == userId, ct);
        if (tag is null || (actor != userId && actor != tag.TaggedByUserId))
            throw ApiException.NotFound("TAG_NOT_FOUND", "The tag was not found.");
        db.PostTags.Remove(tag);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<TaggedUserDto>> List(Guid actor, Guid postId, CancellationToken ct)
    {
        _ = await social.GetPost(actor, postId, ct);
        return await (from t in db.PostTags.AsNoTracking()
                      join p in db.UserProfiles.AsNoTracking() on t.TaggedUserId equals p.UserId
                      where t.PostId == postId
                          && (t.TaggedUserId == actor || (!p.PrivateProfile
                              && (!db.MenuSettings.Any(m => m.UserId == p.UserId && m.ProfileVisibility != "public")
                                  || (db.MenuSettings.Any(m => m.UserId == p.UserId && m.ProfileVisibility == "followers")
                                      && db.UserFollows.Any(f => f.FollowerUserId == actor && f.FollowedUserId == p.UserId)))))
                          && !db.UserBlocks.Any(b => (b.BlockerUserId == actor && b.BlockedUserId == t.TaggedUserId) || (b.BlockerUserId == t.TaggedUserId && b.BlockedUserId == actor))
                      orderby t.CreatedAtUtc, t.TaggedUserId
                      select new TaggedUserDto(t.TaggedUserId, p.Username, p.Name, p.Avatar, t.CreatedAtUtc)).ToListAsync(ct);
    }

    private async Task EnsureTagAllowed(Guid actor, Guid tagged, CancellationToken ct)
    {
        if (actor == tagged) return;
        var permission = await db.Set<MenuSettings>().AsNoTracking().Where(x => x.UserId == tagged).Select(x => x.TagPermission).SingleOrDefaultAsync(ct) ?? "everyone";
        var follower = await db.UserFollows.AnyAsync(x => x.FollowerUserId == actor && x.FollowedUserId == tagged, ct);
        var decision = privacy.CanInteract(permission, follower, false);
        if (!decision.Allowed) throw ApiException.Forbidden(decision.Code, "This account does not allow being tagged.");
    }

    private Task<bool> IsBlocked(Guid a, Guid b, CancellationToken ct) =>
        db.UserBlocks.AsNoTracking().AnyAsync(x => (x.BlockerUserId == a && x.BlockedUserId == b) || (x.BlockerUserId == b && x.BlockedUserId == a), ct);
}