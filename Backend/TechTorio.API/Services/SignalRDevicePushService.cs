using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TechTorio.API.Hubs;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.API.Services
{
    /// <summary>
    /// Pushes OTPs to connected devices over SignalR.
    /// </summary>
    public class SignalRDevicePushService : IDevicePushService
    {
        private readonly IHubContext<DeviceHub> _hubContext;
        private readonly IDeviceRegistry _deviceRegistry;
        private readonly ILogger<SignalRDevicePushService> _logger;

        public SignalRDevicePushService(IHubContext<DeviceHub> hubContext, IDeviceRegistry deviceRegistry, ILogger<SignalRDevicePushService> logger)
        {
            _hubContext = hubContext;
            _deviceRegistry = deviceRegistry;
            _logger = logger;
        }

        public async Task<bool> TryPushOtpAsync(string deviceId, string phoneNumber, string otp, string? template = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var connectionId = await _deviceRegistry.FindConnectionIdByDeviceIdAsync(deviceId);
                if (string.IsNullOrWhiteSpace(connectionId))
                {
                    _logger.LogDebug("No active connection for device {DeviceId}", deviceId);
                    return false;
                }

                var payload = new { phone = phoneNumber, otp, template };

                await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveOtp", payload, cancellationToken);
                _logger.LogInformation("Sent OTP to device {DeviceId} (connection {Conn})", deviceId, connectionId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to push OTP to device {DeviceId}", deviceId);
                return false;
            }
        }
    }
}
