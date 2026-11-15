using BizConnect.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace BizConnect.IntegrationTests;

public sealed class PostgresApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private static readonly string[] TestEnvironmentKeys =
    [
        "ConnectionStrings__BizConnect", "Jwt__Issuer", "Jwt__Audience", "Jwt__SigningKey",
        "Jwt__AccessTokenMinutes", "Auth__ChallengePepper", "Auth__RefreshTokenDays",
        "Auth__ChallengeExpiryMinutes", "Auth__MaximumChallengeAttempts", "Cors__AllowedOrigins__0",
        "Database__ApplyMigrationsOnStartup",
        "Storage__Provider", "Storage__Local__RootPath", "Storage__MaximumUploadMebibytes"
    ];
    private readonly Dictionary<string, string?> _originalEnvironment = TestEnvironmentKeys.ToDictionary(key => key, Environment.GetEnvironmentVariable);
    private readonly string _connectionString = Environment.GetEnvironmentVariable("BIZCONNECT_TEST_DB")
        ?? throw new InvalidOperationException("Set BIZCONNECT_TEST_DB to an isolated PostgreSQL test database before running API integration tests.");

    /// <summary>
    /// Uploaded test bytes go to a throwaway temp directory, never into the repository, so integration
    /// tests cannot leave runtime media behind. The 1 MiB cap is deliberately small: it lets the size
    /// guard be exercised without generating large payloads.
    /// </summary>
    private static readonly string TestMediaRoot =
        Path.Combine(Path.GetTempPath(), $"bizconnect-test-media-{Guid.NewGuid():N}");

    private void ValidateTestDatabase()
    {
        var database = new NpgsqlConnectionStringBuilder(_connectionString).Database;
        if (!string.Equals(database, "bizconnect_test", StringComparison.Ordinal))
            throw new InvalidOperationException("The destructive PostgreSQL API fixture requires BIZCONNECT_TEST_DB to target exactly bizconnect_test.");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:BizConnect"] = _connectionString,
            ["Jwt:Issuer"] = "BizConnect.IntegrationTests",
            ["Jwt:Audience"] = "BizConnect.TestClients",
            ["Jwt:SigningKey"] = "Integration-test-signing-key-32-bytes-minimum-value",
            ["Jwt:AccessTokenMinutes"] = "10",
            ["Auth:ChallengePepper"] = "Integration-test-challenge-pepper-32-bytes-minimum",
            ["Auth:RefreshTokenDays"] = "30",
            ["Auth:ChallengeExpiryMinutes"] = "10",
            ["Auth:MaximumChallengeAttempts"] = "5",
            ["Cors:AllowedOrigins:0"] = "http://localhost:8081",
            ["Database:ApplyMigrationsOnStartup"] = "false",
            ["Storage:Provider"] = "local",
            ["Storage:Local:RootPath"] = TestMediaRoot,
            ["Storage:MaximumUploadMebibytes"] = "1"
        }));
    }

    public async Task InitializeAsync()
    {
        ValidateTestDatabase();
        Environment.SetEnvironmentVariable("ConnectionStrings__BizConnect", _connectionString);
        Environment.SetEnvironmentVariable("Jwt__Issuer", "BizConnect.IntegrationTests");
        Environment.SetEnvironmentVariable("Jwt__Audience", "BizConnect.TestClients");
        Environment.SetEnvironmentVariable("Jwt__SigningKey", "Integration-test-signing-key-32-bytes-minimum-value");
        Environment.SetEnvironmentVariable("Jwt__AccessTokenMinutes", "10");
        Environment.SetEnvironmentVariable("Auth__ChallengePepper", "Integration-test-challenge-pepper-32-bytes-minimum");
        Environment.SetEnvironmentVariable("Auth__RefreshTokenDays", "30");
        Environment.SetEnvironmentVariable("Auth__ChallengeExpiryMinutes", "10");
        Environment.SetEnvironmentVariable("Auth__MaximumChallengeAttempts", "5");
        Environment.SetEnvironmentVariable("Cors__AllowedOrigins__0", "http://localhost:8081");
        Environment.SetEnvironmentVariable("Database__ApplyMigrationsOnStartup", "false");
        Environment.SetEnvironmentVariable("Storage__Provider", "local");
        Environment.SetEnvironmentVariable("Storage__Local__RootPath", TestMediaRoot);
        Environment.SetEnvironmentVariable("Storage__MaximumUploadMebibytes", "1");


        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureDeletedAsync();
        await db.Database.MigrateAsync();
    }

    public new Task DisposeAsync()
    {
        foreach (var (key, value) in _originalEnvironment) Environment.SetEnvironmentVariable(key, value);
        return Task.CompletedTask;
    }
}

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class PostgresApiCollection : ICollectionFixture<PostgresApiFactory>
{
    public const string Name = "BizConnect PostgreSQL API";
}
