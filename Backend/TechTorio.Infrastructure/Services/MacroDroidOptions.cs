namespace TechTorio.Infrastructure.Services;

public class MacroDroidOptions
{
    // Base URL for MacroDroid trigger endpoint
    public string BaseUrl { get; set; } = "https://trigger.macrodroid.com";     //https://trigger.macrodroid.com/23e98a30-fb07-4892-a435-4b65b0b1a4a2/f3@7$e&6hj3ab
    // The unique trigger key provided by MacroDroid
    public string Key { get; set; } = "23e98a30-fb07-4892-a435-4b65b0b1a4a2";
    // The action name (path segment) as configured in MacroDroid
    public string Action { get; set; } = "send-otp";
    // Query parameter names (defaults per provided link)
    public string OtpParamName { get; set; } = "varOTP";
    public string ReceiverParamName { get; set; } = "receiver";
}