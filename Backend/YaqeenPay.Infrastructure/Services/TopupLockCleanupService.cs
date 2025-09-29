using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Features.Wallets.Services;

namespace YaqeenPay.Infrastructure.Services
{
    public class TopupLockCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TopupLockCleanupService> _logger;

        public TopupLockCleanupService(IServiceProvider serviceProvider, ILogger<TopupLockCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Topup lock cleanup service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var walletTopupService = scope.ServiceProvider.GetRequiredService<IWalletTopupService>();
                    
                    await walletTopupService.CleanupExpiredLocksAsync();
                    
                    // Run every 5 minutes
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in topup lock cleanup service");
                    // Wait 1 minute before retrying
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }
        }

        public override Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Topup lock cleanup service is stopping");
            return base.StopAsync(stoppingToken);
        }
    }
}