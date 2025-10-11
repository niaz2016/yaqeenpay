using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Globalization;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Wallets.Services
{
    public interface IBankSmsProcessingService
    {
        Task<(bool success, string message)> ProcessIncomingSmsAsync(string smsText, string? secret, Guid? userId = null);
    }

    public class BankSmsProcessingService : IBankSmsProcessingService
    {
        private readonly IApplicationDbContext _db;
        private readonly ILogger<BankSmsProcessingService> _logger;
        private readonly IConfiguration _config;

        public BankSmsProcessingService(IApplicationDbContext db, ILogger<BankSmsProcessingService> logger, IConfiguration config)
        {
            _db = db; _logger = logger; _config = config;
        }

        public async Task<(bool success, string message)> ProcessIncomingSmsAsync(string smsText, string? secret, Guid? userId = null)
        {
            // Validate secret (simple shared secret header)
            var expected = (_config["BankSms:Secret"] ?? string.Empty).Trim();
            var provided = (secret ?? string.Empty).Trim();
            if (!string.IsNullOrEmpty(expected) && !string.Equals(expected, provided, StringComparison.Ordinal))
            {
                return (false, "Unauthorized: invalid secret");
            }

            var record = new BankSmsPayment { RawText = smsText };
            try
            {
                // Idempotency: if an already processed SMS with same TransactionId appears, skip
                // We'll populate record.TransactionId below and re-check before crediting.

                // COMPLETELY FIXED amount parsing - much simpler and more robust pattern
                // This will match: PKR 1150.00, PKR 1,150.50, Rs. 500, etc.
                var amtMatch = Regex.Match(smsText, @"(?i)(PKR|Rs\.?)\s+([0-9,]+(?:\.[0-9]{1,2})?)");
                if (amtMatch.Success)
                {
                    var amtStr = amtMatch.Groups[2].Value.Replace(",", "");
                    _logger.LogInformation("Raw amount string captured: '{AmountString}'", amtMatch.Groups[2].Value);
                    
                    if (decimal.TryParse(amtStr, NumberStyles.Number, CultureInfo.InvariantCulture, out var amt))
                    {
                        record.Amount = amt;
                        _logger.LogInformation("Successfully parsed amount: {Amount} from string: '{AmountString}'", amt, amtMatch.Groups[2].Value);
                    }
                    else
                    {
                        _logger.LogWarning("Failed to parse amount from string: '{AmountString}'", amtMatch.Groups[2].Value);
                    }
                    record.Currency = "PKR";
                }
                else
                {
                    _logger.LogWarning("No amount pattern matched in SMS: {SMS}", smsText);
                }

                // Extract transaction/reference ID: e.g., "Txn ID ABC12345" or "Ref# WTU2025..."
                var txMatch = Regex.Match(smsText, @"(?i)(Txn\s*ID|Transaction\s*ID|Ref(?:erence)?\s*#?|Reference|RRN)[\s:\-]*([A-Z0-9\-]{6,})");
                if (txMatch.Success) record.TransactionId = txMatch.Groups[2].Value.Trim();

                // Extract datetime if present in formats like 27/09/2025 14:33[:56] or 2025-09-27 14:33[:56]
                var dtMatch = Regex.Match(smsText, @"(?:(\d{2}/\d{2}/\d{4})|(\d{4}-\d{2}-\d{2}))[ T]?(\d{2}:\d{2})(?::\d{2})?");
                if (dtMatch.Success)
                {
                    // Try exact formats to avoid culture ambiguity
                    var raw = dtMatch.Value;
                    string[] fmts = new[] { "dd/MM/yyyy HH:mm:ss", "dd/MM/yyyy HH:mm", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm" };
                    if (DateTime.TryParseExact(raw, fmts, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dtExact))
                    {
                        record.PaidAt = dtExact.ToUniversalTime();
                    }
                    else if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dt))
                    {
                        record.PaidAt = dt.ToUniversalTime();
                    }
                }

                // Sender name/number (heuristic): e.g., "from Ali Khan" or short code sender
                // Sender (generic): after "from " capture until common delimiters
                var senderMatch = Regex.Match(smsText, @"(?i)from\s+([A-Za-z][^\.,\n]*?)(?:\s+A/C\b|\s+via\b|\s+on\b|,|\.|$)");
                if (senderMatch.Success) record.SenderName = senderMatch.Groups[1].Value.Trim();

                // Try phone pattern
                var phone = Regex.Match(smsText, @"(\+?92|0)?3\d{2}-?\d{7}");
                if (phone.Success) record.SenderPhone = phone.Value;

                // HBL/Raast specific tuning
                // Example: "MUHAMMAD NIAZ, PKR 428.00 received from Munazza Kosar A/C via Raast on 27/09/2025 13:05:56, TXN ID SM53bf63a30e9310. UAN:021111111425."
                // TXN ID
                var hblTxn = Regex.Match(smsText, @"(?i)TXN\s*ID\s*([A-Za-z0-9]+)");
                if (hblTxn.Success) record.TransactionId = hblTxn.Groups[1].Value.Trim();

                // Date/Time after 'on '
                var hblDt = Regex.Match(smsText, @"(?i)\bon\s*(\d{2}/\d{2}/\d{4})\s*(\d{2}:\d{2}:\d{2})");
                if (hblDt.Success)
                {
                    var raw = hblDt.Groups[1].Value + " " + hblDt.Groups[2].Value;
                    if (DateTime.TryParseExact(raw, "dd/MM/yyyy HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dtHbl))
                    {
                        record.PaidAt = dtHbl.ToUniversalTime();
                    }
                }

                // Sender after 'received from '
                var hblSender = Regex.Match(smsText, @"(?i)received\s+from\s+(.+?)(?:\s+A/C\b|\s+via\b|\s+on\b|,|\.|$)");
                if (hblSender.Success) record.SenderName = hblSender.Groups[1].Value.Trim();

                // Log the parsed values for debugging
                _logger.LogInformation("SMS parsing result - Amount: {Amount}, TransactionId: {TransactionId}, Sender: {Sender}", 
                    record.Amount, record.TransactionId, record.SenderName);

                // Save raw record first
                _db.BankSmsPayments.Add(record);
                await _db.SaveChangesAsync(CancellationToken.None);

                // Idempotency check after we have TransactionId parsed
                if (!string.IsNullOrWhiteSpace(record.TransactionId))
                {
                    var exists = await _db.BankSmsPayments.AnyAsync(p => p.Processed && p.TransactionId == record.TransactionId);
                    if (exists)
                    {
                        record.Processed = true; // already applied earlier
                        record.ProcessingResult = "Duplicate transaction id; already processed";
                        await _db.SaveChangesAsync(CancellationToken.None);
                        return (true, record.ProcessingResult);
                    }
                }

                // Try to match an active WalletTopupLock by exact amount and recent lock
                var lockQuery = _db.WalletTopupLocks
                    .Where(l => l.Status == TopupLockStatus.Locked && l.ExpiresAt > DateTime.UtcNow);

                if (record.Amount > 0)
                    lockQuery = lockQuery.Where(l => l.Amount.Amount == record.Amount);

                // If TransactionId seems to contain our reference (WTU...), use it
                if (!string.IsNullOrWhiteSpace(record.TransactionId))
                {
                    var refCandidate = Regex.Match(record.TransactionId, @"WTU\d+").Value;
                    if (!string.IsNullOrEmpty(refCandidate))
                    {
                        lockQuery = lockQuery.Where(l => l.TransactionReference == refCandidate);
                    }
                }

                var topupLock = await lockQuery.OrderByDescending(l => l.LockedAt).FirstOrDefaultAsync();
                if (topupLock == null)
                {
                    record.Processed = false;
                    record.ProcessingResult = "No matching active lock found";
                    await _db.SaveChangesAsync(CancellationToken.None);
                    return (false, record.ProcessingResult);
                }

                // Credit wallet and complete lock (reuse logic similar to VerifyAndCompleteTopupAsync)
                if (topupLock.IsExpired())
                {
                    topupLock.MarkAsExpired();
                    record.Processed = false;
                    record.ProcessingResult = "Lock expired";
                    await _db.SaveChangesAsync(CancellationToken.None);
                    return (false, record.ProcessingResult);
                }

                if (record.Amount != topupLock.Amount.Amount)
                {
                    record.Processed = false;
                    record.ProcessingResult = $"Amount mismatch: SMS amount {record.Amount} vs Lock amount {topupLock.Amount.Amount}";
                    await _db.SaveChangesAsync(CancellationToken.None);
                    return (false, record.ProcessingResult);
                }

                var wallet = await _db.Wallets.FirstOrDefaultAsync(x => x.UserId == topupLock.UserId);
                if (wallet == null)
                {
                    wallet = Wallet.Create(topupLock.UserId, topupLock.Amount.Currency);
                    _db.Wallets.Add(wallet);
                }

                wallet.Credit(new Money(record.Amount, topupLock.Amount.Currency), $"{record.TransactionId ?? topupLock.TransactionReference}");
                topupLock.MarkAsCompleted();

                // Mark sms processed and store relations
                record.Processed = true;
                record.WalletTopupLockId = topupLock.Id;
                record.UserId = topupLock.UserId;
                record.WalletId = wallet.Id;
                record.ProcessingResult = "Wallet credited";

                await _db.SaveChangesAsync(CancellationToken.None);
                return (true, record.ProcessingResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing bank SMS");
                record.Processed = false;
                record.ProcessingResult = $"Error: {ex.Message}";
                try { await _db.SaveChangesAsync(CancellationToken.None); } catch { /* ignore */ }
                return (false, record.ProcessingResult);
            }
        }
    }
}
