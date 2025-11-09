using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Infrastructure.Services;

public class GoogleRecaptchaService : ICaptchaService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleRecaptchaService> _logger;
    private readonly string _secretKey;
    private readonly double _minScore;

    public GoogleRecaptchaService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GoogleRecaptchaService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _secretKey = configuration["Captcha:SecretKey"] ?? "";
        _minScore = double.Parse(configuration["Captcha:MinScore"] ?? "0.5");
    }

    public async Task<bool> ValidateCaptchaAsync(string token, string? ipAddress = null)
    {
        if (string.IsNullOrEmpty(_secretKey))
        {
            _logger.LogWarning("CAPTCHA secret key not configured. Skipping validation.");
            return true; // Allow in development/testing
        }

        if (string.IsNullOrEmpty(token))
        {
            return false;
        }

        try
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "secret", _secretKey },
                { "response", token },
                { "remoteip", ipAddress ?? "" }
            });

            var response = await _httpClient.PostAsync("https://www.google.com/recaptcha/api/siteverify", content);
            var jsonResponse = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<RecaptchaResponse>(jsonResponse);

            if (result == null)
            {
                _logger.LogError("Failed to deserialize CAPTCHA response");
                return false;
            }

            // For reCAPTCHA v3, also check score
            if (result.Score.HasValue && result.Score.Value < _minScore)
            {
                _logger.LogWarning("CAPTCHA score too low: {Score}", result.Score.Value);
                return false;
            }

            return result.Success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating CAPTCHA");
            return false;
        }
    }

    public async Task<double> GetCaptchaScoreAsync(string token)
    {
        if (string.IsNullOrEmpty(_secretKey) || string.IsNullOrEmpty(token))
        {
            return 0.0;
        }

        try
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "secret", _secretKey },
                { "response", token }
            });

            var response = await _httpClient.PostAsync("https://www.google.com/recaptcha/api/siteverify", content);
            var jsonResponse = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<RecaptchaResponse>(jsonResponse);

            return result?.Score ?? 0.0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting CAPTCHA score");
            return 0.0;
        }
    }

    private class RecaptchaResponse
    {
        public bool Success { get; set; }
        public double? Score { get; set; }
        public string[] ErrorCodes { get; set; } = Array.Empty<string>();
    }
}
