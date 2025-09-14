using System.Text.Json;
using System.Threading.Tasks;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Services
{
    public class OutboxService : IOutboxService
    {
        private readonly IApplicationDbContext _dbContext;
        public OutboxService(IApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task EnqueueAsync(string type, object payload, CancellationToken cancellationToken = default)
        {
            var message = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                OccurredOn = DateTime.UtcNow,
                Type = type,
                Payload = JsonSerializer.Serialize(payload),
                Processed = false
            };
            _dbContext.OutboxMessages.Add(message);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}