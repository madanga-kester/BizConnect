using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Mabiz.Infrastructure.Persistence;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Mabiz")
            ?? Environment.GetEnvironmentVariable("Mabiz_CONNECTION_STRING")
            ?? ReadFromApiSettings();
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("No PostgreSQL connection string found. Set ConnectionStrings__Mabiz or Mabiz_CONNECTION_STRING, or add ConnectionStrings:Mabiz to src/Mabiz.Api/appsettings.json or appsettings.Development.json.");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
            .Options;
        return new AppDbContext(options);
    }

    private static string? ReadFromApiSettings()
    {
        var apiDirectory = FindApiDirectory();
        if (apiDirectory is null)
            return null;

        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? "Development";

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiDirectory)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .Build();

        return configuration.GetConnectionString("Mabiz");
    }

    private static string? FindApiDirectory()
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, "src", "Mabiz.Api");
            if (Directory.Exists(candidate))
                return candidate;
            directory = directory.Parent;
        }
        return null;
    }
}