using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Mabiz.Application.Contracts.MenuContracts;
using Mabiz.Domain.Accounts;
using Mabiz.Domain.Menu;
using Mabiz.Domain.Businesses;
using Mabiz.Infrastructure.Persistence;

namespace Mabiz.Infrastructure.Menu;

public sealed record MenuExportOptions(string RootPath, int DownloadLifetimeHours = 24);
public interface IExportBlobStore { Task<string> PutAsync(Guid exportId, byte[] content, DateTimeOffset expiresAt, CancellationToken ct); Task<(Stream Content, DateTimeOffset ExpiresAt)> OpenAsync(Guid exportId, string token, CancellationToken ct); }
public interface IAccountSessionRevoker { Task RevokeAllAsync(Guid userId, CancellationToken ct); }

public sealed class LocalExportBlobStore(IOptions<MenuExportOptions> options) : IExportBlobStore
{
    public async Task<string> PutAsync(Guid exportId, byte[] content, DateTimeOffset expiresAt, CancellationToken ct)
    {
        Directory.CreateDirectory(options.Value.RootPath);
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        await File.WriteAllBytesAsync(Path.Combine(options.Value.RootPath, $"{exportId:N}.{token}.json"), content, ct);
        await File.WriteAllTextAsync(Path.Combine(options.Value.RootPath, $"{exportId:N}.expiry"), expiresAt.ToUnixTimeSeconds().ToString(), ct);
        return token;
    }
    public async Task<(Stream Content, DateTimeOffset ExpiresAt)> OpenAsync(Guid exportId, string token, CancellationToken ct)
    {
        if (token.Length != 64 || token.Any(c => !Uri.IsHexDigit(c))) throw new UnauthorizedAccessException("Invalid export token.");
        var expiryPath = Path.Combine(options.Value.RootPath, $"{exportId:N}.expiry");
        var expires = DateTimeOffset.FromUnixTimeSeconds(long.Parse(await File.ReadAllTextAsync(expiryPath, ct)));
        if (expires <= DateTimeOffset.UtcNow) throw new InvalidOperationException("Export has expired.");
        return (File.OpenRead(Path.Combine(options.Value.RootPath, $"{exportId:N}.{token}.json")), expires);
    }
}

public sealed class AccountWorkflowService(AppDbContext db, UserManager<MabizUser> users, IExportBlobStore blobs, IOptions<MenuExportOptions> options, IDataProtectionProvider protection, IAccountSessionRevoker sessionRevoker, TimeProvider clock) : IAccountWorkflowService
{
    private readonly IDataProtector tokenProtector = protection.CreateProtector("Mabiz.Menu.ExportToken.v1");

    public async Task<AccountWorkflowResponse> ProcessExportAsync(Guid userId, Guid exportId, CancellationToken ct)
    {
        var request = await OwnedExportAsync(userId, exportId, ct);
        if (request.Status == "completed" && request.ExpiresAtUtc > clock.GetUtcNow() && request.DownloadTokenProtected is not null)
        {
            var token = tokenProtector.Unprotect(request.DownloadTokenProtected);
            return Response(request, $"/api/v1/menu/account/export/{request.Id}/download?token={token}");
        }
        var document = new AccountDataExportDocument(userId, clock.GetUtcNow(), await QueryOwnedAsync<UserProfile>(userId, ct), await QueryOwnedAsync<UserPreferences>(userId, ct), await QueryOwnedAsync<UserNotificationPreferences>(userId, ct), await QueryOwnedAsync<UserDevice>(userId, ct), await QueryFollowsAsync(userId, ct), await QueryOwnedAsync<MenuSettings>(userId, ct));
        var bytes = JsonSerializer.SerializeToUtf8Bytes(document, new JsonSerializerOptions { WriteIndented = true });
        var expiry = clock.GetUtcNow().AddHours(options.Value.DownloadLifetimeHours);
        var tokenValue = await blobs.PutAsync(request.Id, bytes, expiry, ct);
        request.Status = "completed"; request.CompletedAtUtc = clock.GetUtcNow(); request.ExpiresAtUtc = expiry; request.DownloadTokenProtected = tokenProtector.Protect(tokenValue);
        await db.SaveChangesAsync(ct);
        return Response(request, $"/api/v1/menu/account/export/{request.Id}/download?token={tokenValue}");
    }

    public async Task<Stream> OpenExportAsync(Guid userId, Guid exportId, string token, CancellationToken ct)
    {
        var request = await OwnedExportAsync(userId, exportId, ct);
        if (request.Status != "completed" || request.ExpiresAtUtc <= clock.GetUtcNow() || request.DownloadTokenProtected is null) throw new InvalidOperationException("Export is unavailable or expired.");
        var expected = tokenProtector.Unprotect(request.DownloadTokenProtected);
        if (!CryptographicOperations.FixedTimeEquals(System.Text.Encoding.UTF8.GetBytes(expected), System.Text.Encoding.UTF8.GetBytes(token))) throw new UnauthorizedAccessException("Invalid export token.");
        var (content, _) = await blobs.OpenAsync(exportId, token, ct); return content;
    }

    public async Task<AccountWorkflowResponse> ConfirmDeletionAsync(Guid userId, Guid deletionId, CancellationToken ct)
    {
        var item = await db.Set<AccountDeletionRequest>().SingleOrDefaultAsync(x => x.Id == deletionId && x.UserId == userId, ct) ?? throw new KeyNotFoundException("Deletion request was not found.");
        if (item.Status is "canceled" or "completed") throw new InvalidOperationException("Deletion request is no longer active.");
        item.Status = "confirmed"; item.ConfirmedAtUtc = clock.GetUtcNow(); await db.SaveChangesAsync(ct); return new(item.Id, item.Status, null, item.ScheduledDeletionAtUtc, null);
    }
    public async Task<AccountWorkflowResponse> CancelDeletionAsync(Guid userId, Guid deletionId, CancellationToken ct)
    {
        var item = await db.Set<AccountDeletionRequest>().SingleOrDefaultAsync(x => x.Id == deletionId && x.UserId == userId, ct) ?? throw new KeyNotFoundException("Deletion request was not found.");
        if (item.Status == "completed") throw new InvalidOperationException("Completed deletion cannot be canceled.");
        item.Status = "canceled"; item.CanceledAtUtc = clock.GetUtcNow(); await db.SaveChangesAsync(ct); return new(item.Id, item.Status, null, item.ScheduledDeletionAtUtc, null);
    }
    public async Task<int> ExecuteScheduledDeletionsAsync(CancellationToken ct)
    {
        var now = clock.GetUtcNow(); var items = await db.Set<AccountDeletionRequest>().Where(x => x.Status == "confirmed" && x.ScheduledDeletionAtUtc <= now).ToListAsync(ct); var count = 0;
        foreach (var item in items)
        {
            await sessionRevoker.RevokeAllAsync(item.UserId, ct);
            var user = await users.FindByIdAsync(item.UserId.ToString());
            if (user is not null) { var result = await users.DeleteAsync(user); if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Code))); }
            item.Status = "completed"; item.ConfirmedAtUtc ??= now; count++;
        }
        await db.SaveChangesAsync(ct); return count;
    }
    private async Task<AccountDataExportRequest> OwnedExportAsync(Guid userId, Guid exportId, CancellationToken ct) => await db.Set<AccountDataExportRequest>().SingleOrDefaultAsync(x => x.Id == exportId && x.UserId == userId, ct) ?? throw new KeyNotFoundException("Export request was not found.");
    private static AccountWorkflowResponse Response(AccountDataExportRequest x, string url) => new(x.Id, x.Status, x.CompletedAtUtc, x.ExpiresAtUtc, url);
    private async Task<object> QueryOwnedAsync<T>(Guid userId, CancellationToken ct) where T : class => await db.Set<T>().AsNoTracking().Where(x => EF.Property<Guid>(x, "UserId") == userId).ToListAsync(ct);
    private async Task<object> QueryFollowsAsync(Guid userId, CancellationToken ct) => await db.Set<UserFollow>().AsNoTracking().Where(x => x.FollowerUserId == userId || x.FollowedUserId == userId).ToListAsync(ct);
}
