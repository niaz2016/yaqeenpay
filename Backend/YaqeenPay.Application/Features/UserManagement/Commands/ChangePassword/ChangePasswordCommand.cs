using MediatR;

namespace YaqeenPay.Application.Features.UserManagement.Commands.ChangePassword
{
    public class ChangePasswordCommand : IRequest<bool>
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
