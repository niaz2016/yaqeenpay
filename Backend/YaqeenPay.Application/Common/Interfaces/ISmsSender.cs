using System.Threading;
using System.Threading.Tasks;

namespace YaqeenPay.Application.Common.Interfaces
{
    public interface ISmsSender
    {
        /// <summary>
        /// Sends an OTP SMS to the given phone number.
        /// Implementations may normalize the phone into provider-specific format.
        /// </summary>
        /// <param name="phoneNumber">Raw phone number as stored.</param>
        /// <param name="otp">The numeric one-time code to send.</param>
        /// <param name="template">Optional template or purpose code.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        Task SendOtpAsync(string phoneNumber, string otp, string? template = null, CancellationToken cancellationToken = default);
    }
}
