using System.Text.Json.Serialization;

namespace TechTorio.Domain.Enums
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