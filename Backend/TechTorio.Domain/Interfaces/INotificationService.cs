using System.Threading.Tasks;

namespace TechTorio.Domain.Interfaces
{
    public interface INotificationService
    {
        Task SendSmsAsync(string phoneNumber, string message);
        Task SendPushNotificationAsync(string userId, string title, string message, object? data = null);
    }
}