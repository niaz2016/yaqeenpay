using System;

namespace YaqeenPay.Domain.ValueObjects
{
    public sealed class Money : IEquatable<Money>
    {
        public decimal Amount { get; private set; }
        public string Currency { get; private set; } = string.Empty;
        public decimal Value => Amount; // Alias for Amount to maintain compatibility

        private Money() 
        { 
            // For EF Core - initialize with safe default values
            Amount = 0m;
            Currency = "PKR";
        }

        public Money(decimal amount, string currency)
        {
            if (string.IsNullOrWhiteSpace(currency))
                currency = "PKR"; // Default to PKR if currency is not provided

            Amount = amount;
            Currency = currency.ToUpperInvariant();
        }

        public static Money Create(decimal amount, string currency)
        {
            return new Money(amount, currency);
        }

        public static Money Zero(string currency)
        {
            return new Money(0, currency);
        }

        public static Money operator +(Money left, Money right)
        {
            EnsureSameCurrency(left, right);
            return new Money(left.Amount + right.Amount, left.Currency);
        }

        public static Money operator -(Money left, Money right)
        {
            EnsureSameCurrency(left, right);
            return new Money(left.Amount - right.Amount, left.Currency);
        }

        public static Money operator *(Money money, decimal multiplier)
        {
            return new Money(money.Amount * multiplier, money.Currency);
        }

        public static Money operator /(Money money, decimal divisor)
        {
            if (divisor == 0)
                throw new DivideByZeroException();
            
            return new Money(money.Amount / divisor, money.Currency);
        }

        public static bool operator ==(Money? left, Money? right)
        {
            if (left is null && right is null)
                return true;
            if (left is null || right is null)
                return false;
            
            return left.Equals(right);
        }

        public static bool operator !=(Money? left, Money? right)
        {
            return !(left == right);
        }

        public override bool Equals(object? obj)
        {
            return obj is Money money && Equals(money);
        }

        public bool Equals(Money? other)
        {
            if (other is null)
                return false;
            
            return Currency == other.Currency && Amount == other.Amount;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Amount, Currency);
        }

        public override string ToString()
        {
            return $"{Amount} {Currency}";
        }

        private static void EnsureSameCurrency(Money left, Money right)
        {
            if (left.Currency != right.Currency)
                throw new InvalidOperationException($"Cannot operate on money with different currencies ({left.Currency} vs {right.Currency})");
        }

        // Add method to check if this Money instance is different from another (useful for change tracking)
        public bool HasChangedFrom(Money? other)
        {
            return !Equals(other);
        }
    }
}