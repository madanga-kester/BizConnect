using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Mabiz.Application.Contracts.MenuContracts;
using Mabiz.Application.Interfaces;

namespace Mabiz.Infrastructure.Menu;

public static class MenuDependencyInjection
{
    public static IServiceCollection AddMabizMenu(this IServiceCollection services, MenuExportOptions exportOptions, int deletionIntervalMinutes = 60)
    {
        services.TryAddSingleton(TimeProvider.System);
        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(exportOptions));
        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(new MenuDeletionWorkerOptions(deletionIntervalMinutes)));
        services.AddSingleton<IMenuPrivacyPolicy, MenuPrivacyPolicy>();
        services.AddSingleton<IExportBlobStore, LocalExportBlobStore>();
        services.AddScoped<IMenuService, MenuService>();
        services.AddScoped<ISavedActivityService, SavedActivityService>();
        services.AddScoped<IAccountWorkflowService, AccountWorkflowService>();
        services.AddScoped<IAccountSessionRevoker, MabizAccountSessionRevoker>();
        services.AddScoped<IContentAccessValidator, MabizContentAccessValidator>();
        services.AddHostedService<ScheduledDeletionWorker>();
        return services;
    }
}
