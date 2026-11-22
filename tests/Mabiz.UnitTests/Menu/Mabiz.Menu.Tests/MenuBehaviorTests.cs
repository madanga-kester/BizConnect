using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using Mabiz.Application.Contracts.MenuContracts;
using Mabiz.Application.Interfaces;
using Mabiz.Domain.Menu;
using Mabiz.Infrastructure.Menu;

namespace Mabiz.Menu.Tests;

public sealed class MenuBehaviorTests
{
    [Fact]
    public void Private_profile_denies_non_follower()
    {
        var decision = new MenuPrivacyPolicy().CanViewProfile("private", false, false);
        Assert.False(decision.Allowed);
        Assert.Equal("PROFILE_PRIVATE", decision.Code);
    }

    [Fact]
    public void Followers_can_message_when_setting_allows_followers()
    {
        var decision = new MenuPrivacyPolicy().CanMessage("followers", true, false);
        Assert.True(decision.Allowed);
    }

    [Fact]
    public void Everyone_setting_does_not_override_owner_identity_requirement_for_unknown_values()
    {
        var decision = new MenuPrivacyPolicy().CanInteract("unknown", false, false);
        Assert.False(decision.Allowed);
    }

    [Fact]
    public void Saved_content_kind_is_explicit_and_not_ambiguous()
    {
        var item = new SavedContent { UserId = Guid.NewGuid(), ContentId = Guid.NewGuid(), Kind = SavedContentKind.Opportunity };
        Assert.Equal(SavedContentKind.Opportunity, item.Kind);
    }
}
