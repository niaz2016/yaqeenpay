using Microsoft.Extensions.Configuration;
using System.Text;

namespace TechTorio.Application.Features.Wallets.Services
{
    public interface IQrCodeService
    {
        Task<string> GenerateQrImageAsync(string transactionReference, decimal amount, string? baseUrl = null);
        // New: build Raast/EMV payload embedding IBAN + amount + optional expiry (UTC yyyymmddHHMMSS)
    }
    public class QrCodeService : IQrCodeService
    {
        private readonly IConfiguration _configuration;

        public QrCodeService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        ///  0002020102120202000424 PK79HABB0164030042945446 05 03 100   0712 051020251230 1004 DEC3
        ///  0002020102120202000424 PK79HABB0164030042945446 05 03 100   0712 151020251159 1004 CF51	    100	    15102025
        ///  0002020102120202000424 PK79HABB0164030042945446 05 04 9999  0712 151020251159 1004 D815	    9999	15102025
        ///  0002020102120202000424 PK79HABB0164030042945446 05 04 1000  0712 151020251159 1004 24E7	    1000	15102025
        ///  0002020102120202000424 PK79HABB0164030042945446 05 03 500   0712 031120251159 1004 7070	    500	    03112025
        ///  0002020102120202000424 PK79HABB0164030042945446 05 05 10000 0712 151020251159 1004 BAEE	    10000	15102025
        /// </summary>
        /// <param name="transactionReference"></param>
        /// <param name="amount"></param>
        /// <param name="baseUrl"></param>
        /// <returns></returns>

        public Task<string> GenerateQrImageAsync(string transactionReference, decimal amount, string? baseUrl = null)
        {
            DateTime expiry = DateTime.Now.AddMinutes(2);
            string qrString = GenerateQrString(amount, expiry);
            // Here you would generate the QR image using qrString and return its path or base64
            // For now, just return the QR string as a placeholder
            return Task.FromResult(qrString);
        }
        //private const string ACCOUNT_NUMBER = "PK79HABB0164030042945446";
        private const string ACCOUNT_NUMBER = "PK37HABB0014167901035003";

        private const string QR_PREFIX = "0002020102120202000424";

        /// <summary>
        /// Generates a QR code string for bank payment with specified amount and expiry
        /// </summary>
        /// <param name="amount">Payment amount (integer)</param>
        /// <param name="expiryDateTime">Expiry date and time (time should be 11:59)</param>
        /// <returns>QR code string</returns>
        public static string GenerateQrString(decimal amount, DateTime expiryDateTime)
        {
            // Format amount with leading zeros (pad to at least match the pattern)
            string amountStr = amount.ToString();
            int amountLength = amountStr.Length;

            // Build the amount field: 05 + length(2 digits) + amount
            string amountField = $"05{amountLength:D2}{amountStr}";

            // Format expiry dateTime as DDMMYYYYHHMM
            string expiryDateTimeString = expiryDateTime.ToString("ddMMyyyyHHmm");


            // Construct the data string without checksum
            string dataWithoutChecksum = QR_PREFIX + ACCOUNT_NUMBER + amountField +"0712" + expiryDateTimeString + "1004";

            // Calculate checksum (4 hex characters)
            string checksum = CalculateChecksum(dataWithoutChecksum);

            // Complete QR code string
            return dataWithoutChecksum + checksum;
        }

        /// <summary>
        /// Calculates a 4-character hexadecimal checksum for the QR code data
        /// Uses CRC16-CCITT algorithm commonly used in financial QR codes
        /// </summary>
        private static string CalculateChecksum(string data)
        {
            ushort crc = 0xFFFF;
            byte[] bytes = Encoding.ASCII.GetBytes(data);

            foreach (byte b in bytes)
            {
                crc ^= (ushort)(b << 8);
                for (int i = 0; i < 8; i++)
                {
                    if ((crc & 0x8000) != 0)
                    {
                        crc = (ushort)((crc << 1) ^ 0x1021);
                    }
                    else
                    {
                        crc <<= 1;
                    }
                }
            }

            return crc.ToString("X4");
        }
    }

    // Example usage:
    // string qr = HblQrGenerator.GenerateQrString(100, new DateTime(2025, 9, 30, 23, 59, 0));
    // Console.WriteLine(qr);

}
