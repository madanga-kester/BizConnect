using BizConnect.Application.Services;
using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace BizConnect.Infrastructure.Security;

public sealed class DevelopmentVerificationCodeSender(ILogger<DevelopmentVerificationCodeSender> logger) : IVerificationCodeSender
{
    public bool IsConfigured => true;

    public Task SendAsync(string channel, string destination, string purpose, string code, CancellationToken cancellationToken)
    {
        logger.LogWarning("DEVELOPMENT ONLY verification code. Channel={Channel} Destination={Destination} Purpose={Purpose} Code={Code}", channel, destination, purpose, code);
        return Task.CompletedTask;
    }
}

public sealed class UnconfiguredVerificationCodeSender : IVerificationCodeSender
{
    public bool IsConfigured => false;

    public Task SendAsync(string channel, string destination, string purpose, string code, CancellationToken cancellationToken) =>
        throw new InvalidOperationException("No email/SMS provider is configured. Configure a delivery provider before requesting verification or password-reset codes.");
}

public sealed class MailOptions
{
    public const string SectionName = "Mail";

    public string Host { get; set; } = "";
    public int Port { get; set; } = 2525;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromAddress { get; set; } = "";
    public string FromName { get; set; } = "BizConnect";
    public bool RequireTls { get; set; } = true;

    public bool IsComplete =>
        !string.IsNullOrWhiteSpace(Host) &&
        !string.IsNullOrWhiteSpace(Username) &&
        !string.IsNullOrWhiteSpace(Password) &&
        !string.IsNullOrWhiteSpace(FromAddress);
}

public sealed class SmtpVerificationCodeSender(MailOptions options, ILogger<SmtpVerificationCodeSender> logger) : IVerificationCodeSender
{
    public bool IsConfigured => options.IsComplete;

    public async Task SendAsync(string channel, string destination, string purpose, string code, CancellationToken cancellationToken)
    {
        if (!MailboxAddress.TryParse(destination, out var recipient))
            throw new InvalidOperationException("The configured mail provider can only deliver to an email address.");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(options.FromName, options.FromAddress));
        message.To.Add(recipient);
        message.Subject = "Your BizConnect verification code";
        message.Body = new TextPart("plain")
        {
            Text = $"Your BizConnect verification code is {code}.\n\nIf you did not request this, you can ignore this email. Never share this code with anyone."
        };

        var security = options.Port == 465
            ? SecureSocketOptions.SslOnConnect
            : options.RequireTls ? SecureSocketOptions.StartTls : SecureSocketOptions.StartTlsWhenAvailable;

        using var client = new SmtpClient { Timeout = 15000 };
        try
        {
            await client.ConnectAsync(options.Host, options.Port, security, cancellationToken);
            await client.AuthenticateAsync(options.Username, options.Password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(exception, "Verification email delivery failed. Host={Host} Port={Port}", options.Host, options.Port);
            throw;
        }
    }
}

public static class VerificationSenderRegistration
{
    public static IVerificationCodeSender Create(IHostEnvironment environment, ILogger<DevelopmentVerificationCodeSender> logger) =>
        environment.IsDevelopment()
            ? new DevelopmentVerificationCodeSender(logger)
            : new UnconfiguredVerificationCodeSender();
}
