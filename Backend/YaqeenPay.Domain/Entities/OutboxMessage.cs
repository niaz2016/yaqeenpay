using System;

namespace YaqeenPay.Domain.Entities
{
    public class OutboxMessage
    {
        public Guid Id { get; set; }
        public DateTime OccurredOn { get; set; }
        public string Type { get; set; } = string.Empty; // e.g. Email, SMS
        public string Payload { get; set; } = string.Empty; // JSON serialized
        public bool Processed { get; set; }
        public DateTime? ProcessedOn { get; set; }
        public string? Error { get; set; }
        public int RetryCount { get; set; } = 0; // Track number of retry attempts
    }
}