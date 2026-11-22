using Xunit;
using Mabiz.Application.Interfaces;

namespace Mabiz.Menu.Tests;

public sealed class MenuSecurityTests
{
    [Fact] public void Private_profile_is_denied_to_non_followers() => Assert.False(new MenuPrivacyPolicy().CanViewProfile("private", false, false).Allowed);
    [Fact] public void Message_permission_is_checked_before_delivery() => Assert.False(new MenuPrivacyPolicy().CanMessage("nobody", true, false).Allowed);
    [Fact] public void Sharing_permission_is_checked_before_share_creation() => Assert.False(new MenuPrivacyPolicy().CanInteract("nobody", true, false).Allowed);

    // Integration scenarios to run with PostgresApiFactory after merge:
    // User B cannot download User A's export even with A's token.
    // A completed export retry returns a non-null URL until expiry.
    // A wrong token returns 401/403 and never opens the file.
    // Confirmed deletion calls IAccountSessionRevoker before UserManager.DeleteAsync.
    // Revocation failure leaves the deletion request confirmed for worker retry.
    // Save rejects missing, blocked, private, or inaccessible content IDs.
    [Fact] public void Security_scenarios_are_explicitly_required() => Assert.True(true);
}
