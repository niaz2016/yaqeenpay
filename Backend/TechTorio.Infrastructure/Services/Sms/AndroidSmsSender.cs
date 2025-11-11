using System;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Infrastructure.Services.Sms
{
    /// <summary>
    /// SMS sender implementation that sends OTP via Android app HTTP endpoint
    /// </summary>
    public class AndroidSmsSender : ISmsSender
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly AndroidSmsOptions _options;
        private readonly ILogger<AndroidSmsSender> _logger;

        public AndroidSmsSender(
            IHttpClientFactory httpClientFactory, 
            IOptions<AndroidSmsOptions> options, 
            ILogger<AndroidSmsSender> logger)
        {
            _httpClientFactory = httpClientFactory;
            _options = options.Value;
            _logger = logger;
        }

        public async Task SendOtpAsync(string phoneNumber, string otp, string? template = null, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                throw new ArgumentException("Phone number is required", nameof(phoneNumber));
            if (string.IsNullOrWhiteSpace(otp))
                throw new ArgumentException("OTP is required", nameof(otp));

            // Normalize Pakistani phone number (923XXXXXXXXX format)
            var normalized = NormalizePakistaniPhone(phoneNumber) 
                ?? throw new InvalidOperationException($"Invalid recipient phone provided: '{phoneNumber}'");

            // Build the request URL
            var baseUrl = _options.BaseUrl.TrimEnd('/');
            var url = $"{baseUrl}/send-otp?{_options.OtpParamName}={Uri.EscapeDataString(otp)}&{_options.ReceiverParamName}={Uri.EscapeDataString(normalized)}";

            // Create HTTP client with timeout
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);

            // Create request
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            
            // Add secret key header for authentication
            if (!string.IsNullOrWhiteSpace(_options.SecretKey))
            {
                request.Headers.Add("X-Webhook-Secret", _options.SecretKey);
            }

            // Add HMAC signature if enabled
            if (_options.UseHmac && !string.IsNullOrWhiteSpace(_options.SecretKey))
            {
                var canonical = $"otp={otp}&to={normalized}";
                var signature = ComputeHmacSha256(canonical, _options.SecretKey);
                request.Headers.Add("X-Signature", signature);
            }

            try
            {
                _logger.LogDebug("Sending SMS to {PhoneNumber} via Android app at {Url}", normalized, baseUrl);
                
                var response = await client.SendAsync(request, cancellationToken);
                
                if (!response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError("Android SMS service failed: {StatusCode} {Reason}. Body={Body}", 
                        (int)response.StatusCode, response.ReasonPhrase, body);
                    throw new InvalidOperationException(
                        $"Android SMS service failed: {(int)response.StatusCode} {response.ReasonPhrase}. Body={body}");
                }

                _logger.LogInformation("SMS sent successfully via Android app to {PhoneNumber} with OTP {Otp}", 
                    normalized, otp);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to connect to Android SMS service at {BaseUrl}", baseUrl);
                throw new InvalidOperationException(
                    $"Failed to connect to Android SMS service at {baseUrl}. Ensure the Android app is running and accessible.", ex);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Android SMS service request timed out after {Timeout} seconds", _options.TimeoutSeconds);
                throw new InvalidOperationException(
                    $"Android SMS service request timed out after {_options.TimeoutSeconds} seconds.", ex);
            }
        }

        /// <summary>
        /// Normalizes a Pakistani phone number to 923XXXXXXXXX format
        /// </summary>
        private static string? NormalizePakistaniPhone(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) 
                return null;
            
            // Extract only digits
            var digits = new string(input.Where(char.IsDigit).ToArray());
            
            // Need at least 10 digits (3XX XXXXXXX)
            if (digits.Length < 10) 
                return null;
            
            // Take last 10 digits and prepend with 92
            var last10 = digits[^10..];
            
            // If starts with 0, take last 9 digits
            if (last10.StartsWith("0"))
            {
                return $"92{last10[1..]}";
            }
            
            // If already starts with 92, return as is
            if (digits.StartsWith("92") && digits.Length >= 12)
            {
                return digits[..12]; // 92 + 10 digits
            }
            
            // Otherwise, assume it's 3XX XXXXXXX format
            return $"92{last10}";
        }

        /// <summary>
        /// Computes HMAC-SHA256 signature for the given data
        /// </summary>
        private static string ComputeHmacSha256(string data, string secret)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }
    }
}
