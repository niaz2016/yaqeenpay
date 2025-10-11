using System.Threading;
using System.Threading.Tasks;

namespace YaqeenPay.Application.Common.Interfaces
{
    public interface IOutboxService
    {
    Task EnqueueAsync(string type, object payload, CancellationToken cancellationToken = default);
    }
}