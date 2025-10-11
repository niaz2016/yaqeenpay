using Microsoft.AspNetCore.Http;

namespace YaqeenPay.API.Models;

public class CreateOrderWithBuyerMobileRequest
{
    public string BuyerMobileNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "PKR";
    public List<IFormFile>? Images { get; set; }
}