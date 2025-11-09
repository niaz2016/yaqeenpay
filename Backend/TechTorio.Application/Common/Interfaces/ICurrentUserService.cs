namespace TechTorio.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid UserId { get; }
    string? IpAddress { get; }
    string? UserAgent { get; }
    bool IsInRole(string role);
}