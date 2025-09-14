using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using YaqeenPay.Application.Interfaces;
using YaqeenPay.Infrastructure.Services.Easypaisa.DTOs;

namespace YaqeenPay.Infrastructure.Services.Easypaisa
{
    public class EasypaisaSettings
    {
        public string MerchantId { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string Secret { get; set; } = string.Empty;
        public string CallbackUrl { get; set; } = string.Empty;
        public string ApiBaseUrl { get; set; } = string.Empty;
    }

    public class EasypaisaPaymentService : IPaymentGatewayService
    {
        private readonly EasypaisaSettings _settings;
        private readonly ILogger<EasypaisaPaymentService> _logger;
        private readonly HttpClient _httpClient;

        public EasypaisaPaymentService(IOptions<EasypaisaSettings> options, ILogger<EasypaisaPaymentService> logger, HttpClient httpClient)
        {
            _settings = options.Value;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<string> CreatePaymentRequestAsync(decimal amount, string customerId, string callbackUrl)
        {
            var request = new EasypaisaCreatePaymentRequestDto
            {
                MerchantId = _settings.MerchantId,
                ApiKey = _settings.ApiKey,
                Amount = amount,
                CustomerId = customerId,
                CallbackUrl = callbackUrl
            };
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            _logger.LogInformation("Sending Easypaisa payment request: {json}", json);
            var response = await _httpClient.PostAsync(_settings.ApiBaseUrl + "/create-payment", content);
            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Easypaisa response: {response}", responseBody);
            response.EnsureSuccessStatusCode();
            var result = JsonSerializer.Deserialize<EasypaisaCreatePaymentResponseDto>(responseBody);
            return result?.PaymentUrl ?? string.Empty;
        }

        public async Task<bool> ConfirmPaymentAsync(string transactionId, string signature)
        {
            // Call Easypaisa API to confirm payment
            var request = new { TransactionId = transactionId, Signature = signature };
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            _logger.LogInformation("Confirming Easypaisa payment: {json}", json);
            var response = await _httpClient.PostAsync(_settings.ApiBaseUrl + "/confirm-payment", content);
            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Easypaisa confirm response: {response}", responseBody);
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> ReleaseFundsAsync(string transactionId, decimal amount)
        {
            var request = new EasypaisaReleaseFundsRequestDto { TransactionId = transactionId, Amount = amount };
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            _logger.LogInformation("Releasing funds via Easypaisa: {json}", json);
            var response = await _httpClient.PostAsync(_settings.ApiBaseUrl + "/release-funds", content);
            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Easypaisa release response: {response}", responseBody);
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> RefundPaymentAsync(string transactionId, decimal amount)
        {
            var request = new EasypaisaRefundRequestDto { TransactionId = transactionId, Amount = amount };
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            _logger.LogInformation("Refunding payment via Easypaisa: {json}", json);
            var response = await _httpClient.PostAsync(_settings.ApiBaseUrl + "/refund-payment", content);
            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Easypaisa refund response: {response}", responseBody);
            return response.IsSuccessStatusCode;
        }

        public bool VerifySignature(string payload, string signature)
        {
            // Implement signature verification logic using _settings.Secret
            // For demonstration, always return true
            // In production, use HMAC or similar
            return true;
        }
    }
}
