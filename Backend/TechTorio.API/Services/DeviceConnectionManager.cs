using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.API.Services
{
    /// <summary>
    /// In-memory device connection manager. Maps phone numbers <-> device ids and device ids <-> SignalR connection ids.
    /// This is intentionally lightweight and in-memory for now (POC). For production, back with a persistent store.
    /// </summary>
    public class DeviceConnectionManager : IDeviceRegistry
    {
        // deviceId -> connectionId
        private readonly ConcurrentDictionary<string, string> _deviceToConnection = new();
        // connectionId -> deviceId
        private readonly ConcurrentDictionary<string, string> _connectionToDevice = new();
        // phoneNumber -> deviceId
        private readonly ConcurrentDictionary<string, string> _phoneToDevice = new();
        private readonly ILogger<DeviceConnectionManager> _logger;

        public DeviceConnectionManager(ILogger<DeviceConnectionManager> logger)
        {
            _logger = logger;
        }

        public Task RegisterAsync(string deviceId, string phoneNumber)
        {
            if (!string.IsNullOrWhiteSpace(phoneNumber) && !string.IsNullOrWhiteSpace(deviceId))
            {
                var normalized = NormalizePhoneNumber(phoneNumber);
                _phoneToDevice.AddOrUpdate(normalized, deviceId, (_, __) => deviceId);
                _logger.LogInformation("Device registered: DeviceId={DeviceId}, Phone={Phone}, Normalized={Normalized}. Total devices: {Count}", 
                    deviceId, phoneNumber, normalized, _phoneToDevice.Count);
            }
            else
            {
                _logger.LogWarning("Skipped registration - DeviceId or Phone is empty. DeviceId={DeviceId}, Phone={Phone}", 
                    deviceId ?? "null", phoneNumber ?? "null");
            }
            return Task.CompletedTask;
        }

        public Task RegisterConnectionAsync(string deviceId, string connectionId, string? phoneNumber = null)
        {
            if (string.IsNullOrWhiteSpace(deviceId) || string.IsNullOrWhiteSpace(connectionId))
                return Task.CompletedTask;

            _deviceToConnection.AddOrUpdate(deviceId, connectionId, (_, __) => connectionId);
            _connectionToDevice.AddOrUpdate(connectionId, deviceId, (_, __) => deviceId);
            if (!string.IsNullOrWhiteSpace(phoneNumber))
            {
                var normalized = NormalizePhoneNumber(phoneNumber);
                _phoneToDevice.AddOrUpdate(normalized, deviceId, (_, __) => deviceId);
            }
            return Task.CompletedTask;
        }

        public Task UnregisterConnectionAsync(string connectionId)
        {
            if (string.IsNullOrWhiteSpace(connectionId)) return Task.CompletedTask;

            if (_connectionToDevice.TryRemove(connectionId, out var deviceId))
            {
                _deviceToConnection.TryRemove(deviceId, out _);
            }
            return Task.CompletedTask;
        }

        public Task UnregisterAsync(string deviceId)
        {
            if (string.IsNullOrWhiteSpace(deviceId)) return Task.CompletedTask;
            _deviceToConnection.TryRemove(deviceId, out var conn);
            if (!string.IsNullOrWhiteSpace(conn))
            {
                _connectionToDevice.TryRemove(conn, out _);
            }

            // Remove any phone mappings that pointed to this device
            foreach (var kv in _phoneToDevice)
            {
                if (kv.Value == deviceId)
                {
                    _phoneToDevice.TryRemove(kv.Key, out _);
                }
            }

            return Task.CompletedTask;
        }

        public Task<string?> FindDeviceIdByPhoneNumberAsync(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber)) return Task.FromResult<string?>(null);
            var normalized = NormalizePhoneNumber(phoneNumber);
            var found = _phoneToDevice.TryGetValue(normalized, out var d);
            
            _logger.LogInformation("FindDeviceIdByPhoneNumber - Phone: {Phone}, Normalized: {Normalized}, Found: {Found}, DeviceId: {DeviceId}. Registry size: {Count}", 
                phoneNumber, normalized, found, d ?? "null", _phoneToDevice.Count);
            
            if (!found)
            {
                _logger.LogWarning("Available devices in registry: {Devices}", 
                    string.Join(", ", _phoneToDevice.Select(kv => $"{kv.Key}=>{kv.Value}")));
            }
            
            return Task.FromResult(found ? d : null);
        }

        private string NormalizePhoneNumber(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return phone ?? string.Empty;
            // Keep only digits and leading plus
            var cleaned = System.Text.RegularExpressions.Regex.Replace(phone, "[^0-9+]", "");
            // Remove leading plus if present
            if (cleaned.StartsWith("+")) cleaned = cleaned.Substring(1);
            // If starts with 0, replace with 92
            if (cleaned.StartsWith("0")) cleaned = "92" + cleaned.Substring(1);
            // If already starts with 92, keep
            if (!cleaned.StartsWith("92")) cleaned = "92" + cleaned;
            return cleaned;
        }

        public Task<string?> FindConnectionIdByDeviceIdAsync(string deviceId)
        {
            if (string.IsNullOrWhiteSpace(deviceId)) return Task.FromResult<string?>(null);
            return Task.FromResult(_deviceToConnection.TryGetValue(deviceId, out var c) ? c : null);
        }

        public Task<string?> GetAnyConnectedDeviceIdAsync()
        {
            // Return the first device that has an active connection
            var connectedDevice = _deviceToConnection.FirstOrDefault();
            if (connectedDevice.Key != null)
            {
                _logger.LogInformation("GetAnyConnectedDevice - Found: {DeviceId}", connectedDevice.Key);
                return Task.FromResult<string?>(connectedDevice.Key);
            }
            
            _logger.LogWarning("GetAnyConnectedDevice - No devices connected. Total devices: {Count}", _deviceToConnection.Count);
            return Task.FromResult<string?>(null);
        }
    }
}
