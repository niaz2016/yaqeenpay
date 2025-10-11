using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace YaqeenPay.API.Models;

public class CreateOrderWithSellerMobileRequest
{
    [Required(ErrorMessage = "Seller mobile number is required")]
    public string SellerMobileNumber { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, ErrorMessage = "Title must not exceed 200 characters")]
    public string Title { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Description is required")]
    [StringLength(2000, ErrorMessage = "Description must not exceed 2000 characters")]
    public string Description { get; set; } = string.Empty;
    
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [Required(ErrorMessage = "Currency is required")]
    public string Currency { get; set; } = "PKR";
    
    public List<IFormFile>? Images { get; set; }
}