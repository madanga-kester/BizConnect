using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Mabiz.Application.Contracts.MenuContracts;

namespace Mabiz.Infrastructure.Menu;

public sealed record MenuDeletionWorkerOptions(int IntervalMinutes = 60);

public sealed class ScheduledDeletionWorker(IServiceScopeFactory scopes, IOptions<MenuDeletionWorkerOptions> options, ILogger<ScheduledDeletionWorker> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var delay = TimeSpan.FromMinutes(Math.Max(1, options.Value.IntervalMinutes));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var workflow = scope.ServiceProvider.GetRequiredService<IAccountWorkflowService>();
                var count = await workflow.ExecuteScheduledDeletionsAsync(stoppingToken);
                if (count > 0) log.LogInformation("Executed {Count} scheduled Mabiz account deletions.", count);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex) { log.LogError(ex, "Mabiz scheduled deletion run failed; it will retry."); }
            await Task.Delay(delay, stoppingToken);
        }
    }
}
