using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using YaqeenPay.Application.Interfaces;
using YaqeenPay.Infrastructure.Services.JazzCash.DTOs;
using YaqeenPay.Infrastructure.Services.JazzCash.Helpers;

namespace YaqeenPay.Infrastructure.Services.JazzCash
{
    public class JazzCashSettings
    {
        public string MerchantId { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string IntegritySalt { get; set; } = string.Empty;
        public string ApiBaseUrl { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
        public string Language { get; set; } = "EN";
        public string Currency { get; set; } = "PKR";
        public int TransactionExpiryHours { get; set; } = 48;
        public bool IsSandbox { get; set; } = true;
    }

    public class JazzCashPaymentService : IPaymentGatewayService
    {
        private readonly JazzCashSettings _settings;
        private readonly ILogger<JazzCashPaymentService> _logger;
        private readonly HttpClient _httpClient;

        public JazzCashPaymentService(
            IOptions<JazzCashSettings> options,
            ILogger<JazzCashPaymentService> logger,
            HttpClient httpClient)
        {
            _settings = options.Value;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<string> CreatePaymentRequestAsync(decimal amount, string customerId, string callbackUrl)
        {
            try
            {
                // Generate transaction reference
                var txnRefNo = JazzCashSecureHashHelper.GenerateTransactionReference();
                var txnDateTime = JazzCashSecureHashHelper.FormatDateTime(DateTime.Now);
                var txnExpiryDateTime = JazzCashSecureHashHelper.FormatDateTime(DateTime.Now.AddHours(_settings.TransactionExpiryHours));
                var formattedAmount = JazzCashSecureHashHelper.FormatAmount(amount);

                // Create mobile account payment request (most common for Pakistani market)
                var request = new JazzCashMobileAccountRequestDto
                {
                    pp_Version = "1.1",
                    pp_TxnType = "MWALLET",
                    pp_Language = _settings.Language,
                    pp_MerchantID = _settings.MerchantId,
                    pp_SubMerchantID = "",
                    pp_Password = _settings.Password,
                    pp_BankID = "",
                    pp_ProductID = "",
                    pp_TxnRefNo = txnRefNo,
                    pp_Amount = formattedAmount,
                    pp_TxnCurrency = _settings.Currency,
                    pp_TxnDateTime = txnDateTime,
                    pp_BillReference = customerId,
                    pp_Description = $"Payment for customer {customerId}",
                    pp_TxnExpiryDateTime = txnExpiryDateTime,
                    pp_ReturnURL = !string.IsNullOrEmpty(callbackUrl) ? callbackUrl : _settings.ReturnUrl,
                    ppmpf_1 = "", // Customer mobile number - to be provided by frontend
                    ppmpf_2 = "",
                    ppmpf_3 = "",
                    ppmpf_4 = "",
                    ppmpf_5 = ""
                };

                // Generate secure hash
                request.pp_SecureHash = JazzCashSecureHashHelper.GenerateMobileAccountHash(
                    _settings.IntegritySalt,
                    request.pp_Amount,
                    request.pp_BankID,
                    request.pp_BillReference,
                    request.pp_Description,
                    request.pp_Language,
                    request.pp_MerchantID,
                    request.pp_Password,
                    request.pp_ProductID,
                    request.pp_ReturnURL,
                    request.pp_SubMerchantID,
                    request.pp_TxnCurrency,
                    request.pp_TxnDateTime,
                    request.pp_TxnExpiryDateTime,
                    request.pp_TxnRefNo,
                    request.pp_TxnType,
                    request.pp_Version,
                    request.ppmpf_1,
                    request.ppmpf_2,
                    request.ppmpf_3,
                    request.ppmpf_4,
                    request.ppmpf_5
                );

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Sending Jazz Cash mobile account payment request: {txnRefNo}", txnRefNo);
                _logger.LogDebug("Jazz Cash request: {json}", json);

                var response = await _httpClient.PostAsync($"{_settings.ApiBaseUrl}/CustomerPortal/transactionmanagement/merchantform", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Jazz Cash response status: {statusCode}", response.StatusCode);
                _logger.LogDebug("Jazz Cash response: {response}", responseBody);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<JazzCashPaymentResponseDto>(responseBody);
                    if (result != null && result.pp_ResponseCode == "000")
                    {
                        // Return the payment URL or transaction reference for further processing
                        return $"{_settings.ApiBaseUrl}/CustomerPortal/transactionmanagement/merchantform?pp_TxnRefNo={txnRefNo}";
                    }
                    else
                    {
                        _logger.LogError("Jazz Cash payment failed: {responseCode} - {responseMessage}", 
                            result?.pp_ResponseCode, result?.pp_ResponseMessage);
                        throw new Exception($"Jazz Cash payment failed: {result?.pp_ResponseMessage}");
                    }
                }
                else
                {
                    _logger.LogError("Jazz Cash API error: {statusCode} - {response}", response.StatusCode, responseBody);
                    throw new Exception($"Jazz Cash API error: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Jazz Cash payment request");
                throw;
            }
        }

        public async Task<string> CreateVoucherPaymentAsync(decimal amount, string customerId, string mobileNumber)
        {
            try
            {
                var txnRefNo = JazzCashSecureHashHelper.GenerateTransactionReference();
                var txnDateTime = JazzCashSecureHashHelper.FormatDateTime(DateTime.Now);
                var txnExpiryDateTime = JazzCashSecureHashHelper.FormatDateTime(DateTime.Now.AddHours(_settings.TransactionExpiryHours));
                var formattedAmount = JazzCashSecureHashHelper.FormatAmount(amount);

                var request = new JazzCashVoucherRequestDto
                {
                    pp_Version = "1.1",
                    pp_TxnType = "OTC",
                    pp_Language = _settings.Language,
                    pp_MerchantID = _settings.MerchantId,
                    pp_SubMerchantID = "",
                    pp_Password = _settings.Password,
                    pp_BankID = "",
                    pp_ProductID = "",
                    pp_TxnRefNo = txnRefNo,
                    pp_Amount = formattedAmount,
                    pp_TxnCurrency = _settings.Currency,
                    pp_TxnDateTime = txnDateTime,
                    pp_BillReference = customerId,
                    pp_Description = $"Voucher payment for customer {customerId}",
                    pp_TxnExpiryDateTime = txnExpiryDateTime,
                    pp_ReturnURL = _settings.ReturnUrl,
                    ppmpf_1 = mobileNumber, // Mobile number for voucher notifications
                    ppmpf_2 = "",
                    ppmpf_3 = "",
                    ppmpf_4 = "",
                    ppmpf_5 = ""
                };

                request.pp_SecureHash = JazzCashSecureHashHelper.GenerateVoucherHash(
                    _settings.IntegritySalt,
                    request.pp_Amount,
                    request.pp_BankID,
                    request.pp_BillReference,
                    request.pp_Description,
                    request.pp_Language,
                    request.pp_MerchantID,
                    request.pp_Password,
                    request.pp_ProductID,
                    request.pp_ReturnURL,
                    request.pp_SubMerchantID,
                    request.pp_TxnCurrency,
                    request.pp_TxnDateTime,
                    request.pp_TxnExpiryDateTime,
                    request.pp_TxnRefNo,
                    request.pp_TxnType,
                    request.pp_Version,
                    request.ppmpf_1,
                    request.ppmpf_2,
                    request.ppmpf_3,
                    request.ppmpf_4,
                    request.ppmpf_5
                );

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Sending Jazz Cash voucher payment request: {txnRefNo}", txnRefNo);
                var response = await _httpClient.PostAsync($"{_settings.ApiBaseUrl}/CustomerPortal/transactionmanagement/merchantform", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Jazz Cash voucher response: {response}", responseBody);

                if (response.IsSuccessStatusCode)
                {
                    return txnRefNo; // Return transaction reference for voucher
                }
                else
                {
                    throw new Exception($"Jazz Cash voucher API error: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Jazz Cash voucher payment");
                throw;
            }
        }

        public async Task<bool> ConfirmPaymentAsync(string transactionId, string signature)
        {
            try
            {
                // Get transaction status from Jazz Cash
                var status = await GetTransactionStatusAsync(transactionId);
                
                if (status != null)
                {
                    // Verify the signature/hash
                    var isValidSignature = VerifySignature(status, signature);
                    
                    if (isValidSignature && status.status == "SUCCESS")
                    {
                        _logger.LogInformation("Jazz Cash payment confirmed: {transactionId}", transactionId);
                        return true;
                    }
                }

                _logger.LogWarning("Jazz Cash payment confirmation failed: {transactionId}", transactionId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming Jazz Cash payment: {transactionId}", transactionId);
                return false;
            }
        }

        public async Task<bool> ReleaseFundsAsync(string transactionId, decimal amount)
        {
            // Jazz Cash doesn't have a separate release funds API
            // Funds are automatically released upon successful transaction
            _logger.LogInformation("Jazz Cash funds automatically released for transaction: {transactionId}", transactionId);
            return await Task.FromResult(true);
        }

        public async Task<bool> RefundPaymentAsync(string transactionId, decimal amount)
        {
            try
            {
                var formattedAmount = JazzCashSecureHashHelper.FormatAmount(amount);

                var refundRequest = new JazzCashRefundRequestDto
                {
                    RefundRequest = new RefundRequest
                    {
                        pp_TxnRefNo = transactionId,
                        pp_Amount = formattedAmount,
                        pp_TxnCurrency = _settings.Currency,
                        pp_MerchantID = _settings.MerchantId,
                        pp_Password = _settings.Password
                    }
                };

                refundRequest.RefundRequest.pp_SecureHash = JazzCashSecureHashHelper.GenerateRefundHash(
                    _settings.IntegritySalt,
                    refundRequest.RefundRequest.pp_Amount,
                    refundRequest.RefundRequest.pp_MerchantID,
                    refundRequest.RefundRequest.pp_Password,
                    refundRequest.RefundRequest.pp_TxnCurrency,
                    refundRequest.RefundRequest.pp_TxnRefNo
                );

                var json = JsonSerializer.Serialize(refundRequest);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Sending Jazz Cash refund request: {transactionId}", transactionId);
                var response = await _httpClient.PostAsync($"{_settings.ApiBaseUrl}/ApplicationAPI/API/2.0/Purchase/DoRefund", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Jazz Cash refund response: {response}", responseBody);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<JazzCashRefundResponseDto>(responseBody);
                    return result?.responseCode == "000";
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refunding Jazz Cash payment: {transactionId}", transactionId);
                return false;
            }
        }

        public async Task<JazzCashTransactionStatusResponseDto?> GetTransactionStatusAsync(string transactionId)
        {
            try
            {
                var request = new JazzCashTransactionStatusRequestDto
                {
                    pp_TxnRefNo = transactionId,
                    pp_MerchantID = _settings.MerchantId,
                    pp_Password = _settings.Password,
                    pp_Version = "1.1"
                };

                request.pp_SecureHash = JazzCashSecureHashHelper.GenerateTransactionStatusHash(
                    _settings.IntegritySalt,
                    request.pp_MerchantID,
                    request.pp_Password,
                    request.pp_TxnRefNo,
                    request.pp_Version
                );

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Getting Jazz Cash transaction status: {transactionId}", transactionId);
                var response = await _httpClient.PostAsync($"{_settings.ApiBaseUrl}/ApplicationAPI/API/2.0/Purchase/DoInquiryTransaction", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                _logger.LogDebug("Jazz Cash status response: {response}", responseBody);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<JazzCashTransactionStatusResponseDto>(responseBody);
                    return result;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Jazz Cash transaction status: {transactionId}", transactionId);
                return null;
            }
        }

        public bool VerifySignature(string payload, string signature)
        {
            try
            {
                // For webhook notifications, verify the secure hash
                var calculatedHash = JazzCashSecureHashHelper.GenerateSecureHash(_settings.IntegritySalt, payload);
                return string.Equals(calculatedHash, signature, StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying Jazz Cash signature");
                return false;
            }
        }

        public bool VerifySignature(JazzCashTransactionStatusResponseDto response, string signature)
        {
            try
            {
                // Create parameter string from response for verification
                var parameters = $"{response.status}&{response.rrn}&{response.settlementDate}&{response.settlementExpiryDate}&{response.authCode}&{response.bankID}&{response.productID}";
                return VerifySignature(parameters, signature);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying Jazz Cash response signature");
                return false;
            }
        }

        public async Task<bool> VoidTransactionAsync(string transactionId)
        {
            try
            {
                var voidRequest = new JazzCashVoidRequestDto
                {
                    VoidRequest = new VoidRequest
                    {
                        pp_TxnRefNo = transactionId,
                        pp_MerchantID = _settings.MerchantId,
                        pp_Password = _settings.Password
                    }
                };

                voidRequest.VoidRequest.pp_SecureHash = JazzCashSecureHashHelper.GenerateVoidHash(
                    _settings.IntegritySalt,
                    voidRequest.VoidRequest.pp_MerchantID,
                    voidRequest.VoidRequest.pp_Password,
                    voidRequest.VoidRequest.pp_TxnRefNo
                );

                var json = JsonSerializer.Serialize(voidRequest);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Sending Jazz Cash void request: {transactionId}", transactionId);
                var response = await _httpClient.PostAsync($"{_settings.ApiBaseUrl}/ApplicationAPI/API/2.0/Purchase/DoVoid", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Jazz Cash void response: {response}", responseBody);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<JazzCashVoidResponseDto>(responseBody);
                    return result?.responseCode == "000";
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error voiding Jazz Cash transaction: {transactionId}", transactionId);
                return false;
            }
        }
    }
}