using System;
using System.Collections.Generic;
using System.Linq;
using Mabiz.Application.Contracts.MenuContracts;

namespace Mabiz.Application.Interfaces;

public interface IMenuPrivacyPolicy
{
    PrivacyDecision CanViewProfile(string profileVisibility, bool isFollower, bool isOwner);
    PrivacyDecision CanMessage(string permission, bool isFollower, bool isOwner);
    PrivacyDecision CanInteract(string permission, bool isFollower, bool isOwner);
}

public static class MenuPrivacyCompatibility
{
    public static string EffectiveProfileVisibility(bool legacyPrivate, string? configuredVisibility)
        => legacyPrivate ? "private" : (configuredVisibility ?? "public");
}

public static class MenuPermissionOptions
{
    public static readonly string[] ProfileVisibility = ["public", "followers", "private"];
    public static readonly string[] AudiencePermission = ["everyone", "followers", "none"];

    public static string Normalize(string value, string name, IReadOnlyCollection<string> allowed)
    {
        var normalized = value.Trim().ToLowerInvariant();
        return allowed.Contains(normalized, StringComparer.Ordinal)
            ? normalized
            : throw new ArgumentException($"{name} is invalid.", name);
    }
}

public sealed class MenuPrivacyPolicy : IMenuPrivacyPolicy
{
    public PrivacyDecision CanViewProfile(string p, bool follower, bool owner) => owner || p.Equals("public", StringComparison.OrdinalIgnoreCase) || (p.Equals("followers", StringComparison.OrdinalIgnoreCase) && follower) ? new(true, "ALLOWED") : new(false, "PROFILE_PRIVATE");
    public PrivacyDecision CanMessage(string p, bool follower, bool owner) => owner || p.Equals("everyone", StringComparison.OrdinalIgnoreCase) || (p.Equals("followers", StringComparison.OrdinalIgnoreCase) && follower) ? new(true, "ALLOWED") : new(false, "MESSAGES_NOT_ALLOWED");
    public PrivacyDecision CanInteract(string p, bool follower, bool owner) => owner || p.Equals("everyone", StringComparison.OrdinalIgnoreCase) || (p.Equals("followers", StringComparison.OrdinalIgnoreCase) && follower) ? new(true, "ALLOWED") : new(false, "INTERACTION_NOT_ALLOWED");
}
