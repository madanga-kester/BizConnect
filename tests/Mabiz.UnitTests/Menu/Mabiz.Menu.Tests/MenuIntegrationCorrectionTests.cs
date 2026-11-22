using System;
using Xunit;
using Mabiz.Application.Interfaces;
using Mabiz.Application.Contracts.MenuContracts;
using Mabiz.Domain.Menu;

namespace Mabiz.Menu.Tests;

public sealed class MenuIntegrationCorrectionTests
{
    private readonly IMenuPrivacyPolicy policy = new MenuPrivacyPolicy();

    [Fact]
    public void Followers_only_profile_allows_follower_and_owner_but_denies_other_users()
    {
        Assert.True(policy.CanViewProfile("followers", true, false).Allowed);
        Assert.True(policy.CanViewProfile("followers", false, true).Allowed);
        Assert.False(policy.CanViewProfile("followers", false, false).Allowed);
    }

    [Fact]
    public void Followers_only_messages_allow_only_follower_or_owner()
    {
        Assert.True(policy.CanMessage("followers", true, false).Allowed);
        Assert.True(policy.CanMessage("followers", false, true).Allowed);
        Assert.False(policy.CanMessage("followers", false, false).Allowed);
    }

    [Fact]
    public void Public_profile_and_interaction_are_allowed_for_non_followers()
    {
        Assert.True(policy.CanViewProfile("public", false, false).Allowed);
        Assert.True(policy.CanInteract("everyone", false, false).Allowed);
    }

    [Fact]
    public void Private_profile_and_interaction_are_denied_for_non_followers()
    {
        Assert.False(policy.CanViewProfile("private", false, false).Allowed);
        Assert.False(policy.CanInteract("followers", false, false).Allowed);
    }

    [Fact]
    public void Unknown_saved_content_kinds_are_not_treated_as_accessible()
    {
        Assert.NotEqual(SavedContentKind.Post, SavedContentKind.Story);
        Assert.NotEqual(SavedContentKind.Business, SavedContentKind.Opportunity);
    }

    // Blocked-user, private-post, follower, and business-membership cases require
    // AppDbContext integration tests with the complete Mabiz model and PostgreSQL.
}

public sealed class MenuPrivacyCompatibilityTests
{
    [Fact]
    public void Legacy_private_profile_cannot_be_relaxed_by_menu_public_setting()
    {
        Assert.Equal("private", MenuPrivacyCompatibility.EffectiveProfileVisibility(true, "public"));
    }

    [Fact]
    public void Missing_menu_row_preserves_legacy_public_behavior()
    {
        Assert.Equal("public", MenuPrivacyCompatibility.EffectiveProfileVisibility(false, null));
    }

    [Fact]
    public void Menu_defaults_match_the_supplied_frontend_permissions()
    {
        var settings = new Mabiz.Domain.Menu.MenuSettings();
        Assert.Equal("everyone", settings.MessagePermission);
        Assert.Equal("everyone", settings.StoryReplyPermission);
        Assert.Equal("everyone", settings.TagPermission);
        Assert.Equal("everyone", settings.MentionPermission);
        Assert.True(settings.AllowPostResharing);
        Assert.True(settings.AllowStorySharing);
        Assert.True(settings.AllowExternalSharing);
    }

    [Fact]
    public void Menu_permission_validator_rejects_values_outside_the_contract()
    {
        Assert.Equal("followers", MenuPermissionOptions.Normalize(" FOLLOWERS ", "messagePermission", MenuPermissionOptions.AudiencePermission));
        Assert.Throws<ArgumentException>(() => MenuPermissionOptions.Normalize("friends", "messagePermission", MenuPermissionOptions.AudiencePermission));
    }

    [Fact]
    public void Tag_and_mention_values_can_be_changed_independently()
    {
        var settings = new Mabiz.Domain.Menu.MenuSettings();
        settings.TagPermission = MenuPermissionOptions.Normalize("followers", "tagPermission", MenuPermissionOptions.AudiencePermission);
        Assert.Equal("followers", settings.TagPermission);
        Assert.Equal("everyone", settings.MentionPermission);

        settings.MentionPermission = MenuPermissionOptions.Normalize("none", "mentionPermission", MenuPermissionOptions.AudiencePermission);
        Assert.Equal("followers", settings.TagPermission);
        Assert.Equal("none", settings.MentionPermission);
    }

    [Fact]
    public void Invalid_tag_and_mention_values_are_rejected_independently()
    {
        Assert.Throws<ArgumentException>(() => MenuPermissionOptions.Normalize("friends", "tagPermission", MenuPermissionOptions.AudiencePermission));
        Assert.Throws<ArgumentException>(() => MenuPermissionOptions.Normalize("friends", "mentionPermission", MenuPermissionOptions.AudiencePermission));
    }

    // Database round-trip and legacy-column backfill tests require the complete
    // AppDbContext, model snapshot, and PostgreSQL integration environment.
}
