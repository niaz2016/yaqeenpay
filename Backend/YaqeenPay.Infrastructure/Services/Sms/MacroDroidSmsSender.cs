using System;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using YaqeenPay.Application.Common.Interfaces;

namespace YaqeenPay.Infrastructure.Services.Sms
{
    public class MacroDroidSmsSender : ISmsSender
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly Services.MacroDroidOptions _options;
        private readonly ILogger<MacroDroidSmsSender> _logger;
        private readonly IConfiguration _configuration;

        public MacroDroidSmsSender(IHttpClientFactory httpClientFactory, IOptions<Services.MacroDroidOptions> options, ILogger<MacroDroidSmsSender> logger, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _options = options.Value;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task SendOtpAsync(string phoneNumber, string otp, string? template = null, CancellationToken cancellationToken = default)
        {
            // Check if SMS sending is enabled
            var smsEnabled = _configuration["MacroDroid:Enabled"] != "false";
            if (!smsEnabled)
            {
                _logger.LogInformation("SMS sending is disabled. OTP {Otp} would have been sent to {PhoneNumber}", otp, phoneNumber);
                return;
            }

            if (string.IsNullOrWhiteSpace(phoneNumber))
                throw new ArgumentException("Phone number is required", nameof(phoneNumber));
            if (string.IsNullOrWhiteSpace(otp))
                throw new ArgumentException("OTP is required", nameof(otp));

            var normalized = NormalizePakistaniPhone(phoneNumber) ?? throw new InvalidOperationException($"Invalid recipient phone provided: '{phoneNumber}'");

            var url = $"{_options.BaseUrl.TrimEnd('/')}/{_options.Key}/{_options.Action}?{_options.OtpParamName}={Uri.EscapeDataString(otp)}&{_options.ReceiverParamName}={Uri.EscapeDataString(normalized)}";

            var client = _httpClientFactory.CreateClient();
            var resp = await client.GetAsync(url, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync(cancellationToken);
                throw new InvalidOperationException($"MacroDroid trigger failed: {(int)resp.StatusCode} {resp.ReasonPhrase}. Body={body}");
            }

            _logger.LogInformation("SMS sent via MacroDroid to {To} with OTP {Otp} (template={Template})", normalized, otp, template);
        }

        private static string? NormalizePakistaniPhone(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return null;
            var digits = new string(input.Where(char.IsDigit).ToArray());
            if (digits.Length < 9) return null;
            var last9 = digits[^9..];
            return $"923{last9}";
        }
    }
}
