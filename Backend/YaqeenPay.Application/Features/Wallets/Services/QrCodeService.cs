using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;

namespace YaqeenPay.Application.Features.Wallets.Services
{
    public interface IQrCodeService
    {
        Task<string> GenerateQrImageAsync(string transactionReference, decimal amount, string? baseUrl = null);
        // New: build Raast/EMV payload embedding IBAN + amount + optional expiry (UTC yyyymmddHHMMSS)
    }
    // EMVCo QR build notes
    // - 63(CRC) must be 6304 and computed over the payload including the literal "6304" before appending the CRC value.
    // - Standard tags used: 00,01,26(Merchant Account Info), 52,53,54,58,59,60,63
    // - Amount goes in tag 54; currency (PKR) in tag 53 = 586; country 58 = PK
    public class QrCodeService : IQrCodeService
    {
        private readonly IConfiguration _configuration;

        public QrCodeService(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        // Default Raast values (can be overridden via configuration)
        private const string DefaultRaastGui = ""; // Merchant Account Info - GUI (alphanumeric)
        private const string DefaultIban = ""; // Fallback IBAN if not configured (alphanumeric)
        private const string DefaultRaastAlias = ""; // Numeric alias (e.g., phone) for numeric-only mode
        private const string DefaultMerchantName = "";
        private const string DefaultMerchantCity = "";

        public Task<string> GenerateQrImageAsync(string transactionReference, decimal amount, string? baseUrl = null)
        {
            // Example: Generate QR string for the given amount
            DateTime expiry = new(2025, 9, 30, 23, 59, 0);

            string qrString = GenerateQrString(amount, expiry);
            // Here you would generate the QR image using qrString and return its path or base64
            // For now, just return the QR string as a placeholder
            return Task.FromResult(qrString);
        }
        private const string BasePrefix = "0002020102120202000424PK37HABB0014167901035003";

        public static string GenerateQrString(decimal amount, DateTime expiry)
        {
            // Amount section
            string amountStr = ((int)amount).ToString();
            string length = amountStr.Length.ToString();
            string amountSection = $"3050{length}{amountStr}07";

            // Expiry section (ddMMyyyyHHmm)
            string expiryStr = expiry.ToString("ddMMyyyyHHmm");
            string expirySection = $"1230{expiryStr}";

            // Build without checksum
            string raw = BasePrefix + amountSection + expirySection + "1004";

            // Calculate CRC16
            string checksum = ComputeCrc16(raw);

            // Final QR string
            return raw + checksum;
        }

        private static string ComputeCrc16(string input)
        {
            // CRC16-CCITT (0x1021 polynomial, 0xFFFF init)
            ushort crc = 0xFFFF;
            byte[] data = Encoding.ASCII.GetBytes(input);

            foreach (byte b in data)
            {
                crc ^= (ushort)(b << 8);
                for (int i = 0; i < 8; i++)
                {
                    if ((crc & 0x8000) != 0)
                        crc = (ushort)((crc << 1) ^ 0x1021);
                    else
                        crc <<= 1;
                }
            }
            return crc.ToString("X4");
        }
    }

    // Example usage:
    // string qr = HblQrGenerator.GenerateQrString(100, new DateTime(2025, 9, 30, 23, 59, 0));
    // Console.WriteLine(qr);

}
