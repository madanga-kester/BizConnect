using System;
using System.Threading;
using System.Threading.Tasks;
using Mabiz.Domain.Menu;

namespace Mabiz.Application.Interfaces;

public interface IContentAccessValidator
{
    Task<bool> ExistsAndAccessibleAsync(Guid actorUserId, Guid contentId, SavedContentKind kind, CancellationToken ct);
}
