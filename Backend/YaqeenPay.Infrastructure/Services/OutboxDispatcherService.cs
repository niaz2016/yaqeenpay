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

    private sealed class SmsPayload
    {
        public string? To { get; set; }
        public string? Template { get; set; }
        public string? Code { get; set; }
    }
}
