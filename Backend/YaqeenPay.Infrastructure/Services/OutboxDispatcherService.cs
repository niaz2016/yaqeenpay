using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using YaqeenPay.Application.Common.Interfaces;
using System.Net.Http;

namespace YaqeenPay.Infrastructure.Services;

public class OutboxDispatcherOptions
{
    public bool Enabled { get; set; } = true;
    public int IntervalSeconds { get; set; } = 5;
    public int BatchSize { get; set; } = 25;
}

public class OutboxDispatcherService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OutboxDispatcherService> _logger;
    private readonly OutboxDispatcherOptions _options;
    

    public OutboxDispatcherService(
        IServiceProvider serviceProvider,
        ILogger<OutboxDispatcherService> logger,
        IOptions<OutboxDispatcherOptions> options)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Outbox dispatcher starting. Enabled={Enabled}, Interval={Interval}s, BatchSize={Batch}",
            _options.Enabled, _options.IntervalSeconds, _options.BatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (_options.Enabled)
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

                    var pending = await db.OutboxMessages
                        .Where(m => !m.Processed)
                        .OrderBy(m => m.OccurredOn)
                        .Take(_options.BatchSize)
                        .ToListAsync(stoppingToken);

                    if (pending.Count > 0)
                    {
                        _logger.LogInformation("Processing {Count} outbox message(s)", pending.Count);
                    }

                    var sp = scope.ServiceProvider;
                    foreach (var msg in pending)
                    {
                        try
                        {
                            switch (msg.Type.ToLowerInvariant())
                            {
                                case "sms":
                                    await ProcessSmsAsync(msg, sp, stoppingToken);
                                    msg.Processed = true;
                                    msg.ProcessedOn = DateTime.UtcNow;
                                    msg.Error = null;
                                    break;
                                case "withdrawalinitiated":
                                case "withdrawalpendingapproval":
                                case "topupconfirmed":
                                    await ProcessNotificationAsync(msg, sp, stoppingToken);
                                    msg.Processed = true;
                                    msg.ProcessedOn = DateTime.UtcNow;
                                    msg.Error = null;
                                    break;
                                default:
                                    // Skip unknown types but mark processed to avoid clogging the queue
                                    _logger.LogWarning("Skipping unsupported outbox type: {Type} (Id={Id})", msg.Type, msg.Id);
                                    msg.Processed = true;
                                    msg.ProcessedOn = DateTime.UtcNow;
                                    msg.Error = "Skipped: unsupported type";
                                    break;
                            }
                        }
                        catch (Exception ex)
                        {
                            msg.Error = ex.Message;
                            _logger.LogError(ex, "Failed processing outbox message {Id} of type {Type}", msg.Id, msg.Type);
                            // leave Processed=false to retry later
                        }
                    }

                    if (pending.Count > 0)
                    {
                        await db.SaveChangesAsync(stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Outbox dispatcher loop error");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(Math.Max(1, _options.IntervalSeconds)), stoppingToken);
            }
            catch (TaskCanceledException) { }
        }

        _logger.LogInformation("Outbox dispatcher stopping.");
    }

    private async Task ProcessNotificationAsync(Domain.Entities.OutboxMessage msg, IServiceProvider sp, CancellationToken ct)
    {
        var payload = JsonSerializer.Deserialize<NotificationPayload>(msg.Payload, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        
        if (payload?.UserId == null)
        {
            throw new InvalidOperationException("Invalid notification payload: UserId is required");
        }

        var db = sp.GetRequiredService<IApplicationDbContext>();
        
        string title, message;
        int notificationType = 7; // Wallet = 7
        
                switch (msg.Type.ToLowerInvariant())
                {
                    case "withdrawalinitiated":
                        title = "Withdrawal Initiated";
                        message = $"Your withdrawal request of {payload.Currency} {payload.Amount:N0} via {payload.Channel} has been initiated.";
                        break;
                    case "withdrawalpendingapproval":
                        title = "Withdrawal Approval Required";
                        message = $"New withdrawal request from {payload.RequesterName}: {payload.Currency} {payload.Amount:N0} via {payload.Channel}";
                        notificationType = 4; // System = 4
                        break;
                    case "withdrawalsettled":
                        title = "Withdrawal Approved";
                        message = $"Your withdrawal of {payload.Currency} {payload.Amount:N0} via {payload.Channel} has been approved and settled.";
                        break;
                    case "withdrawalreversed":
                    case "withdrawalfailed":
                        title = "Withdrawal Failed";
                        message = $"Your withdrawal of {payload.Currency} {payload.Amount:N0} via {payload.Channel} could not be processed. Please check and try again.";
                        break;
                    default:
                        throw new InvalidOperationException($"Unknown notification type: {msg.Type}");
                }

        // Create notification directly using SQL to avoid enum issues
        var dbContext = (Microsoft.EntityFrameworkCore.DbContext)db;
        var now = DateTime.UtcNow;
        var newId = Guid.NewGuid();
        var createdBy = payload.UserId.Value; // Use the user as the creator
        
        // Insert all NOT NULL columns explicitly, including IsActive and CreatedBy.
        // Use proper non-null values for all required fields
        await dbContext.Database.ExecuteSqlRawAsync(
                @"INSERT INTO ""Notifications"" (""Id"", ""UserId"", ""Type"", ""Title"", ""Message"", ""Priority"", ""Status"", ""Metadata"", ""CreatedAt"", ""CreatedBy"", ""IsActive"", ""LastModifiedAt"", ""LastModifiedBy"") 
                    VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12})",
                newId,
                payload.UserId.Value,
                notificationType,
                title,
                message,
                2, // Medium priority
                1, // Unread status
                msg.Payload,
                now,
                createdBy, // CreatedBy = user
                true, // IsActive
                (DateTime?)null, // LastModifiedAt - can be null
                createdBy // LastModifiedBy - use same as CreatedBy since this is initial creation
                );

        _logger.LogInformation("Notification created (Id={NotificationId}) for user {UserId}: {Title}", newId, payload.UserId, title);
    }

    private async Task ProcessSmsAsync(Domain.Entities.OutboxMessage msg, IServiceProvider sp, CancellationToken ct)
    {
        var payload = JsonSerializer.Deserialize<SmsPayload>(msg.Payload, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        if (payload == null)
        {
            throw new InvalidOperationException("Invalid SMS payload (null)");
        }
        var otp = string.IsNullOrWhiteSpace(payload.Code) ? GenerateNumericCode(6) : payload.Code!;
        var smsSender = sp.GetRequiredService<ISmsSender>();
        await smsSender.SendOtpAsync(payload.To ?? string.Empty, otp, payload.Template, ct);
        _logger.LogInformation("SMS dispatched to {To} with OTP {Otp}", payload.To, otp);
    }

    private static string GenerateNumericCode(int length)
    {
        var rng = new Random();
        var code = string.Empty;
        for (int i = 0; i < length; i++) code += rng.Next(0, 10).ToString();
        return code;
    }

    private sealed class NotificationPayload
    {
        public Guid? UserId { get; set; }
        public Guid? WithdrawalId { get; set; }
        public string? RequesterName { get; set; }
        public decimal Amount { get; set; }
        public string? Currency { get; set; }
        public string? Channel { get; set; }
        public DateTime RequestedAt { get; set; }
        public string? Notes { get; set; }
    }

    private sealed class SmsPayload
    {
        public string? To { get; set; }
        public string? Template { get; set; }
        public string? Code { get; set; }
    }
}
