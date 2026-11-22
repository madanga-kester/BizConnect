using System;
using Xunit;
using Mabiz.Application.Contracts.MenuContracts;

namespace Mabiz.Menu.Tests;

public sealed class MenuContractTests
{
    [Fact] public void Export_defaults_to_excluding_media() => Assert.False(new RequestAccountExportRequest().IncludeMedia);
    [Fact] public void Deletion_requires_explicit_confirmation() => Assert.Equal("DELETE MY ACCOUNT", new RequestAccountDeletionRequest("DELETE MY ACCOUNT", null).Confirmation);
}
