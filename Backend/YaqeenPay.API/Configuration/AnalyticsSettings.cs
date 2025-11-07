using YaqeenPay.Application.Common.Interfaces;

namespace YaqeenPay.API.Configuration;

public class AnalyticsSettings : IAnalyticsSettings
{
    public const string SectionName = "Analytics";
    
    public List<string> ExcludedVisitorIds { get; set; } = new();
}
