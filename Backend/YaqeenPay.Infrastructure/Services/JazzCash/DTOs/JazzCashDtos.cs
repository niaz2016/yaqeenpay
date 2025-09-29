namespace YaqeenPay.Infrastructure.Services.JazzCash.DTOs
{
    // Direct Pay API DTOs
    public class JazzCashDirectPayRequestDto
    {
        public string pp_Version { get; set; } = "1.1";
        public string pp_TxnType { get; set; } = "MPAY";
        public string pp_TxnRefNo { get; set; } = string.Empty;
        public string pp_MerchantID { get; set; } = string.Empty;
        public string pp_Password { get; set; } = string.Empty;
        public string pp_Amount { get; set; } = string.Empty;
        public string pp_TxnCurrency { get; set; } = "PKR";
        public string pp_TxnDateTime { get; set; } = string.Empty;
        public string pp_TxnExpiryDateTime { get; set; } = string.Empty;
        public string pp_BillReference { get; set; } = string.Empty;
        public string pp_Description { get; set; } = string.Empty;
        public string pp_CustomerCardNumber { get; set; } = string.Empty;
        public string pp_CustomerCardExpiry { get; set; } = string.Empty;
        public string pp_CustomerCardCvv { get; set; } = string.Empty;
        public string pp_SecureHash { get; set; } = string.Empty;
        public string pp_Frequency { get; set; } = "SINGLE";
    }

    // Mobile Account API DTOs
    public class JazzCashMobileAccountRequestDto
    {
        public string pp_Version { get; set; } = "1.1";
        public string pp_TxnType { get; set; } = "MWALLET";
        public string pp_Language { get; set; } = "EN";
        public string pp_MerchantID { get; set; } = string.Empty;
        public string pp_SubMerchantID { get; set; } = string.Empty;
        public string pp_Password { get; set; } = string.Empty;
        public string pp_BankID { get; set; } = string.Empty;
        public string pp_ProductID { get; set; } = string.Empty;
        public string pp_TxnRefNo { get; set; } = string.Empty;
        public string pp_Amount { get; set; } = string.Empty;
        public string pp_TxnCurrency { get; set; } = "PKR";
        public string pp_TxnDateTime { get; set; } = string.Empty;
        public string pp_BillReference { get; set; } = string.Empty;
        public string pp_Description { get; set; } = string.Empty;
        public string pp_TxnExpiryDateTime { get; set; } = string.Empty;
        public string pp_ReturnURL { get; set; } = string.Empty;
        public string pp_SecureHash { get; set; } = string.Empty;
        public string ppmpf_1 { get; set; } = string.Empty; // Mobile Number
        public string ppmpf_2 { get; set; } = string.Empty;
        public string ppmpf_3 { get; set; } = string.Empty;
        public string ppmpf_4 { get; set; } = string.Empty;
        public string ppmpf_5 { get; set; } = string.Empty;
    }

    // Voucher Payment API DTOs
    public class JazzCashVoucherRequestDto
    {
        public string pp_Version { get; set; } = "1.1";
        public string pp_TxnType { get; set; } = "OTC";
        public string pp_Language { get; set; } = "EN";
        public string pp_MerchantID { get; set; } = string.Empty;
        public string pp_SubMerchantID { get; set; } = string.Empty;
        public string pp_Password { get; set; } = string.Empty;
        public string pp_BankID { get; set; } = string.Empty;
        public string pp_ProductID { get; set; } = string.Empty;
        public string pp_TxnRefNo { get; set; } = string.Empty;
        public string pp_Amount { get; set; } = string.Empty;
        public string pp_TxnCurrency { get; set; } = "PKR";
        public string pp_TxnDateTime { get; set; } = string.Empty;
        public string pp_BillReference { get; set; } = string.Empty;
        public string pp_Description { get; set; } = string.Empty;
        public string pp_TxnExpiryDateTime { get; set; } = string.Empty;
        public string pp_ReturnURL { get; set; } = string.Empty;
        public string pp_SecureHash { get; set; } = string.Empty;
        public string ppmpf_1 { get; set; } = string.Empty; // Mobile Number for notifications
        public string ppmpf_2 { get; set; } = string.Empty;
        public string ppmpf_3 { get; set; } = string.Empty;
        public string ppmpf_4 { get; set; } = string.Empty;
        public string ppmpf_5 { get; set; } = string.Empty;
    }

    // Common Response DTO
    public class JazzCashPaymentResponseDto
    {
        public string pp_Amount { get; set; } = string.Empty;
        public string pp_AuthCode { get; set; } = string.Empty;
        public string pp_BankID { get; set; } = string.Empty;
        public string pp_BillReference { get; set; } = string.Empty;
        public string pp_Language { get; set; } = string.Empty;
        public string pp_MerchantID { get; set; } = string.Empty;
        public string pp_ResponseCode { get; set; } = string.Empty;
        public string pp_ResponseMessage { get; set; } = string.Empty;
        public string pp_RetreivalReferenceNo { get; set; } = string.Empty;
        public string pp_SubMerchantId { get; set; } = string.Empty;
        public string pp_TxnCurrency { get; set; } = string.Empty;
        public string pp_TxnDateTime { get; set; } = string.Empty;
        public string pp_TxnRefNo { get; set; } = string.Empty;
        public string pp_SettlementExpiry { get; set; } = string.Empty;
        public string pp_TxnType { get; set; } = string.Empty;
        public string pp_Version { get; set; } = string.Empty;
        public string ppmbf_1 { get; set; } = string.Empty;
        public string ppmbf_2 { get; set; } = string.Empty;
        public string ppmbf_3 { get; set; } = string.Empty;
        public string ppmbf_4 { get; set; } = string.Empty;
        public string ppmbf_5 { get; set; } = string.Empty;
        public string ppmpf_1 { get; set; } = string.Empty;
        public string ppmpf_2 { get; set; } = string.Empty;
        public string ppmpf_3 { get; set; } = string.Empty;
        public string ppmpf_4 { get; set; } = string.Empty;
        public string ppmpf_5 { get; set; } = string.Empty;
        public string pp_SecureHash { get; set; } = string.Empty;
    }

    // Transaction Status Inquiry DTOs
    public class JazzCashTransactionStatusRequestDto
    {
        public string pp_TxnRefNo { get; set; } = string.Empty;
        public string pp_MerchantID { get; set; } = string.Empty;
        public string pp_Password { get; set; } = string.Empty;
        public string pp_SecureHash { get; set; } = string.Empty;
        public string pp_Version { get; set; } = "1.1";
    }

    public class JazzCashTransactionStatusResponseDto
    {
        public string status { get; set; } = string.Empty;
        public string rrn { get; set; } = string.Empty;
        public string settlementDate { get; set; } = string.Empty;
        public string settlementExpiryDate { get; set; } = string.Empty;
        public string authCode { get; set; } = string.Empty;
        public string bankID { get; set; } = string.Empty;
        public string productID { get; set; } = string.Empty;
    }

    // Refund DTOs
    public class JazzCashRefundRequestDto
    {
        public RefundRequest RefundRequest { get; set; } = new RefundRequest();
    }

    public class RefundRequest
    {
        public string pp_TxnRefNo { get; set; } = string.Empty;
        public string pp_Amount { get; set; } = string.Empty;
        public string pp_TxnCurrency { get; set; } = "PKR";
        public string pp_MerchantID { get; set; } = string.Empty;
        public string pp_Password { get; set; } = string.Empty;
        public string pp_SecureHash { get; set; } = string.Empty;
    }

    public class JazzCashRefundResponseDto
    {
        public string responseCode { get; set; } = string.Empty;
        public string responseMessage { get; set; } = string.Empty;
    }

    // Void DTOs
    public class JazzCashVoidRequestDto
    {
        public VoidRequest VoidRequest { get; set; } = new VoidRequest();
    }

    public class VoidRequest
    {
        public string pp_TxnRefNo { get; set; } = string.Empty;
        public string pp_MerchantID { get; set; } = string.Empty;
        public string pp_Password { get; set; } = string.Empty;
        public string pp_SecureHash { get; set; } = string.Empty;
    }

    public class JazzCashVoidResponseDto
    {
        public string responseCode { get; set; } = string.Empty;
        public string responseMessage { get; set; } = string.Empty;
    }

    // 3D Secure DTOs
    public class JazzCash3DSecureEnrollmentRequestDto
    {
        public string pp_Version { get; set; } = "1.1";
        public string pp_TxnType { get; set; } = "MPAY";
        public string pp_TxnRefNo { get; set; } = string.Empty;
        public string pp_MerchantID { get; set; } = string.Empty;
        public string pp_Password { get; set; } = string.Empty;
        public string pp_Amount { get; set; } = string.Empty;
        public string pp_TxnCurrency { get; set; } = "PKR";
        public string pp_TxnDateTime { get; set; } = string.Empty;
        public string pp_TxnExpiryDateTime { get; set; } = string.Empty;
        public string pp_BillReference { get; set; } = string.Empty;
        public string pp_Description { get; set; } = string.Empty;
        public string pp_CustomerCardNumber { get; set; } = string.Empty;
        public string pp_CustomerCardExpiry { get; set; } = string.Empty;
        public string pp_CustomerCardCvv { get; set; } = string.Empty;
        public string pp_SecureHash { get; set; } = string.Empty;
    }

    public class JazzCash3DSecureEnrollmentResponseDto
    {
        public string result_CardEnrolled { get; set; } = string.Empty;
        public string c3dSecureID { get; set; } = string.Empty;
        public string aR_Simple_Html { get; set; } = string.Empty;
        public string responseCode { get; set; } = string.Empty;
        public string responseMessage { get; set; } = string.Empty;
    }

    // Webhook notification DTO
    public class JazzCashWebhookNotificationDto
    {
        public string pp_TxnRefNo { get; set; } = string.Empty;
        public string pp_ResponseCode { get; set; } = string.Empty;
        public string pp_ResponseMessage { get; set; } = string.Empty;
        public string pp_Amount { get; set; } = string.Empty;
        public string pp_TxnCurrency { get; set; } = string.Empty;
        public string pp_SecureHash { get; set; } = string.Empty;
        public string pp_TxnDateTime { get; set; } = string.Empty;
        public string pp_RetreivalReferenceNo { get; set; } = string.Empty;
    }
}