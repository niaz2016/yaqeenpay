namespace TechTorio.Infrastructure.Services.Easypaisa.DTOs
{
    public class EasypaisaCreatePaymentRequestDto
    {
        public string? MerchantId { get; set; }
        public string? ApiKey { get; set; }
        public decimal Amount { get; set; }
        public string? CustomerId { get; set; }
        public string? CallbackUrl { get; set; }
    }

    public class EasypaisaCreatePaymentResponseDto
    {
        public string? PaymentUrl { get; set; }
        public string? TransactionId { get; set; }
        public string? Status { get; set; }
        public string? Message { get; set; }
    }

    public class EasypaisaWebhookNotificationDto
    {
        public string? TransactionId { get; set; }
        public string? Status { get; set; }
        public string? Signature { get; set; }
        public decimal Amount { get; set; }
    }

    public class EasypaisaRefundRequestDto
    {
        public string? TransactionId { get; set; }
        public decimal Amount { get; set; }
    }

    public class EasypaisaRefundResponseDto
    {
        public string? Status { get; set; }
        public string? Message { get; set; }
    }

    public class EasypaisaReleaseFundsRequestDto
    {
        public string? TransactionId { get; set; }
        public decimal Amount { get; set; }
    }

    public class EasypaisaReleaseFundsResponseDto
    {
        public string? Status { get; set; }
        public string? Message { get; set; }
    }
}
