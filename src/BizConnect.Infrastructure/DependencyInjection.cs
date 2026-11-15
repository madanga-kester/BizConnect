using BizConnect.Application.Configuration;
using BizConnect.Application.Services;
using BizConnect.Domain.Catalogue;
using BizConnect.Infrastructure.Persistence;
using BizConnect.Infrastructure.Security;
using BizConnect.Infrastructure.Notifications;
using BizConnect.Infrastructure.Services;
using BizConnect.Infrastructure.Storage;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace BizConnect.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddBizConnectInfrastructure(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        var connectionString = configuration.GetConnectionString("BizConnect");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:BizConnect must be configured for the BizConnect API.");

        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString,
            postgres => postgres.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));
        services.AddIdentityCore<BizConnectUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequiredLength = 12;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.MaxFailedAccessAttempts = 8;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.SignIn.RequireConfirmedEmail = false;
        })
        .AddRoles<IdentityRole<Guid>>()
        .AddEntityFrameworkStores<AppDbContext>()
        .AddSignInManager()
        .AddDefaultTokenProviders();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IBusinessService, BusinessService>();
        services.AddScoped<SocialService>();
        services.AddScoped<SocialRelationshipService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IMediaService, MediaService>();
        services.AddScoped<IMessagingService, MessagingService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IGrowthService, GrowthService>();
        services.AddSingleton(TimeProvider.System);
        services.AddDataProtection().SetApplicationName("BizConnect");
        services.Configure<PushOptions>(configuration.GetSection(PushOptions.SectionName));
        services.AddHttpClient<IPushNotificationProvider, ExpoPushNotificationProvider>();
        services.AddSingleton<IAccessTokenIssuer, AccessTokenIssuer>();
        
        
        
               services.Configure<MailOptions>(configuration.GetSection(MailOptions.SectionName));
        services.AddSingleton<IVerificationCodeSender>(provider =>
        {
            var mail = provider.GetRequiredService<IOptions<MailOptions>>().Value;
            if (mail.IsComplete)
                return new SmtpVerificationCodeSender(mail, provider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<SmtpVerificationCodeSender>>());
            if (environment.IsDevelopment())
                return new DevelopmentVerificationCodeSender(provider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<DevelopmentVerificationCodeSender>>());
            return new UnconfiguredVerificationCodeSender();
        });




        AddMediaStorage(services, configuration, environment);
        return services;
    }

    /// <summary>
    /// Selects the media storage backend from the "Storage" configuration section.
    ///
    /// The section is bound without ValidateDataAnnotations on purpose: the S3 sub-section holds
    /// [Required] credentials that a local-storage deployment never sets, so validating the whole graph
    /// would stop unrelated startup. An S3 provider that is selected but incomplete reports
    /// STORAGE_MISCONFIGURED when it is constructed instead.
    ///
    /// Nested keys must stay nested when supplied through environment variables:
    /// Storage__Provider, Storage__MaximumUploadMebibytes, Storage__Local__RootPath,
    /// Storage__S3__Endpoint, Storage__S3__Bucket, Storage__S3__Region, Storage__S3__AccessKey,
    /// Storage__S3__SecretKey, Storage__S3__UsePathStyle, Storage__S3__KeyPrefix.
    /// Flattened forms such as Storage__S3Bucket bind to nothing and silently leave the section empty.
    /// </summary>
    private static void AddMediaStorage(IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.AddSingleton(provider => provider.GetRequiredService<IOptions<StorageOptions>>().Value);
        services.AddSingleton<IMediaStorageProvider>(provider =>
        {
            var options = provider.GetRequiredService<StorageOptions>();
            return string.Equals(options.Provider, MediaStorageProviders.S3, StringComparison.OrdinalIgnoreCase)
                ? new S3CompatibleStorageProvider(options.S3, environment.IsProduction())
                : new LocalStorageProvider(options.Local, environment.ContentRootPath);
        });
    }
}
