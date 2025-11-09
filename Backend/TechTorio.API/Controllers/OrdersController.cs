using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechTorio.Application.Features.Orders.Commands.CompleteOrder;
using TechTorio.Application.Features.Orders.Commands.CreateOrder;
using TechTorio.Application.Features.Orders.Commands.CreateSellerRequest;
using TechTorio.Application.Features.Orders.Commands.CreateOrderWithSellerMobile;
using TechTorio.Application.Features.Orders.Commands.CreateOrderWithBuyerMobile;
using TechTorio.Application.Features.Orders.Commands.AcceptSellerRequest;
using TechTorio.Application.Features.Orders.Commands.UpdateShippingDetails;
using TechTorio.Application.Features.Orders.Commands.MarkOrderAsShipped;
using TechTorio.Application.Features.Orders.Commands.MarkOrderAsDelivered;
using TechTorio.Application.Features.Orders.Commands.RejectOrder;
using TechTorio.Application.Features.Orders.Commands.CancelOrder;
using TechTorio.Application.Features.Orders.Commands.CreateDispute;
using TechTorio.Application.Features.Orders.Commands.PayForOrder;
using TechTorio.Application.Features.Orders.Commands.MarkParcelBooked;
using TechTorio.Application.Features.Orders.Commands.RejectDelivery;
using TechTorio.Application.Features.Orders.Queries.GetOrderById;
using TechTorio.Application.Features.Orders.Queries.GetOrdersList;
using TechTorio.Application.Features.Orders.Queries.GetBuyerOrders;
using TechTorio.Application.Features.Orders.Queries.GetSellerOrders;
using TechTorio.Application.Features.Orders.Queries.GetAvailableSellerRequests;

using TechTorio.Application.Interfaces;
using TechTorio.API.Models;
using TechTorio.Application.Features.Orders.Commands.ConfirmShipped;
using TechTorio.Application.Features.Orders.Commands.CreateOrderFromCart;

using TechTorio.Application.Common.Interfaces;

namespace TechTorio.API.Controllers;

[Authorize]
public class OrdersController : ApiControllerBase
{
    private readonly IFileUploadService _fileUploadService;
    private readonly ILogger<OrdersController> _logger;
    private readonly ICurrentUserService _currentUserService;

    public OrdersController(IFileUploadService fileUploadService, ILogger<OrdersController> logger, ICurrentUserService currentUserService)
    {
        _fileUploadService = fileUploadService;
        _logger = logger;
        _currentUserService = currentUserService;
    }
    
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetOrdersListQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("buyer")]
    public async Task<IActionResult> GetBuyerOrders([FromQuery] GetBuyerOrdersQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("seller")]
    public async Task<IActionResult> GetSellerOrders([FromQuery] GetSellerOrdersQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("available-seller-requests")]
    public async Task<IActionResult> GetAvailableSellerRequests([FromQuery] GetAvailableSellerRequestsQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return Ok(await Mediator.Send(new GetOrderByIdQuery { OrderId = id }));
    }

    [HttpGet("{id}/tracking")]
    public async Task<IActionResult> GetTracking(Guid id)
    {
        return Ok(await Mediator.Send(new TechTorio.Application.Features.Orders.Queries.GetOrderTracking.GetOrderTrackingQuery { OrderId = id }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrderCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("from-cart")]
    public async Task<IActionResult> CreateFromCart(CreateOrderFromCartCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("with-buyer-mobile")]
    public async Task<IActionResult> CreateWithBuyerMobile(CreateOrderWithBuyerMobileCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("with-buyer-mobile-images")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> CreateWithBuyerMobileImages([FromForm] CreateOrderWithBuyerMobileRequest request)
    {
        try
        {
            _logger.LogInformation("Order with buyer mobile and images request received. BuyerMobile={BuyerMobile}, FileCount={FileCount}",
                request.BuyerMobileNumber,
                Request.Form?.Files?.Count ?? 0);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("ModelState invalid for order with buyer mobile images: {Errors}", 
                    string.Join(" | ", ModelState.Select(kvp => kvp.Key + ":" + string.Join(',', kvp.Value!.Errors.Select(e => e.ErrorMessage)))));
                return BadRequest(ModelState);
            }

            var imageUrls = new List<string>();

            // Upload images if provided
            if (request.Images != null && request.Images.Count > 0)
            {
                foreach (var image in request.Images)
                {
                    if (!_fileUploadService.IsValidImageFile(image.FileName, image.Length))
                    {
                        return BadRequest($"Invalid image file: {image.FileName}");
                    }
                }

                // Convert IFormFile to Stream for the service
                var fileStreams = new List<(Stream fileStream, string fileName)>();
                foreach (var image in request.Images)
                {
                    fileStreams.Add((image.OpenReadStream(), image.FileName));
                }

                var uploadedPaths = await _fileUploadService.UploadFilesAsync(fileStreams, "orders");
                imageUrls = uploadedPaths.Select(path => _fileUploadService.GetFileUrl(path)).ToList();
            }

            // Create the command
            var command = new CreateOrderWithBuyerMobileCommand
            {
                BuyerMobileNumber = request.BuyerMobileNumber,
                Title = request.Title,
                Description = request.Description,
                Amount = request.Amount,
                Currency = request.Currency,
                ImageUrls = imageUrls
            };

            return Ok(await Mediator.Send(command));
        }
        catch (Exception ex)
        {
            return BadRequest($"Error creating order with buyer mobile and images: {ex.Message}");
        }
    }

    [HttpPost("with-images")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> CreateWithImages([FromForm] CreateOrderWithImagesRequest request)
    {
        try
        {
            var imageUrls = new List<string>();

            // Upload images if provided
            if (request.Images != null && request.Images.Count > 0)
            {
                foreach (var image in request.Images)
                {
                    if (!_fileUploadService.IsValidImageFile(image.FileName, image.Length))
                    {
                        return BadRequest($"Invalid image file: {image.FileName}");
                    }
                }

                // Convert IFormFile to Stream for the service
                var fileStreams = new List<(Stream fileStream, string fileName)>();
                foreach (var image in request.Images)
                {
                    fileStreams.Add((image.OpenReadStream(), image.FileName));
                }

                var uploadedPaths = await _fileUploadService.UploadFilesAsync(fileStreams, "orders");
                imageUrls = uploadedPaths.Select(path => _fileUploadService.GetFileUrl(path)).ToList();
            }

            // Create the command
            var command = new CreateOrderCommand
            {
                Title = request.Title,
                Description = request.Description,
                Amount = request.Amount,
                Currency = request.Currency,
                SellerId = request.SellerId,
                ImageUrls = imageUrls
            };

            return Ok(await Mediator.Send(command));
        }
        catch (Exception ex)
        {
            return BadRequest($"Error creating order: {ex.Message}");
        }
    }

    [HttpPost("seller-request")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> CreateSellerRequest([FromForm] CreateSellerRequestWithImagesRequest request)
    {
        try
        {
            _logger.LogInformation("Seller request received. HasFormContentType={HasForm}, Keys={Keys}, FileCount={FileCount}",
                Request.HasFormContentType,
                string.Join(',', Request.Form?.Keys ?? Array.Empty<string>()),
                Request.Form?.Files?.Count ?? 0);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("ModelState invalid for seller-request: {Errors}", string.Join(" | ", ModelState.Select(kvp => kvp.Key+":"+string.Join(',', kvp.Value!.Errors.Select(e=>e.ErrorMessage)))));
            }

            var imageUrls = new List<string>();

            // Upload images if provided
            if (request.Images != null && request.Images.Count > 0)
            {
                foreach (var image in request.Images)
                {
                    if (!_fileUploadService.IsValidImageFile(image.FileName, image.Length))
                    {
                        return BadRequest($"Invalid image file: {image.FileName}");
                    }
                }

                // Convert IFormFile to Stream for the service
                var fileStreams = new List<(Stream fileStream, string fileName)>();
                foreach (var image in request.Images)
                {
                    fileStreams.Add((image.OpenReadStream(), image.FileName));
                }

                var uploadedPaths = await _fileUploadService.UploadFilesAsync(fileStreams, "seller-requests");
                imageUrls = uploadedPaths.Select(path => _fileUploadService.GetFileUrl(path)).ToList();
            }

            // Create the command
            var command = new CreateSellerRequestCommand
            {
                Title = request.Title,
                Description = request.Description,
                Amount = request.Amount,
                Currency = request.Currency,
                ImageUrls = imageUrls
            };

            return Ok(await Mediator.Send(command));
        }
        catch (Exception ex)
        {
            return BadRequest($"Error creating seller request: {ex.Message}");
        }
    }

    [HttpPost("with-seller-mobile")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> CreateOrderWithSellerMobile([FromForm] CreateOrderWithSellerMobileRequest request)
    {
        try
        {
            _logger.LogInformation("Order with seller mobile request received. SellerMobile={SellerMobile}, FileCount={FileCount}",
                request.SellerMobileNumber,
                Request.Form?.Files?.Count ?? 0);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("ModelState invalid for order with seller mobile: {Errors}", 
                    string.Join(" | ", ModelState.Select(kvp => kvp.Key + ":" + string.Join(',', kvp.Value!.Errors.Select(e => e.ErrorMessage)))));
                return BadRequest(ModelState);
            }

            // Validate phone number format before sending command
            if (!IsValidPhoneNumberFormat(request.SellerMobileNumber))
            {
                _logger.LogWarning("Invalid phone number format for CreateOrderWithSellerMobile: '{PhoneNumber}'", request.SellerMobileNumber);
                return BadRequest($"Invalid mobile number format. Must be 8-16 digits, optionally starting with +. Received: '{request.SellerMobileNumber}'");
            }

            var imageUrls = new List<string>();

            // Upload images if provided
            if (request.Images != null && request.Images.Count > 0)
            {
                foreach (var image in request.Images)
                {
                    if (!_fileUploadService.IsValidImageFile(image.FileName, image.Length))
                    {
                        return BadRequest($"Invalid image file: {image.FileName}");
                    }
                }

                // Convert IFormFile to Stream for the service
                var fileStreams = new List<(Stream fileStream, string fileName)>();
                foreach (var image in request.Images)
                {
                    fileStreams.Add((image.OpenReadStream(), image.FileName));
                }

                var uploadedPaths = await _fileUploadService.UploadFilesAsync(fileStreams, "orders");
                imageUrls = uploadedPaths.Select(path => _fileUploadService.GetFileUrl(path)).ToList();
            }

            // Create the command
            var command = new CreateOrderWithSellerMobileCommand
            {
                SellerMobileNumber = request.SellerMobileNumber,
                Title = request.Title,
                Description = request.Description,
                Amount = request.Amount,
                Currency = request.Currency,
                ImageUrls = imageUrls
            };

            // Log command properties for debugging
            _logger.LogInformation("Sending CreateOrderWithSellerMobileCommand: SellerMobile='{SellerMobile}', Title='{Title}', Description='{Description}', Amount={Amount}, Currency='{Currency}', ImageCount={ImageCount}",
                command.SellerMobileNumber, command.Title, command.Description, command.Amount, command.Currency, command.ImageUrls.Count);

            try
            {
                return Ok(await Mediator.Send(command));
            }
            catch (TechTorio.Application.Common.Exceptions.ValidationException validationEx)
            {
                _logger.LogWarning("Detailed validation errors for CreateOrderWithSellerMobile: {@ValidationErrors}", validationEx.Errors);
                _logger.LogWarning("Command values - SellerMobile: '{SellerMobile}', Title: '{Title}', Description: '{Description}', Amount: {Amount}, Currency: '{Currency}'", 
                    command.SellerMobileNumber, command.Title, command.Description, command.Amount, command.Currency);
                
                return BadRequest(new 
                { 
                    message = "Validation failed", 
                    errors = validationEx.Errors 
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order with seller mobile");
            return BadRequest($"Error creating order with seller mobile: {ex.Message}");
        }
    }

    [HttpPost("accept-seller-request")]
    public async Task<IActionResult> AcceptSellerRequest(AcceptSellerRequestCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPut("{id}/shipping")]
    public async Task<IActionResult> UpdateShippingDetails(Guid id, UpdateShippingDetailsCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/ship")]
    public async Task<IActionResult> MarkAsShipped(Guid id, MarkOrderAsShippedCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/deliver")]
    public async Task<IActionResult> MarkAsDelivered(Guid id, MarkOrderAsDeliveredCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> Complete(Guid id)
    {
        return Ok(await Mediator.Send(new CompleteOrderCommand { OrderId = id }));
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, RejectOrderCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/reject-delivery")]
    public async Task<IActionResult> RejectDelivery(Guid id, RejectDeliveryCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    // Check if current user is eligible to review a product (has a delivered order containing the product)
    [HttpGet("eligible-to-review")]
    public async Task<IActionResult> EligibleToReview([FromQuery] Guid productId)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

    // Use mediator query to check eligibility (delivered/completed orders containing the product)
    var result = await Mediator.Send(new TechTorio.Application.Features.Orders.Queries.CheckProductReviewEligibility.CheckProductReviewEligibilityQuery { ProductId = productId, UserId = userId });
        return Ok(new { eligible = result });
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        return Ok(await Mediator.Send(new CancelOrderCommand { OrderId = id }));
    }

    [HttpPost("{id}/dispute")]
    public async Task<IActionResult> CreateDispute(Guid id, CreateDisputeCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/pay")]
    public async Task<IActionResult> PayForOrder(Guid id)
    {
        return Ok(await Mediator.Send(new PayForOrderCommand { OrderId = id }));
    }

    [HttpPost("{id}/mark-parcel-booked")]
    public async Task<IActionResult> MarkParcelBooked(Guid id, MarkParcelBookedCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/confirm-shipped")]
    public async Task<IActionResult> ConfirmShipped(Guid id)
    {
        var userId = GetCurrentUserId();
        return Ok(await Mediator.Send(new ConfirmShippedCommand(id, userId)));
    }

    [HttpPost("{id}/confirm-delivery")]
    public async Task<IActionResult> ConfirmDelivery(Guid id)
    {
        var userId = GetCurrentUserId();
        return Ok(await Mediator.Send(new TechTorio.Application.Features.Orders.Commands.ConfirmDelivery.ConfirmDeliveryCommand(id, userId)));
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId;
    }

    private static bool IsValidPhoneNumberFormat(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return false;
            
        // Updated regex pattern to allow numbers starting with 0 (for Pakistani format like 03031234561)
        return System.Text.RegularExpressions.Regex.IsMatch(phoneNumber, @"^\+?[0-9]\d{7,15}$");
    }
}