using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.API.Hubs
{
    /// <summary>
    /// SignalR hub through which devices maintain a persistent connection. Devices should call
    /// RegisterDevice after connecting to associate their logical device id and phone number.
    /// </summary>
    public class DeviceHub : Hub
    {
        private readonly IDeviceRegistry _deviceRegistry;
        private readonly ILogger<DeviceHub> _logger;

        public DeviceHub(IDeviceRegistry deviceRegistry, ILogger<DeviceHub> logger)
        {
            _deviceRegistry = deviceRegistry;
            _logger = logger;
        }

        /// <summary>
        /// Client calls this to associate the current connection with a logical device id and phone number.
        /// </summary>
        public async Task RegisterDevice(string deviceId, string phoneNumber)
        {
            _logger.LogInformation("DeviceHub.RegisterDevice called - DeviceId: {DeviceId}, Phone: {Phone}, ConnectionId: {ConnectionId}", 
                deviceId, phoneNumber, Context.ConnectionId);
            
            // Store both logical device <-> phone mapping and connection mapping
            await _deviceRegistry.RegisterAsync(deviceId, phoneNumber);
            await _deviceRegistry.RegisterConnectionAsync(deviceId, Context.ConnectionId, phoneNumber);
            
            _logger.LogInformation("Device registered successfully - DeviceId: {DeviceId}, Phone: {Phone}", deviceId, phoneNumber);
        }

        public override async Task OnDisconnectedAsync(System.Exception? exception)
        {
            // Remove the connection mapping. The registry will clear device->connection.
            await _deviceRegistry.UnregisterConnectionAsync(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
}
