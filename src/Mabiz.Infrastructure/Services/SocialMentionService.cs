using System.Text.RegularExpressions;
using Mabiz.Application.Contracts;
using Mabiz.Application.Interfaces;
using Mabiz.Application.Services;
using Mabiz.Domain.Menu;
using Mabiz.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Mabiz.Infrastructure.Services;

public sealed class SocialMentionService(AppDbContext db, INotificationService notificationWriter, IMenuPrivacyPolicy privacy)
{
    private const int MaxMentions = 10;
    private static readonly Regex MentionPattern = new(@"(?<![\w@])@([A-Za-z0-9_.]{3,30})", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static List<string> ExtractUsernames(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return new List<string>();
        return MentionPattern.Matches(text)
            .Select(m => m.Groups[1].Value.TrimEnd('.'))
            .Where(x => x.Length > 0)
            .Select(x => x.ToUpperInvariant())
            .Distinct()
            .Take(MaxMentions)
            .ToList();
    }

    public async Task NotifyAsync(Guid actor, string? text, Guid postId, Guid? businessId, string eventKeyPrefix, Func<Guid, Task<bool>> canView, CancellationToken ct)
    {
        var names = ExtractUsernames(text);
        if (names.Count == 0) return;
        var targets = await db.UserProfiles.AsNoTracking()
            .Where(x => names.Contains(x.UsernameNormalized) && x.UserId != actor && db.Users.Any(u => u.Id == x.UserId && u.IsActive))
            .Select(x => x.UserId).ToListAsync(ct);
        foreach (var target in targets)
        {
            var blocked = await db.UserBlocks.AsNoTracking().AnyAsync(x => (x.BlockerUserId == actor && x.BlockedUserId == target) || (x.BlockerUserId == target && x.BlockedUserId == actor), ct);
            if (blocked) continue;
            var permission = await db.Set<MenuSettings>().AsNoTracking().Where(x => x.UserId == target).Select(x => x.MentionPermission).SingleOrDefaultAsync(ct) ?? "everyone";
            var follower = await db.UserFollows.AnyAsync(x => x.FollowerUserId == actor && x.FollowedUserId == target, ct);
            if (!privacy.CanInteract(permission, follower, false).Allowed) continue;
            if (!await canView(target)) continue;
            await notificationWriter.CreateEventAsync(new NotificationEventRequest(actor, [target], "mention", "You were mentioned", "Someone mentioned you.",
                "post", postId, eventKeyPrefix, businessId, PostId: postId), ct);
        }
    }
}