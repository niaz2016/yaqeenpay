using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Infrastructure.Services.Sms
{
    /// <summary>
    /// Composite SMS sender that first attempts to push OTP to a connected device (SignalR)
    /// via <see cref="IDevicePushService"/> and <see cref="IDeviceRegistry"/>. If no device
    /// is connected for the target phone, falls back to the provided HTTP-based Android sender.
    /// </summary>
    public class CompositeSmsSender : ISmsSender
    {
        private readonly IDevicePushService _devicePushService;
        private readonly IDeviceRegistry _deviceRegistry;
        private readonly AndroidSmsSender _androidSender;
        private readonly ILogger<CompositeSmsSender> _logger;

        public CompositeSmsSender(
            IDevicePushService devicePushService,
            IDeviceRegistry deviceRegistry,
            AndroidSmsSender androidSender,
            ILogger<CompositeSmsSender> logger)
        {
            _devicePushService = devicePushService;
            _deviceRegistry = deviceRegistry;
            _androidSender = androidSender;
            _logger = logger;
        }

        public async Task SendOtpAsync(string phoneNumber, string otp, string? template = null, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber)) throw new ArgumentException("phoneNumber is required", nameof(phoneNumber));
            if (string.IsNullOrWhiteSpace(otp)) throw new ArgumentException("otp is required", nameof(otp));

            _logger.LogInformation("CompositeSmsSender: Attempting to send OTP to {Phone}", phoneNumber);

            // Normalize phone number for SMS sending (convert 03XX to 923XX)
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);
            _logger.LogDebug("Normalized phone from {Original} to {Normalized}", phoneNumber, normalizedPhone);

            try
            {
                // Get any available connected device (we don't need a device specific to this phone number)
                // The Android device will send SMS to ANY phone number, not just its own
                var deviceId = await _deviceRegistry.GetAnyConnectedDeviceIdAsync();
                
                if (!string.IsNullOrWhiteSpace(deviceId))
                {
                    // Attempt push via SignalR
                    _logger.LogDebug("Attempting SignalR push to device {DeviceId} to send OTP to {Phone}", deviceId, normalizedPhone);
                    var pushed = await _devicePushService.TryPushOtpAsync(deviceId, normalizedPhone, otp, template, cancellationToken);
                    if (pushed)
                    {
                        _logger.LogInformation("OTP pushed to device {DeviceId} to send to {Phone}", deviceId, normalizedPhone);
                        return;
                    }
                    _logger.LogWarning("Device {DeviceId} was not reachable for push; falling back to Android HTTP sender", deviceId);
                }
                else
                {
                    _logger.LogInformation("No connected devices available; falling back to Android HTTP sender");
                }

                // Fallback: use Android HTTP sender (direct call to phone endpoint)
                _logger.LogDebug("Falling back to Android HTTP SMS sender for {Phone}", phoneNumber);
                await _androidSender.SendOtpAsync(phoneNumber, otp, template, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CompositeSmsSender failed to send OTP to {Phone}. Falling back to Android sender if possible.", phoneNumber);
                // Best-effort fallback to android sender
                try
                {
                    await _androidSender.SendOtpAsync(phoneNumber, otp, template, cancellationToken);
                }
                catch (Exception inner)
                {
                    _logger.LogError(inner, "Fallback Android sender also failed for {Phone}", phoneNumber);
                    throw; // rethrow final failure
                }
            }
        }

        /// <summary>
        /// Normalizes phone number to international format (923XXXXXXXXX).
        /// Converts 03XXXXXXXXX to 923XXXXXXXXX, removes spaces/dashes.
        /// </summary>
        private string NormalizePhoneNumber(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return phone;
            
            // Remove spaces, dashes, parentheses
            var cleaned = phone.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
            
            // If starts with 0, replace with 92
            if (cleaned.StartsWith("0"))
            {
                cleaned = "92" + cleaned.Substring(1);
            }
            
            // If doesn't start with 92, prepend 92
            if (!cleaned.StartsWith("92"))
            {
                cleaned = "92" + cleaned;
            }
            
            return cleaned;
        }
    }
}
