using Mabiz.Application.Services;

namespace Mabiz.UnitTests;

public sealed class BusinessAccessControlTests
{
    [Theory]
    [InlineData("Owner", true, true, true, true, true)]
    [InlineData("Admin", true, true, true, false, false)]
    [InlineData("Editor", true, false, true, false, false)]
    [InlineData("Viewer", true, false, false, false, false)]
    [InlineData("Unknown", false, false, false, false, false)]
    [InlineData(null, false, false, false, false, false)]
    public void RoleMatrix_EnforcesProfileTeamArchiveAndTransferBoundaries(
        string? role, bool canViewPrivate, bool canManageTeam, bool canEdit,
        bool canArchive, bool canTransfer)
    {
        Assert.Equal(canViewPrivate, BusinessAccessControl.Allows(role, BusinessPermission.ViewPrivateProfile));
        Assert.Equal(canManageTeam, BusinessAccessControl.Allows(role, BusinessPermission.ManageTeam));
        Assert.Equal(canEdit, BusinessAccessControl.Allows(role, BusinessPermission.EditProfile));
        Assert.Equal(canArchive, BusinessAccessControl.Allows(role, BusinessPermission.Archive));
        Assert.Equal(canTransfer, BusinessAccessControl.Allows(role, BusinessPermission.TransferOwnership));
    }

    [Theory]
    [InlineData("Owner", true)]
    [InlineData("Admin", true)]
    [InlineData("Editor", true)]
    [InlineData("Viewer", false)]
    [InlineData("Unknown", false)]
    [InlineData(null, false)]
    public void PublishPosts_IsAllowedOnlyForOwnerAdminAndEditor(string? role, bool expected) =>
        Assert.Equal(expected, BusinessAccessControl.Allows(role, BusinessPermission.PublishPosts));

    [Theory]
    [InlineData("Owner", true)]
    [InlineData("Admin", true)]
    [InlineData("Editor", true)]
    [InlineData("Viewer", false)]
    [InlineData("Unknown", false)]
    [InlineData(null, false)]
    public void RespondToEnquiries_IsAllowedOnlyForOwnerAdminAndEditor(string? role, bool expected) =>
        Assert.Equal(expected, BusinessAccessControl.Allows(role, BusinessPermission.RespondToEnquiries));

    [Theory]
    [InlineData("Owner", "Admin", true)]
    [InlineData("Owner", "Editor", true)]
    [InlineData("Owner", "Viewer", true)]
    [InlineData("Owner", "Owner", false)]
    [InlineData("Admin", "Admin", false)]
    [InlineData("Admin", "Editor", true)]
    [InlineData("Admin", "Viewer", true)]
    [InlineData("Editor", "Viewer", false)]
    [InlineData("Viewer", "Editor", false)]
    public void RoleAssignment_CannotEscalateActorOrChangeOwner(string actor, string target, bool expected) =>
        Assert.Equal(expected, BusinessAccessControl.CanAssignRole(actor, target));

    [Theory]
    [InlineData("Owner", "Admin", true)]
    [InlineData("Owner", "Editor", true)]
    [InlineData("Owner", "Viewer", true)]
    [InlineData("Owner", "Owner", false)]
    [InlineData("Admin", "Admin", false)]
    [InlineData("Admin", "Editor", true)]
    [InlineData("Admin", "Viewer", true)]
    [InlineData("Editor", "Viewer", false)]
    public void MemberManagement_RespectsHierarchy(string actor, string target, bool expected) =>
        Assert.Equal(expected, BusinessAccessControl.CanManageMember(actor, target));
}
