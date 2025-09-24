using Microsoft.AspNetCore.Http;

namespace YaqeenPay.API.Models;

public class CreateOrderWithImagesRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public Guid SellerId { get; set; }
    public List<IFormFile>? Images { get; set; }
}