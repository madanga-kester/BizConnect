using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BizConnect.Application.Configuration;
using BizConnect.Application.Services;
using Microsoft.Extensions.Options;

namespace BizConnect.Infrastructure.Notifications;

public sealed class ExpoPushNotificationProvider(HttpClient httpClient, IOptions<PushOptions> options) : IPushNotificationProvider
{
    private readonly PushOptions _options = options.Value;
    public bool IsConfigured => _options.Enabled
        && string.Equals(_options.Provider, "expo", StringComparison.OrdinalIgnoreCase)
        && Uri.TryCreate(_options.ExpoEndpoint, UriKind.Absolute, out var endpoint)
        && endpoint.Scheme == Uri.UriSchemeHttps
        && !string.IsNullOrWhiteSpace(_options.ExpoAccessToken);

    public async Task<PushNotificationResult> SendAsync(PushNotificationMessage message, CancellationToken cancellationToken)
    {
        if (!IsConfigured) return new(false, false, false, null, "provider_unconfigured");
        var payload = new[]
        {
            new
            {
                to = message.Token,
                title = message.Title,
                body = message.Body,
                sound = "default",
                priority = "high",
                data = new
                {
                    notificationId = message.NotificationId,
                    targetType = message.TargetType,
                    targetId = message.TargetId,
                    businessId = message.BusinessId,
                    postId = message.PostId,
                    conversationId = message.ConversationId,
                    catalogItemId = message.CatalogItemId
                }
            }
        };
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, _options.ExpoEndpoint)
            {
                Content = JsonContent.Create(payload)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ExpoAccessToken);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if ((int)response.StatusCode == 429 || (int)response.StatusCode >= 500)
                return new(false, false, true, null, $"http_{(int)response.StatusCode}");
            if (!response.IsSuccessStatusCode)
                return new(false, false, false, null, $"http_{(int)response.StatusCode}");

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (!document.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array || data.GetArrayLength() == 0)
                return new(false, false, true, null, "empty_provider_response");
            var ticket = data[0];
            var status = ticket.TryGetProperty("status", out var statusElement) ? statusElement.GetString() : null;
            var receipt = ticket.TryGetProperty("id", out var idElement) ? idElement.GetString() : null;
            if (string.Equals(status, "ok", StringComparison.OrdinalIgnoreCase))
                return new(true, false, false, receipt, null);
            var errorCode = ticket.TryGetProperty("details", out var details) && details.TryGetProperty("error", out var errorElement)
                ? errorElement.GetString() : "provider_rejected";
            var invalid = string.Equals(errorCode, "DeviceNotRegistered", StringComparison.OrdinalIgnoreCase);
            var retryable = !invalid && (string.Equals(errorCode, "MessageRateExceeded", StringComparison.OrdinalIgnoreCase)
                || string.Equals(errorCode, "ProviderError", StringComparison.OrdinalIgnoreCase));
            return new(false, invalid, retryable, receipt, Bound(errorCode));
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (HttpRequestException)
        {
            return new(false, false, true, null, "provider_network_error");
        }
        catch (JsonException)
        {
            return new(false, false, true, null, "provider_invalid_response");
        }
    }

    private static string Bound(string? value) => string.IsNullOrWhiteSpace(value) ? "provider_rejected" : value[..Math.Min(120, value.Length)];
}
