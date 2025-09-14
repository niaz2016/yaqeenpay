using System;
using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities
{
    public enum WithdrawalChannel
    {
        JazzCash,
        Easypaisa,
        BankTransfer
    }

    public enum WithdrawalStatus
    {
        Initiated,
        PendingProvider,
        Settled,
        Failed,
        Reversed
    }

    public class Withdrawal : AuditableEntity
    {
        public Guid SellerId { get; private set; }
        public Money Amount { get; private set; } = null!;
        public WithdrawalChannel Channel { get; private set; }
        public string? ChannelReference { get; private set; }
        public string Reference { get; private set; } = string.Empty; // User-friendly reference like 1/2xxxxx
        public WithdrawalStatus Status { get; private set; }
        public DateTime RequestedAt { get; private set; }
        public DateTime? SettledAt { get; private set; }
        public DateTime? FailedAt { get; private set; }
        public string? FailureReason { get; private set; }

        private Withdrawal() { } // For EF Core

        public Withdrawal(Guid sellerId, Money amount, WithdrawalChannel channel)
        {
            if (amount.Amount <= 0)
                throw new ArgumentException("Withdrawal amount must be positive", nameof(amount));

            SellerId = sellerId;
            Amount = amount;
            Channel = channel;
            Status = WithdrawalStatus.Initiated;
            RequestedAt = DateTime.UtcNow;
            Reference = $"2{DateTime.UtcNow.Ticks}"; //2 for withdraw Generate user-friendly reference
        }

        public void SetPendingProvider(string? channelReference = null)
        {
            if (Status != WithdrawalStatus.Initiated)
                throw new InvalidOperationException($"Cannot set withdrawal to pending in status {Status}");

            Status = WithdrawalStatus.PendingProvider;
            ChannelReference = channelReference;
        }

        public void SetSettled(string channelReference)
        {
            if (Status != WithdrawalStatus.PendingProvider)
                throw new InvalidOperationException($"Cannot set withdrawal to settled in status {Status}");

            Status = WithdrawalStatus.Settled;
            ChannelReference = channelReference;
            SettledAt = DateTime.UtcNow;
        }

        public void SetFailed(string reason)
        {
            if (Status != WithdrawalStatus.Initiated && Status != WithdrawalStatus.PendingProvider)
                throw new InvalidOperationException($"Cannot set withdrawal to failed in status {Status}");

            Status = WithdrawalStatus.Failed;
            FailureReason = reason;
            FailedAt = DateTime.UtcNow;
        }

        public void SetReversed(string reason)
        {
            if (Status != WithdrawalStatus.PendingProvider)
                throw new InvalidOperationException($"Cannot reverse withdrawal in status {Status}");

            Status = WithdrawalStatus.Reversed;
            FailureReason = reason;
            FailedAt = DateTime.UtcNow;
        }
    }
}