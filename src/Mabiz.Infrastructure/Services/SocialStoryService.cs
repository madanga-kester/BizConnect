using Mabiz.Application.Contracts;
using Mabiz.Application.Interfaces;
using Mabiz.Application.Services;
using Mabiz.Domain.Businesses;
using Mabiz.Domain.Menu;
using Mabiz.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Mabiz.Infrastructure.Services;

public sealed class SocialStoryService(AppDbContext db, TimeProvider clock, INotificationService notificationWriter, IMenuPrivacyPolicy privacy)
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromHours(24);
    private DateTimeOffset Now => clock.GetUtcNow();

    public async Task<StoryDto> Create(Guid actor, CreateStoryRequest req, CancellationToken ct)
    {
        var text = req.Text?.Trim() ?? string.Empty;
        var hasMedia = !string.IsNullOrWhiteSpace(req.MediaUrl);
        if (req.Audience != "public" && req.Audience != "followers") throw ApiException.BadRequest("INVALID_STORY_AUDIENCE", "The story audience must be public or followers.");
        if (text.Length == 0 && !hasMedia) throw ApiException.BadRequest("STORY_CONTENT_REQUIRED", "A story needs text or media.");
        if (hasMedia)
        {
            if (string.IsNullOrWhiteSpace(req.MediaType)) throw ApiException.BadRequest("STORY_MEDIA_TYPE_REQUIRED", "A media type is required with a media URL.");
            if (!Uri.TryCreate(req.MediaUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps || !string.IsNullOrEmpty(uri.UserInfo))
                throw ApiException.BadRequest("INVALID_MEDIA_URL", "Media references must be absolute HTTPS URLs; local device paths and other schemes are not accepted.");
        }
        else if (!string.IsNullOrWhiteSpace(req.MediaType)) throw ApiException.BadRequest("STORY_MEDIA_URL_REQUIRED", "A media URL is required with a media type.");
        var now = Now;
        var story = new Story
        {
            Id = Guid.NewGuid(),
            AuthorUserId = actor,
            Text = text,
            MediaType = hasMedia ? req.MediaType : null,
            MediaUrl = hasMedia ? req.MediaUrl!.Trim() : null,
            AltText = hasMedia ? req.AltText : null,
            Audience = req.Audience,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(Lifetime)
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync(ct);
        return await Map(story, ct);
    }

    public async Task<CursorPage<StoryDto>> Feed(Guid actor, string? cursor, int limit, CancellationToken ct)
    {
        var q = VisibleQuery(actor).Where(s => s.AuthorUserId == actor || db.UserFollows.Any(f => f.FollowerUserId == actor && f.FollowedUserId == s.AuthorUserId));
        return await Page(q, SocialCursorCodec.Decode(cursor), limit, ct);
    }

    public async Task<CursorPage<StoryDto>> UserStories(Guid actor, Guid target, string? cursor, int limit, CancellationToken ct)
    {
        var q = VisibleQuery(actor).Where(s => s.AuthorUserId == target);
        return await Page(q, SocialCursorCodec.Decode(cursor), limit, ct);
    }

    public async Task<StoryDto> Get(Guid actor, Guid id, CancellationToken ct) => await Map(await Visible(actor, id, ct), ct);

    public async Task Delete(Guid actor, Guid id, CancellationToken ct)
    {
        var story = await db.Stories.SingleOrDefaultAsync(x => x.Id == id && x.AuthorUserId == actor, ct) ?? throw ApiException.NotFound("STORY_NOT_FOUND", "The story was not found.");
        db.Stories.Remove(story);
        await db.SaveChangesAsync(ct);
    }

    public async Task<StoryReplyDto> Reply(Guid actor, Guid storyId, string text, CancellationToken ct)
    {
        var story = await Visible(actor, storyId, ct);
        if (story.AuthorUserId == actor) throw ApiException.BadRequest("SELF_STORY_REPLY", "You cannot reply to your own story.");
        var permission = await db.Set<MenuSettings>().AsNoTracking().Where(x => x.UserId == story.AuthorUserId).Select(x => x.StoryReplyPermission).SingleOrDefaultAsync(ct) ?? "everyone";
        var follower = await db.UserFollows.AnyAsync(x => x.FollowerUserId == actor && x.FollowedUserId == story.AuthorUserId, ct);
        var decision = privacy.CanInteract(permission, follower, false);
        if (!decision.Allowed) throw ApiException.Forbidden(decision.Code, "This account does not accept replies to its stories.");
        var trimmed = text?.Trim() ?? string.Empty;
        if (trimmed.Length == 0 || trimmed.Length > 1000) throw ApiException.BadRequest("STORY_REPLY_INVALID", "A reply must contain 1 to 1000 characters.");
        var reply = new StoryReply { Id = Guid.NewGuid(), StoryId = storyId, AuthorUserId = actor, Text = trimmed, CreatedAtUtc = Now };
        db.StoryReplies.Add(reply);
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actor, [story.AuthorUserId], "story_reply", "New story reply", "Someone replied to your story.",
            "story", storyId, $"story-reply:{reply.Id:N}"), ct);
        await db.SaveChangesAsync(ct);
        var author = await db.UserProfiles.AsNoTracking().Where(x => x.UserId == actor).Select(x => new { x.Name, x.Username, x.Avatar }).SingleAsync(ct);
        return new StoryReplyDto(reply.Id, reply.StoryId, reply.AuthorUserId, author.Name, author.Username, author.Avatar, reply.Text, reply.CreatedAtUtc);
    }

    public async Task<CursorPage<StoryReplyDto>> Replies(Guid actor, Guid storyId, string? cursor, int limit, CancellationToken ct)
    {
        _ = await db.Stories.AsNoTracking().SingleOrDefaultAsync(x => x.Id == storyId && x.AuthorUserId == actor, ct) ?? throw ApiException.NotFound("STORY_NOT_FOUND", "The story was not found.");
        var key = SocialCursorCodec.Decode(cursor);
        limit = Math.Clamp(limit, 1, 100);
        var q = from r in db.StoryReplies.AsNoTracking()
                join p in db.UserProfiles.AsNoTracking() on r.AuthorUserId equals p.UserId
                where r.StoryId == storyId && !db.UserBlocks.Any(b => (b.BlockerUserId == actor && b.BlockedUserId == r.AuthorUserId) || (b.BlockerUserId == r.AuthorUserId && b.BlockedUserId == actor))
                select new { r.Id, r.StoryId, r.AuthorUserId, p.Name, p.Username, p.Avatar, r.Text, r.CreatedAtUtc };
        if (key.HasValue) q = q.Where(x => x.CreatedAtUtc > key.Value.CreatedAtUtc || (x.CreatedAtUtc == key.Value.CreatedAtUtc && x.Id.CompareTo(key.Value.Id) > 0));
        var rows = await q.OrderBy(x => x.CreatedAtUtc).ThenBy(x => x.Id).Take(limit + 1).ToListAsync(ct);
        var more = rows.Count > limit;
        if (more) rows.RemoveAt(limit);
        var items = rows.Select(x => new StoryReplyDto(x.Id, x.StoryId, x.AuthorUserId, x.Name, x.Username, x.Avatar, x.Text, x.CreatedAtUtc)).ToList();
        return new CursorPage<StoryReplyDto>(items, more && rows.Count > 0 ? SocialCursorCodec.Encode(rows[^1].CreatedAtUtc, rows[^1].Id) : null);
    }

    private IQueryable<Story> VisibleQuery(Guid actor)
    {
        var now = Now;
        return db.Stories.AsNoTracking().Where(s => s.ExpiresAtUtc > now &&
            (s.AuthorUserId == actor ||
             (!db.UserBlocks.Any(b => (b.BlockerUserId == actor && b.BlockedUserId == s.AuthorUserId) || (b.BlockerUserId == s.AuthorUserId && b.BlockedUserId == actor)) &&
              db.UserProfiles.Any(u => u.UserId == s.AuthorUserId && !u.PrivateProfile &&
                  (!db.MenuSettings.Any(m => m.UserId == u.UserId && m.ProfileVisibility != "public") ||
                   (db.MenuSettings.Any(m => m.UserId == u.UserId && m.ProfileVisibility == "followers") &&
                    db.UserFollows.Any(f => f.FollowerUserId == actor && f.FollowedUserId == u.UserId)))) &&
              (s.Audience == "public" || db.UserFollows.Any(f => f.FollowerUserId == actor && f.FollowedUserId == s.AuthorUserId)))));
    }

    private async Task<Story> Visible(Guid actor, Guid id, CancellationToken ct) =>
        await VisibleQuery(actor).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiException.NotFound("STORY_NOT_FOUND", "The story was not found.");

    private async Task<CursorPage<StoryDto>> Page(IQueryable<Story> q, SocialCursorKey? key, int limit, CancellationToken ct)
    {
        limit = Math.Clamp(limit, 1, 100);
        if (key.HasValue) q = q.Where(s => s.CreatedAtUtc < key.Value.CreatedAtUtc || (s.CreatedAtUtc == key.Value.CreatedAtUtc && s.Id.CompareTo(key.Value.Id) < 0));
        var rows = await q.OrderByDescending(s => s.CreatedAtUtc).ThenByDescending(s => s.Id).Take(limit + 1).ToListAsync(ct);
        var more = rows.Count > limit;
        if (more) rows.RemoveAt(limit);
        var items = new List<StoryDto>();
        foreach (var s in rows) items.Add(await Map(s, ct));
        return new CursorPage<StoryDto>(items, more && rows.Count > 0 ? SocialCursorCodec.Encode(rows[^1].CreatedAtUtc, rows[^1].Id) : null);
    }

    private async Task<StoryDto> Map(Story s, CancellationToken ct)
    {
        var a = await db.UserProfiles.AsNoTracking().Where(x => x.UserId == s.AuthorUserId).Select(x => new { x.Name, x.Username, x.Avatar }).SingleAsync(ct);
        return new StoryDto(s.Id, s.AuthorUserId, a.Name, a.Username, a.Avatar, s.Text, s.MediaType, s.MediaUrl, s.AltText, s.Audience, s.CreatedAtUtc, s.ExpiresAtUtc);
    }
}