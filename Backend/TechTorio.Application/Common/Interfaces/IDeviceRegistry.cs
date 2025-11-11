using System.Threading.Tasks;

namespace TechTorio.Application.Common.Interfaces
{
    /// <summary>
    /// Lightweight runtime registry for mapping phone numbers to device identifiers and connection state.
    /// Implementations may be in-memory (for initial POC) or backed by a persistent store.
    /// </summary>
    public interface IDeviceRegistry
    {
        /// <summary>
        /// Register a device id for a phone number (or update). This does not include connection id.
        /// </summary>
        Task RegisterAsync(string deviceId, string phoneNumber);

        /// <summary>
        /// Register a live connection mapping for a device id (called on SignalR connect).
        /// </summary>
        Task RegisterConnectionAsync(string deviceId, string connectionId, string? phoneNumber = null);

        /// <summary>
        /// Unregister a connection id (called on SignalR disconnect).
        /// </summary>
        Task UnregisterConnectionAsync(string connectionId);

        /// <summary>
        /// Unregister a device id (e.g., explicit client remove).
        /// </summary>
        Task UnregisterAsync(string deviceId);

        /// <summary>
        /// Try to find a device id that is associated with the given phone number.
        /// Returns null if none found.
        /// </summary>
        Task<string?> FindDeviceIdByPhoneNumberAsync(string phoneNumber);

        /// <summary>
        /// Try to find the active SignalR connection id for a device id. Returns null if not connected.
        /// </summary>
        Task<string?> FindConnectionIdByDeviceIdAsync(string deviceId);

        /// <summary>
        /// Get any available connected device ID. Returns null if no devices are connected.
        /// Useful for sending SMS through any available gateway device.
        /// </summary>
        Task<string?> GetAnyConnectedDeviceIdAsync();
    }
}
