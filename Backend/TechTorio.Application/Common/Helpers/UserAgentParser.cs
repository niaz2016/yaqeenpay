namespace TechTorio.Application.Common.Helpers;

public static class UserAgentParser
{
    public static (string DeviceType, string Browser, string OS) Parse(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return ("Unknown", "Unknown", "Unknown");
        }

        var ua = userAgent.ToLowerInvariant();
        
        return (
            GetDeviceType(ua),
            GetBrowser(ua),
            GetOperatingSystem(ua)
        );
    }

    private static string GetDeviceType(string ua)
    {
        // Check for mobile devices
        if (ua.Contains("mobile") || ua.Contains("android") || ua.Contains("iphone") || 
            ua.Contains("ipod") || ua.Contains("blackberry") || ua.Contains("windows phone"))
        {
            return "Mobile";
        }

        // Check for tablets
        if (ua.Contains("tablet") || ua.Contains("ipad"))
        {
            return "Tablet";
        }

        return "Desktop";
    }

    private static string GetBrowser(string ua)
    {
        // Order matters - check specific browsers before generic ones
        if (ua.Contains("edg/") || ua.Contains("edge"))
            return "Edge";
        
        if (ua.Contains("opr/") || ua.Contains("opera"))
            return "Opera";
        
        if (ua.Contains("chrome") && !ua.Contains("edg"))
            return "Chrome";
        
        if (ua.Contains("safari") && !ua.Contains("chrome"))
            return "Safari";
        
        if (ua.Contains("firefox"))
            return "Firefox";
        
        if (ua.Contains("msie") || ua.Contains("trident"))
            return "Internet Explorer";

        return "Other";
    }

    private static string GetOperatingSystem(string ua)
    {
        if (ua.Contains("windows nt 10.0"))
            return "Windows 10/11";
        
        if (ua.Contains("windows nt 6.3"))
            return "Windows 8.1";
        
        if (ua.Contains("windows nt 6.2"))
            return "Windows 8";
        
        if (ua.Contains("windows nt 6.1"))
            return "Windows 7";
        
        if (ua.Contains("windows"))
            return "Windows";
        
        if (ua.Contains("mac os x") || ua.Contains("macos"))
            return "macOS";
        
        if (ua.Contains("iphone") || ua.Contains("ipad") || ua.Contains("ipod"))
            return "iOS";
        
        if (ua.Contains("android"))
            return "Android";
        
        if (ua.Contains("linux"))
            return "Linux";

        return "Other";
    }
}
