using System;
using System.Security.Cryptography;
using System.Text;

namespace TechTorio.Infrastructure.Services.JazzCash.Helpers
{
    public static class JazzCashSecureHashHelper
    {
        /// <summary>
        /// Generates secure hash for Jazz Cash API requests
        /// </summary>
        /// <param name="integritySalt">The integrity salt provided by Jazz Cash</param>
        /// <param name="parameters">Concatenated parameters string</param>
        /// <returns>SHA256 hash in uppercase</returns>
        public static string GenerateSecureHash(string integritySalt, string parameters)
        {
            var hashString = integritySalt + "&" + parameters;
            
            using (var sha256 = SHA256.Create())
            {
                var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(hashString));
                return Convert.ToHexString(hashBytes).ToUpperInvariant();
            }
        }

        /// <summary>
        /// Generates secure hash for Direct Pay API
        /// </summary>
        public static string GenerateDirectPayHash(string integritySalt, string amount, string billReference, 
            string description, string language, string merchantId, string password, string returnUrl, 
            string txnCurrency, string txnDateTime, string txnExpiryDateTime, string txnRefNo, 
            string txnType, string version, string customerCardNumber, string customerCardExpiry, 
            string customerCardCvv, string frequency)
        {
            var parameters = $"{amount}&{billReference}&{description}&{language}&{merchantId}&{password}&{returnUrl}&{txnCurrency}&{txnDateTime}&{txnExpiryDateTime}&{txnRefNo}&{txnType}&{version}&{customerCardNumber}&{customerCardExpiry}&{customerCardCvv}&{frequency}";
            
            return GenerateSecureHash(integritySalt, parameters);
        }

        /// <summary>
        /// Generates secure hash for Mobile Account API
        /// </summary>
        public static string GenerateMobileAccountHash(string integritySalt, string amount, string bankId,
            string billReference, string description, string language, string merchantId, string password,
            string productId, string returnUrl, string subMerchantId, string txnCurrency, string txnDateTime,
            string txnExpiryDateTime, string txnRefNo, string txnType, string version,
            string ppmpf1, string ppmpf2, string ppmpf3, string ppmpf4, string ppmpf5)
        {
            var parameters = $"{amount}&{bankId}&{billReference}&{description}&{language}&{merchantId}&{password}&{productId}&{returnUrl}&{subMerchantId}&{txnCurrency}&{txnDateTime}&{txnExpiryDateTime}&{txnRefNo}&{txnType}&{version}&{ppmpf1}&{ppmpf2}&{ppmpf3}&{ppmpf4}&{ppmpf5}";
            
            return GenerateSecureHash(integritySalt, parameters);
        }

        /// <summary>
        /// Generates secure hash for Voucher Payment API
        /// </summary>
        public static string GenerateVoucherHash(string integritySalt, string amount, string bankId,
            string billReference, string description, string language, string merchantId, string password,
            string productId, string returnUrl, string subMerchantId, string txnCurrency, string txnDateTime,
            string txnExpiryDateTime, string txnRefNo, string txnType, string version,
            string ppmpf1, string ppmpf2, string ppmpf3, string ppmpf4, string ppmpf5)
        {
            var parameters = $"{amount}&{bankId}&{billReference}&{description}&{language}&{merchantId}&{password}&{productId}&{returnUrl}&{subMerchantId}&{txnCurrency}&{txnDateTime}&{txnExpiryDateTime}&{txnRefNo}&{txnType}&{version}&{ppmpf1}&{ppmpf2}&{ppmpf3}&{ppmpf4}&{ppmpf5}";
            
            return GenerateSecureHash(integritySalt, parameters);
        }

        /// <summary>
        /// Generates secure hash for Transaction Status Inquiry
        /// </summary>
        public static string GenerateTransactionStatusHash(string integritySalt, string merchantId,
            string password, string txnRefNo, string version)
        {
            var parameters = $"{merchantId}&{password}&{txnRefNo}&{version}";
            
            return GenerateSecureHash(integritySalt, parameters);
        }

        /// <summary>
        /// Generates secure hash for Refund API
        /// </summary>
        public static string GenerateRefundHash(string integritySalt, string amount, string merchantId,
            string password, string txnCurrency, string txnRefNo)
        {
            var parameters = $"{amount}&{merchantId}&{password}&{txnCurrency}&{txnRefNo}";
            
            return GenerateSecureHash(integritySalt, parameters);
        }

        /// <summary>
        /// Generates secure hash for Void API
        /// </summary>
        public static string GenerateVoidHash(string integritySalt, string merchantId, string password, string txnRefNo)
        {
            var parameters = $"{merchantId}&{password}&{txnRefNo}";
            
            return GenerateSecureHash(integritySalt, parameters);
        }

        /// <summary>
        /// Verifies the secure hash from Jazz Cash response
        /// </summary>
        /// <param name="integritySalt">The integrity salt provided by Jazz Cash</param>
        /// <param name="receivedHash">The hash received from Jazz Cash</param>
        /// <param name="responseParameters">The response parameters to verify</param>
        /// <returns>True if hash is valid</returns>
        public static bool VerifyResponseHash(string integritySalt, string receivedHash, string responseParameters)
        {
            var calculatedHash = GenerateSecureHash(integritySalt, responseParameters);
            return string.Equals(calculatedHash, receivedHash, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Generates transaction reference number in Jazz Cash format
        /// </summary>
        /// <returns>Transaction reference number starting with 'T' followed by datetime</returns>
        public static string GenerateTransactionReference()
        {
            return "T" + DateTime.Now.ToString("yyyyMMddHHmmss");
        }

        /// <summary>
        /// Formats datetime for Jazz Cash API
        /// </summary>
        /// <param name="dateTime">The datetime to format</param>
        /// <returns>Formatted datetime string (yyyyMMddHHmmss)</returns>
        public static string FormatDateTime(DateTime dateTime)
        {
            return dateTime.ToString("yyyyMMddHHmmss");
        }

        /// <summary>
        /// Formats amount for Jazz Cash API (removes decimal point and multiplies by 100)
        /// </summary>
        /// <param name="amount">The decimal amount</param>
        /// <returns>Amount in paisa (integer format as string)</returns>
        public static string FormatAmount(decimal amount)
        {
            return ((int)(amount * 100)).ToString();
        }
    }
}