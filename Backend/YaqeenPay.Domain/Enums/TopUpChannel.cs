using System.Text.Json.Serialization;

namespace YaqeenPay.Domain.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum TopUpChannel
    {
        JazzCash,
        Easypaisa,
        BankTransfer,
        ManualAdjustment
    }
}