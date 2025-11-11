using System.Threading;
using System.Threading.Tasks;

namespace TechTorio.Application.Common.Interfaces
{
    /// <summary>
    /// Abstraction for pushing messages to connected devices (SignalR, WebSocket, etc.).
    /// Returns true if the message was delivered to an active connection.
    /// </summary>
    public interface IDevicePushService
    {
        /// <summary>
        /// Try to push an OTP to a connected device identified by deviceId.
        /// </summary>
        /// <param name="deviceId">Logical device identifier (agreed contract with client)</param>
        /// <param name="phoneNumber">Target phone number for logging/audit</param>
        /// <param name="otp">One-time code</param>
        /// <param name="template">Optional template/purpose</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>True if push was sent to a connected client, false otherwise.</returns>
        Task<bool> TryPushOtpAsync(string deviceId, string phoneNumber, string otp, string? template = null, CancellationToken cancellationToken = default);
    }
}
