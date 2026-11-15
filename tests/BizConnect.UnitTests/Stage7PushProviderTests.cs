using BizConnect.Application.Configuration;
using BizConnect.Application.Services;
using BizConnect.Infrastructure.Notifications;
using Microsoft.Extensions.Options;

namespace BizConnect.UnitTests;

public sealed class Stage7PushProviderTests
{
    [Fact]
    public async Task UnconfiguredExpoProvider_ReturnsGracefulSuppressionWithoutNetworkAccess()
    {
        var handler = new CountingHandler();
        var provider = new ExpoPushNotificationProvider(new HttpClient(handler), Options.Create(new PushOptions
        {
            Enabled = true,
            Provider = "expo",
            ExpoEndpoint = "https://exp.host/--/api/v2/push/send",
            ExpoAccessToken = string.Empty,
        }));
        var message = new PushNotificationMessage("ExponentPushToken[ABCDEFGHIJKLMNOP]", "Title", "Body", Guid.NewGuid().ToString(), "post", Guid.NewGuid().ToString(), null, null, null, null);

        Assert.False(provider.IsConfigured);
        var result = await provider.SendAsync(message, CancellationToken.None);

        Assert.Equal(new PushNotificationResult(false, false, false, null, "provider_unconfigured"), result);
        Assert.Equal(0, handler.RequestCount);
    }

    private sealed class CountingHandler : HttpMessageHandler
    {
        public int RequestCount { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK));
        }
    }
}
