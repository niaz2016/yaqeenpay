using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TechTorio.Application.Features.Wallets.Services;

namespace TechTorio.Infrastructure.Services
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
                    // Run every 5 minutes (+ a small random jitter to avoid thundering herd if multiple instances)
                    var delay = TimeSpan.FromMinutes(5) + TimeSpan.FromSeconds(Random.Shared.Next(0, 10));
                    await Task.Delay(delay, stoppingToken);
                }
                catch (TaskCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    // Expected during shutdown; log at debug to avoid noise.
                    _logger.LogDebug("Topup lock cleanup service cancellation requested.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in topup lock cleanup service");
                    // Wait 1 minute before retrying
                    try
                    {
                        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                    }
                    catch (TaskCanceledException) { /* ignore on shutdown */ }
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