namespace TechTorio.Infrastructure.Services;

public class AndroidSmsOptions
{
    /// <summary>
    /// Base URL of the Android SMS service (e.g., "http://192.168.1.100:8080" or tailscale IP)
    /// </summary>
    public string BaseUrl { get; set; } = "http://localhost:8080";
    
    /// <summary>
    /// Secret key for authentication (must match X-Webhook-Secret header in Android app)
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Whether to use HMAC-SHA256 signature verification (recommended for production)
    /// </summary>
    public bool UseHmac { get; set; } = true;
    
    /// <summary>
    /// Connection timeout in seconds
    /// </summary>
    public int TimeoutSeconds { get; set; } = 10;
    
    /// <summary>
    /// Query parameter name for OTP value
    /// </summary>
    public string OtpParamName { get; set; } = "otp";
    
    /// <summary>
    /// Query parameter name for receiver phone number
    /// </summary>
    public string ReceiverParamName { get; set; } = "receiver";
}
