using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Common.Interfaces;

public interface IGoogleAuthService
{
    /// <summary>
    /// Validates a Google ID token and returns the associated user information when valid.
    /// </summary>
    /// <param name="idToken">The Google identity token returned from the client SDK.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Normalized Google user info when the token is valid; otherwise <c>null</c>.</returns>
    Task<GoogleUserInfo?> ValidateIdTokenAsync(string idToken, CancellationToken cancellationToken = default);
}
