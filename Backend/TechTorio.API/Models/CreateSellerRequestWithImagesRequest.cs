using Microsoft.AspNetCore.Http;

namespace TechTorio.API.Models;

public class CreateSellerRequestWithImagesRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public List<IFormFile>? Images { get; set; }
}