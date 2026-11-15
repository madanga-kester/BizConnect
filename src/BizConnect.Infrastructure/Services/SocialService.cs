using System.Text;
using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using BizConnect.Domain.Accounts;
using BizConnect.Domain.Businesses;
using BizConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BizConnect.Infrastructure.Services;

public sealed class SocialService(AppDbContext db, TimeProvider clock, INotificationService notificationWriter)
{
    private DateTimeOffset Now => clock.GetUtcNow();

    public async Task<PostDto> CreatePost(Guid actor, CreatePostRequest req, CancellationToken ct)
    {
        ValidateMedia(req.Media);
        if (req.Kind == PostKinds.Product && string.IsNullOrWhiteSpace(req.ProductJson)) throw ApiException.BadRequest("PRODUCT_DATA_REQUIRED", "Product posts require productJson.");
        if (req.BusinessId.HasValue) await RequirePublisher(actor, req.BusinessId.Value, ct);
        var now = Now; var post = new Post { Id = Guid.NewGuid(), AuthorUserId = actor, BusinessId = req.BusinessId, Kind = req.Kind, Audience = req.Audience, Discoverable = req.Discoverable, AllowComments = req.AllowComments, Location = req.Location?.Trim(), Text = req.Text.Trim(), ProductJson = req.ProductJson, CreatedAtUtc = now, UpdatedAtUtc = now };
        db.Posts.Add(post); AddMedia(post.Id, req.Media); await db.SaveChangesAsync(ct); return await MapPost(post, actor, ct);
    }
    public async Task<PostDto> GetPost(Guid actor, Guid id, CancellationToken ct) { var p = await VisiblePost(actor, id, ct); return await MapPost(p, actor, ct); }
    public async Task<PostDto> UpdatePost(Guid actor, Guid id, UpdatePostRequest req, CancellationToken ct)
    {
        var p = await VisiblePost(actor, id, ct); if (p.BusinessId.HasValue) await RequirePublisher(actor, p.BusinessId.Value, ct); else if (p.AuthorUserId != actor) throw ApiException.Forbidden("POST_AUTHOR_ONLY", "Only the post author may edit this post.");
        if (req.Media is not null) ValidateMedia(req.Media);
        if (req.Kind is not null) p.Kind = req.Kind; if (req.Text is not null) p.Text = req.Text.Trim(); if (req.Audience is not null) p.Audience = req.Audience;
        if (req.Discoverable.HasValue) p.Discoverable = req.Discoverable.Value; if (req.AllowComments.HasValue) p.AllowComments = req.AllowComments.Value; if (req.Location is not null) p.Location = string.IsNullOrWhiteSpace(req.Location) ? null : req.Location.Trim(); if (req.ProductJson is not null) p.ProductJson = req.ProductJson;
        if (req.Media is not null) { var old = await db.PostMediaReferences.Where(x => x.PostId == id).ToListAsync(ct); db.PostMediaReferences.RemoveRange(old); AddMedia(id, req.Media); }
        if (p.Kind == PostKinds.Product && string.IsNullOrWhiteSpace(p.ProductJson)) throw ApiException.BadRequest("PRODUCT_DATA_REQUIRED", "Product posts require productJson.");
        p.UpdatedAtUtc = Now; await db.SaveChangesAsync(ct); return await MapPost(p, actor, ct);
    }
    public async Task DeletePost(Guid actor, Guid id, CancellationToken ct)
    {
        var p = await VisiblePost(actor, id, ct); if (p.BusinessId.HasValue) await RequirePublisher(actor, p.BusinessId.Value, ct); else if (p.AuthorUserId != actor) throw ApiException.Forbidden("POST_AUTHOR_ONLY", "Only the post author may delete this post."); db.Posts.Remove(p); await db.SaveChangesAsync(ct);
    }
    public async Task<CursorPage<PostDto>> Feed(Guid actor, bool following, string? cursor, int limit, CancellationToken ct)
    {
        limit = NormalizeLimit(limit); var key = SocialCursorCodec.Decode(cursor);
        var q = VisibleQuery(actor).Where(p => following
            ? db.UserFollows.Any(f => f.FollowerUserId == actor && f.FollowedUserId == p.AuthorUserId) || (p.BusinessId.HasValue && db.BusinessFollows.Any(f => f.UserId == actor && f.BusinessId == p.BusinessId.Value))
            : p.Audience == PostAudiences.Public && p.Discoverable);
        if (!following) q = q.Where(p => p.BusinessId == null || db.Businesses.Any(b => b.Id == p.BusinessId && b.Visibility == BusinessVisibility.Public));
        if (key.HasValue) q = q.Where(p => p.CreatedAtUtc < key.Value.CreatedAtUtc || (p.CreatedAtUtc == key.Value.CreatedAtUtc && p.Id.CompareTo(key.Value.Id) < 0));
        var rows = await q.OrderByDescending(p => p.CreatedAtUtc).ThenByDescending(p => p.Id).Take(limit + 1).ToListAsync(ct);
        return await MapPage(rows, actor, limit, ct);
    }
    public async Task<CursorPage<PostDto>> UserPosts(Guid actor, Guid target, string? cursor, int limit, CancellationToken ct)
    {
        await EnsureRelationshipVisible(actor, target, ct); var key = SocialCursorCodec.Decode(cursor); var q = VisibleQuery(actor).Where(x => x.AuthorUserId == target && x.BusinessId == null);
        if (key.HasValue) q = q.Where(p => p.CreatedAtUtc < key.Value.CreatedAtUtc || (p.CreatedAtUtc == key.Value.CreatedAtUtc && p.Id.CompareTo(key.Value.Id) < 0));
        var rows = await q.OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id).Take(NormalizeLimit(limit) + 1).ToListAsync(ct); return await MapPage(rows, actor, NormalizeLimit(limit), ct);
    }
    public async Task<CursorPage<PostDto>> BusinessPosts(Guid actor, Guid target, string? cursor, int limit, CancellationToken ct)
    {
        await EnsureBusinessVisible(actor, target, ct); var key = SocialCursorCodec.Decode(cursor); var q = VisibleQuery(actor).Where(x => x.BusinessId == target);
        if (key.HasValue) q = q.Where(p => p.CreatedAtUtc < key.Value.CreatedAtUtc || (p.CreatedAtUtc == key.Value.CreatedAtUtc && p.Id.CompareTo(key.Value.Id) < 0));
        var l = NormalizeLimit(limit); var rows = await q.OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id).Take(l + 1).ToListAsync(ct); return await MapPage(rows, actor, l, ct);
    }
    public async Task<bool> Like(Guid actor, Guid postId, CancellationToken ct)
    {
        var p = await VisiblePost(actor, postId, ct); await EnsureInteractionAllowed(actor, p.AuthorUserId, ct);
        var existing = await db.PostLikes.FindAsync([postId, actor], ct); if (existing is not null) return false;
        var now = Now;
        var recipients = p.BusinessId is Guid businessId
            ? await db.BusinessMemberships.AsNoTracking().Where(x => x.BusinessId == businessId && x.RevokedAtUtc == null
                && (x.Role == BusinessRoles.Owner || x.Role == BusinessRoles.Admin || x.Role == BusinessRoles.Editor)).Select(x => x.UserId).ToListAsync(ct)
            : [p.AuthorUserId];
        db.PostLikes.Add(new PostLike { PostId = postId, UserId = actor, CreatedAtUtc = now });
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actor, recipients, "like", "New like", "Someone liked your post.",
            "post", postId, $"like:{postId:N}:{actor:N}:{now.UtcDateTime.Ticks}", p.BusinessId, PostId: postId), ct);
        await db.SaveChangesAsync(ct); return true;
    }
    public async Task Unlike(Guid actor, Guid postId, CancellationToken ct)
    {
        var p = await VisiblePost(actor, postId, ct); await EnsureInteractionAllowed(actor, p.AuthorUserId, ct);
        var like = await db.PostLikes.FindAsync([postId, actor], ct); if (like is not null) { db.PostLikes.Remove(like); await db.SaveChangesAsync(ct); }
    }
    public async Task<CursorPage<LikeDto>> Likes(Guid actor, Guid postId, string? cursor, int limit, CancellationToken ct)
    {
        _ = await VisiblePost(actor, postId, ct); var key = SocialCursorCodec.Decode(cursor); var q = from l in db.PostLikes.AsNoTracking() join u in db.UserProfiles.AsNoTracking() on l.UserId equals u.UserId where l.PostId == postId && (!u.PrivateProfile || l.UserId == actor) && !db.UserBlocks.Any(b => (b.BlockerUserId == actor && b.BlockedUserId == l.UserId) || (b.BlockerUserId == l.UserId && b.BlockedUserId == actor)) select new { l.UserId, u.Name, l.CreatedAtUtc, l.PostId };
        if (key.HasValue) q = q.Where(x => x.CreatedAtUtc < key.Value.CreatedAtUtc || (x.CreatedAtUtc == key.Value.CreatedAtUtc && x.UserId.CompareTo(key.Value.Id) < 0));
        var lmt = NormalizeLimit(limit); var rows = await q.OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.UserId).Take(lmt + 1).ToListAsync(ct); var more = rows.Count > lmt; if (more) rows.RemoveAt(lmt);
        return new(rows.Select(x => new LikeDto(x.UserId, x.Name, x.CreatedAtUtc)).ToList(), more && rows.Count > 0 ? SocialCursorCodec.Encode(rows[^1].CreatedAtUtc, rows[^1].UserId) : null);
    }
    public async Task<CommentDto> AddComment(Guid actor, Guid postId, CommentRequest req, Guid? parent, CancellationToken ct)
    {
        var post = await VisiblePost(actor, postId, ct); await EnsurePostInteractionAllowed(actor, post, ct); if (!post.AllowComments) throw ApiException.Conflict("COMMENTS_DISABLED", "Comments are disabled for this post.");
        Guid? parentAuthorId = null;
        if (parent.HasValue) { var parentComment = await VisibleComments(actor).SingleOrDefaultAsync(x => x.Id == parent && x.PostId == postId, ct) ?? throw ApiException.NotFound("COMMENT_NOT_FOUND", "The parent comment was not found."); await EnsureInteractionAllowed(actor, parentComment.AuthorUserId, ct); parentAuthorId = parentComment.AuthorUserId; }
        var now = Now;
        var recipients = post.BusinessId is Guid businessId
            ? await db.BusinessMemberships.AsNoTracking().Where(x => x.BusinessId == businessId && x.RevokedAtUtc == null
                && (x.Role == BusinessRoles.Owner || x.Role == BusinessRoles.Admin || x.Role == BusinessRoles.Editor)).Select(x => x.UserId).ToListAsync(ct)
            : [post.AuthorUserId];
        if (parentAuthorId.HasValue) recipients.Add(parentAuthorId.Value);
        var c = new SocialComment { Id = Guid.NewGuid(), PostId = postId, AuthorUserId = actor, ParentCommentId = parent, Text = req.Text.Trim(), CreatedAtUtc = now, UpdatedAtUtc = now };
        db.Comments.Add(c);
        var isReply = parent.HasValue;
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actor, recipients, isReply ? "reply" : "comment",
            isReply ? "New reply" : "New comment", isReply ? "Someone replied to a conversation you joined." : "Someone commented on your post.",
            "post", postId, $"comment:{c.Id:N}", post.BusinessId, PostId: postId), ct);
        await db.SaveChangesAsync(ct); return await MapComment(c, actor, ct);
    }
    public async Task<CursorPage<CommentDto>> GetComments(Guid actor, Guid postId, Guid? parent, string? cursor, int limit, CancellationToken ct)
    {
        _ = await VisiblePost(actor, postId, ct); var key = SocialCursorCodec.Decode(cursor); var q = VisibleComments(actor).Where(x => x.PostId == postId && x.ParentCommentId == parent);
        if (key.HasValue) q = q.Where(x => x.CreatedAtUtc < key.Value.CreatedAtUtc || (x.CreatedAtUtc == key.Value.CreatedAtUtc && x.Id.CompareTo(key.Value.Id) < 0));
        var lmt = NormalizeLimit(limit); var rows = await q.OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id).Take(lmt + 1).ToListAsync(ct); var more = rows.Count > lmt; if (more) rows.RemoveAt(lmt); var items = new List<CommentDto>(); foreach (var c in rows) items.Add(await MapComment(c, actor, ct));
        return new(items, more && rows.Count > 0 ? SocialCursorCodec.Encode(rows[^1].CreatedAtUtc, rows[^1].Id) : null);
    }
    public async Task<Guid> GetPostForComment(Guid actor, Guid commentId, CancellationToken ct)
    {
        var c = await VisibleComments(actor).SingleOrDefaultAsync(x => x.Id == commentId, ct) ?? throw ApiException.NotFound("COMMENT_NOT_FOUND", "The comment was not found.");
        var post = await VisiblePost(actor, c.PostId, ct); await EnsurePostInteractionAllowed(actor, post, ct); return c.PostId;
    }
    public async Task<CursorPage<CommentDto>> GetReplies(Guid actor, Guid commentId, string? cursor, int limit, CancellationToken ct)
    {
        var postId = await GetPostForComment(actor, commentId, ct); return await GetComments(actor, postId, commentId, cursor, limit, ct);
    }
    public async Task<CommentDto> UpdateComment(Guid actor, Guid id, CommentRequest req, CancellationToken ct)
    {
        if (!await VisibleComments(actor).AnyAsync(x => x.Id == id, ct)) throw ApiException.NotFound("COMMENT_NOT_FOUND", "The comment was not found."); var c = await db.Comments.SingleAsync(x => x.Id == id, ct); var post = await VisiblePost(actor, c.PostId, ct); await EnsurePostInteractionAllowed(actor, post, ct); if (c.AuthorUserId != actor) throw ApiException.Forbidden("COMMENT_AUTHOR_ONLY", "Only the comment author may edit it."); c.Text = req.Text.Trim(); c.UpdatedAtUtc = Now; await db.SaveChangesAsync(ct); return await MapComment(c, actor, ct);
    }
    public async Task DeleteComment(Guid actor, Guid id, CancellationToken ct)
    {
        if (!await VisibleComments(actor).AnyAsync(x => x.Id == id, ct)) throw ApiException.NotFound("COMMENT_NOT_FOUND", "The comment was not found."); var c = await db.Comments.SingleAsync(x => x.Id == id, ct); var post = await VisiblePost(actor, c.PostId, ct); await EnsurePostInteractionAllowed(actor, post, ct); if (c.AuthorUserId != actor) throw ApiException.Forbidden("COMMENT_AUTHOR_ONLY", "Only the comment author may delete it."); db.Comments.Remove(c); await db.SaveChangesAsync(ct);
    }
    public async Task<PollDto> CreatePoll(Guid actor, Guid postId, CreatePollRequest req, CancellationToken ct)
    {
        var post = await VisiblePost(actor, postId, ct); if (post.AuthorUserId != actor) throw ApiException.Forbidden("POST_AUTHOR_ONLY", "Only the post author may attach a poll."); if (req.Options.Any(string.IsNullOrWhiteSpace) || req.Options.Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != req.Options.Count) throw ApiException.BadRequest("INVALID_POLL_OPTIONS", "Poll options must be nonempty and unique."); if (req.ClosesAt.HasValue && req.ClosesAt.Value <= Now) throw ApiException.BadRequest("INVALID_POLL_CLOSE_DATE", "Poll close date must be in the future."); if (await db.Polls.AnyAsync(x => x.PostId == postId, ct)) throw ApiException.Conflict("POLL_EXISTS", "A post can have only one poll.");
        var poll = new SocialPoll { Id = Guid.NewGuid(), PostId = postId, Question = req.Question.Trim(), ClosesAtUtc = req.ClosesAt, CreatedAtUtc = Now }; foreach (var (text, i) in req.Options.Select((x, i) => (x, i))) poll.Options.Add(new PollOption { Id = Guid.NewGuid(), PollId = poll.Id, Text = text.Trim(), SortOrder = i }); db.Polls.Add(poll); await db.SaveChangesAsync(ct); return await MapPoll(poll.Id, actor, ct);
    }
    public async Task<PollDto> GetPoll(Guid actor, Guid pollId, CancellationToken ct) { var poll = await db.Polls.AsNoTracking().SingleOrDefaultAsync(x => x.Id == pollId, ct) ?? throw ApiException.NotFound("POLL_NOT_FOUND", "The poll was not found."); _ = await VisiblePost(actor, poll.PostId, ct); return await MapPoll(pollId, actor, ct); }
    public async Task<PollDto> Vote(Guid actor, Guid pollId, Guid optionId, CancellationToken ct)
    {
        var poll = await db.Polls.SingleOrDefaultAsync(x => x.Id == pollId, ct) ?? throw ApiException.NotFound("POLL_NOT_FOUND", "The poll was not found."); var post = await VisiblePost(actor, poll.PostId, ct); await EnsurePostInteractionAllowed(actor, post, ct); if (poll.ClosesAtUtc.HasValue && poll.ClosesAtUtc <= Now) throw ApiException.Conflict("POLL_CLOSED", "Voting is closed."); if (!await db.PollOptions.AnyAsync(x => x.Id == optionId && x.PollId == pollId, ct)) throw ApiException.BadRequest("INVALID_POLL_OPTION", "The option does not belong to this poll."); if (await db.PollVotes.AnyAsync(x => x.PollId == pollId && x.UserId == actor, ct)) throw ApiException.Conflict("ALREADY_VOTED", "A user may vote only once per poll."); db.PollVotes.Add(new PollVote { PollId = pollId, OptionId = optionId, UserId = actor, CreatedAtUtc = Now }); await db.SaveChangesAsync(ct); return await MapPoll(pollId, actor, ct);
    }
    public async Task<PollDto> Results(Guid actor, Guid pollId, CancellationToken ct) => await GetPoll(actor, pollId, ct);

    private IQueryable<Post> VisibleQuery(Guid actor) => db.Posts.AsNoTracking().Where(p =>
        !db.HiddenPosts.Any(h => h.PostId == p.Id && h.UserId == actor) &&
        (p.AuthorUserId == actor || !db.UserBlocks.Any(b =>
            (b.BlockerUserId == actor && b.BlockedUserId == p.AuthorUserId) ||
            (b.BlockerUserId == p.AuthorUserId && b.BlockedUserId == actor))) &&
        (p.BusinessId == null || !db.Businesses.Any(b => b.Id == p.BusinessId && db.UserBlocks.Any(block =>
            (block.BlockerUserId == actor && block.BlockedUserId == b.OwnerUserId) ||
            (block.BlockerUserId == b.OwnerUserId && block.BlockedUserId == actor)))) &&
        (p.BusinessId == null
            ? (p.AuthorUserId == actor ||
               (db.UserProfiles.Any(u => u.UserId == p.AuthorUserId && !u.PrivateProfile) &&
                (p.Audience == PostAudiences.Public ||
                 (p.Audience == PostAudiences.Followers && db.UserFollows.Any(f => f.FollowerUserId == actor && f.FollowedUserId == p.AuthorUserId)))))
            : db.Businesses.Any(b => b.Id == p.BusinessId && b.Status == BusinessStatuses.Active &&
                (b.Visibility == BusinessVisibility.Public || db.BusinessMemberships.Any(m => m.BusinessId == b.Id && m.UserId == actor && m.RevokedAtUtc == null)) &&
                (p.Audience == PostAudiences.Public ||
                 (p.Audience == PostAudiences.Followers && (db.BusinessFollows.Any(f => f.UserId == actor && f.BusinessId == b.Id) || db.BusinessMemberships.Any(m => m.BusinessId == b.Id && m.UserId == actor && m.RevokedAtUtc == null))) ||
                 (p.Audience == PostAudiences.Private && (p.AuthorUserId == actor || db.BusinessMemberships.Any(m => m.BusinessId == b.Id && m.UserId == actor && m.RevokedAtUtc == null)))))));
    private async Task<Post> VisiblePost(Guid actor, Guid id, CancellationToken ct) => await VisibleQuery(actor).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiException.NotFound("POST_NOT_FOUND", "The post was not found.");
    private async Task EnsureInteractionAllowed(Guid actor, Guid target, CancellationToken ct) { if (actor == target) return; if (await IsBlocked(actor, target, ct)) throw ApiException.NotFound("RESOURCE_NOT_FOUND", "The resource was not found."); }
    private async Task EnsurePostInteractionAllowed(Guid actor, Post post, CancellationToken ct) { await EnsureInteractionAllowed(actor, post.AuthorUserId, ct); if (post.BusinessId.HasValue) { var ownerId = await db.Businesses.Where(x => x.Id == post.BusinessId.Value).Select(x => x.OwnerUserId).SingleAsync(ct); await EnsureInteractionAllowed(actor, ownerId, ct); } }
    private async Task EnsureRelationshipVisible(Guid actor, Guid target, CancellationToken ct) { if (actor != target && await IsBlocked(actor, target, ct)) throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found."); var profile = await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == target, ct) ?? throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found."); if (profile.PrivateProfile && actor != target) throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found."); }
    private Task<bool> IsBlocked(Guid a, Guid b, CancellationToken ct) => db.UserBlocks.AsNoTracking().AnyAsync(x => (x.BlockerUserId == a && x.BlockedUserId == b) || (x.BlockerUserId == b && x.BlockedUserId == a), ct);
    private async Task EnsureBusinessVisible(Guid actor, Guid id, CancellationToken ct) { var b = await db.Businesses.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.Status == BusinessStatuses.Active, ct) ?? throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found."); if (b.Visibility == BusinessVisibility.Private && !await db.BusinessMemberships.AnyAsync(x => x.BusinessId == id && x.UserId == actor && x.RevokedAtUtc == null, ct)) throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found."); }
    private async Task RequirePublisher(Guid actor, Guid business, CancellationToken ct) { if (!await db.Businesses.AnyAsync(x => x.Id == business && x.Status == BusinessStatuses.Active, ct)) throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found."); var role = await db.BusinessMemberships.Where(x => x.BusinessId == business && x.UserId == actor && x.RevokedAtUtc == null).Select(x => x.Role).SingleOrDefaultAsync(ct); if (role is null) throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found."); if (!BusinessAccessControl.Allows(role, BusinessPermission.PublishPosts)) throw ApiException.Forbidden("BUSINESS_PUBLISH_DENIED", "Your business role cannot publish posts."); }
    private void AddMedia(Guid postId, IReadOnlyList<MediaReferenceRequest> refs) { for (var i = 0; i < refs.Count; i++) db.PostMediaReferences.Add(new PostMediaReference { Id = Guid.NewGuid(), PostId = postId, MediaType = refs[i].MediaType, Url = refs[i].Url.Trim(), AltText = refs[i].AltText, SortOrder = i }); }
    private static void ValidateMedia(IReadOnlyList<MediaReferenceRequest> refs) { if (refs.Count > 10) throw ApiException.BadRequest("TOO_MANY_MEDIA_REFERENCES", "A post may reference at most 10 media items."); foreach (var m in refs) if (!Uri.TryCreate(m.Url, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps || !string.IsNullOrEmpty(uri.UserInfo)) throw ApiException.BadRequest("INVALID_MEDIA_URL", "Media references must be absolute HTTPS URLs; local device paths and other schemes are not accepted."); }
    private IQueryable<SocialComment> VisibleComments(Guid actor) => db.Comments.AsNoTracking().Where(c => db.UserProfiles.Any(u => u.UserId == c.AuthorUserId && (!u.PrivateProfile || c.AuthorUserId == actor)) && !db.UserBlocks.Any(b => (b.BlockerUserId == actor && b.BlockedUserId == c.AuthorUserId) || (b.BlockerUserId == c.AuthorUserId && b.BlockedUserId == actor)));
    private async Task<PostDto> MapPost(Post p, Guid actor, CancellationToken ct)
    {
        var media = await db.PostMediaReferences.AsNoTracking().Where(x => x.PostId == p.Id).OrderBy(x => x.SortOrder).Select(x => new MediaReferenceDto(x.Id, x.MediaType, x.Url, x.AltText, x.SortOrder)).ToListAsync(ct);
        var profile = await db.UserProfiles.AsNoTracking().Where(x => x.UserId == p.AuthorUserId).Select(x => new { x.Name, x.Username, x.Avatar }).SingleAsync(ct);
        BusinessPublisherDto? business = null;
        if (p.BusinessId.HasValue) business = await db.Businesses.AsNoTracking().Where(x => x.Id == p.BusinessId.Value).Select(x => new BusinessPublisherDto(x.Id, x.Name, x.Slug, x.Logo, x.Cover)).SingleOrDefaultAsync(ct);
        var likes = await (from l in db.PostLikes where l.PostId == p.Id && db.UserProfiles.Any(u => u.UserId == l.UserId && (!u.PrivateProfile || l.UserId == actor)) && !db.UserBlocks.Any(b => (b.BlockerUserId == actor && b.BlockedUserId == l.UserId) || (b.BlockerUserId == l.UserId && b.BlockedUserId == actor)) select l.UserId).CountAsync(ct);
        var comments = await VisibleComments(actor).CountAsync(x => x.PostId == p.Id, ct);
        var liked = await db.PostLikes.AnyAsync(x => x.PostId == p.Id && x.UserId == actor, ct);
        var pollId = await db.Polls.AsNoTracking().Where(x => x.PostId == p.Id).Select(x => (Guid?)x.Id).SingleOrDefaultAsync(ct);
        var poll = pollId.HasValue ? await MapPoll(pollId.Value, actor, ct) : null;
        return new(p.Id, p.AuthorUserId, p.BusinessId, p.Kind, p.Audience, p.Discoverable, p.AllowComments, p.Location, p.Text, p.ProductJson, p.CreatedAtUtc, p.UpdatedAtUtc, media, likes, comments, liked, pollId, new PostPublisherDto(p.AuthorUserId, profile.Name, profile.Username, profile.Avatar, business), poll);
    }
    private async Task<CursorPage<PostDto>> MapPage(List<Post> rows, Guid actor, int limit, CancellationToken ct) { var more = rows.Count > limit; if (more) rows.RemoveAt(limit); var items = new List<PostDto>(); foreach (var p in rows) items.Add(await MapPost(p, actor, ct)); return new(items, more && rows.Count > 0 ? SocialCursorCodec.Encode(rows[^1].CreatedAtUtc, rows[^1].Id) : null); }
    private async Task<CommentDto> MapComment(SocialComment c, Guid actor, CancellationToken ct)
    {
        var author = await db.UserProfiles.AsNoTracking().Where(x => x.UserId == c.AuthorUserId).Select(x => new { x.Name, x.Username, x.Avatar }).SingleAsync(ct);
        var replies = await VisibleComments(actor).CountAsync(x => x.ParentCommentId == c.Id, ct);
        return new(c.Id, c.PostId, c.AuthorUserId, c.ParentCommentId, c.Text, c.CreatedAtUtc, c.UpdatedAtUtc, replies, author.Name, author.Username, author.Avatar);
    }
    private async Task<PollDto> MapPoll(Guid id, Guid actor, CancellationToken ct) { var p = await db.Polls.AsNoTracking().SingleAsync(x => x.Id == id, ct); var opts = await db.PollOptions.AsNoTracking().Where(x => x.PollId == id).OrderBy(x => x.SortOrder).Select(x => new PollOptionDto(x.Id, x.Text, db.PollVotes.Count(v => v.PollId == id && v.OptionId == x.Id))).ToListAsync(ct); var vote = await db.PollVotes.AsNoTracking().Where(x => x.PollId == id && x.UserId == actor).Select(x => (Guid?)x.OptionId).SingleOrDefaultAsync(ct); return new(p.Id, p.PostId, p.Question, p.ClosesAtUtc, p.ClosesAtUtc.HasValue && p.ClosesAtUtc <= Now, opts, vote); }
    private static int NormalizeLimit(int n) => Math.Clamp(n, 1, 100);
}
