namespace Mabiz.Application.Configuration;

public sealed class PushOptions
{
    public const string SectionName = "Push";
    public bool Enabled { get; set; }
    public string Provider { get; set; } = "expo";
    public string ExpoEndpoint { get; set; } = "https://exp.host/--/api/v2/push/send";
    public string ExpoAccessToken { get; set; } = string.Empty;
    public int PollIntervalSeconds { get; set; } = 5;
    public int BatchSize { get; set; } = 25;
    public int MaxAttempts { get; set; } = 8;
}
