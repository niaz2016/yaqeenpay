namespace YaqeenPay.Domain.Enums
{
    public enum TransactionType
    {
        Credit,
        Debit,
        TopUp,
        Refund,
        Payment,
        Withdrawal,
        Freeze,
        Unfreeze,
        FrozenToDebit
    }
}