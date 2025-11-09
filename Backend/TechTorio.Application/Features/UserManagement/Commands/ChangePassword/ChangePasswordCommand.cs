using MediatR;

namespace TechTorio.Application.Features.UserManagement.Commands.ChangePassword
{
    public class ChangePasswordCommand : IRequest<bool>
    {
        public string? CurrentPassword { get; set; } // Nullable for OAuth users setting password for first time
        public string NewPassword { get; set; } = string.Empty;
    }
}
