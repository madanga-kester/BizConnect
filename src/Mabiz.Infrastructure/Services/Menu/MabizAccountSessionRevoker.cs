using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Mabiz.Infrastructure.Persistence;

namespace Mabiz.Infrastructure.Menu;

public sealed class MabizAccountSessionRevoker(AppDbContext db, TimeProvider clock) : IAccountSessionRevoker
{
    public async Task RevokeAllAsync(Guid userId, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var sessions = await db.UserSessions.Where(x => x.UserId == userId && x.RevokedAtUtc == null).ToListAsync(ct);
        if (sessions.Count == 0) return;
        var sessionIds = sessions.Select(x => x.Id).ToArray();
        foreach (var session in sessions) session.RevokedAtUtc = now;
        await db.RefreshTokens.Where(x => sessionIds.Contains(x.SessionId) && x.RevokedAtUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAtUtc, now), ct);
        await db.SaveChangesAsync(ct);
    }
}
