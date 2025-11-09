namespace TechTorio.Application.Common.Models;

public class GoogleAuthSettings
{
    /// <summary>
    /// List of allowed Google OAuth client IDs (audiences) that can authenticate against this backend.
    /// </summary>
    public List<string> ClientIds { get; set; } = new();

    /// <summary>
    /// Optional allow list of hosted domains (G Suite). Leave empty to allow any domain.
    /// </summary>
    public List<string> HostedDomains { get; set; } = new();

    /// <summary>
    /// Enforce that requests originate from Google Chrome based on User-Agent sniffing.
    /// </summary>
    public bool RequireChrome { get; set; } = true;
}
