namespace TechTorio.Application.Common.Interfaces;

/// <summary>
/// Service for validating CAPTCHA tokens
/// </summary>
public interface ICaptchaService
{
    /// <summary>
    /// Validates a CAPTCHA token (Google reCAPTCHA, hCaptcha, etc.)
    /// </summary>
    /// <param name="token">The CAPTCHA token from the client</param>
    /// <param name="ipAddress">Client IP address for additional validation</param>
    /// <returns>True if CAPTCHA is valid, false otherwise</returns>
    Task<bool> ValidateCaptchaAsync(string token, string? ipAddress = null);
    
    /// <summary>
    /// Gets the CAPTCHA score (for reCAPTCHA v3)
    /// </summary>
    /// <param name="token">The CAPTCHA token</param>
    /// <returns>Score between 0.0 and 1.0</returns>
    Task<double> GetCaptchaScoreAsync(string token);
}
