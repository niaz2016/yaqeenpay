using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Features.Orders.Commands.CompleteOrder;
using YaqeenPay.Application.Features.Orders.Commands.CreateOrder;
using YaqeenPay.Application.Features.Orders.Commands.CreateSellerRequest;
using YaqeenPay.Application.Features.Orders.Commands.CreateOrderWithSellerMobile;
using YaqeenPay.Application.Features.Orders.Commands.AcceptSellerRequest;
using YaqeenPay.Application.Features.Orders.Commands.UpdateShippingDetails;
using YaqeenPay.Application.Features.Orders.Commands.MarkOrderAsShipped;
using YaqeenPay.Application.Features.Orders.Commands.MarkOrderAsDelivered;
using YaqeenPay.Application.Features.Orders.Commands.RejectOrder;
using YaqeenPay.Application.Features.Orders.Commands.CancelOrder;
using YaqeenPay.Application.Features.Orders.Commands.CreateDispute;
using YaqeenPay.Application.Features.Orders.Queries.GetOrderById;
using YaqeenPay.Application.Features.Orders.Queries.GetOrdersList;
using YaqeenPay.Application.Features.Orders.Queries.GetBuyerOrders;
using YaqeenPay.Application.Features.Orders.Queries.GetSellerOrders;
using YaqeenPay.Application.Features.Orders.Queries.GetAvailableSellerRequests;
using YaqeenPay.Application.Interfaces;
using YaqeenPay.API.Models;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class OrdersController : ApiControllerBase
{
    private readonly IFileUploadService _fileUploadService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IFileUploadService fileUploadService, ILogger<OrdersController> logger)
    {
        _fileUploadService = fileUploadService;
        _logger = logger;
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

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrderCommand command)
    {
        return Ok(await Mediator.Send(command));
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

            return Ok(await Mediator.Send(command));
        }
        catch (Exception ex)
        {
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
}