using TechTorio.Application.Common.Interfaces;

namespace TechTorio.API.Configuration;

public class AnalyticsSettings : IAnalyticsSettings
{
    public const string SectionName = "Analytics";
    
    public List<string> ExcludedVisitorIds { get; set; } = new();
}
