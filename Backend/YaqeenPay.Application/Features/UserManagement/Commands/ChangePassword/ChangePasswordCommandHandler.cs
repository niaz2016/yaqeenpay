using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Identity;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Application.Features.UserManagement.Commands.ChangePassword
{
    public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly IIdentityService _identityService;
        private readonly UserManager<ApplicationUser> _userManager;

        public ChangePasswordCommandHandler(
            ICurrentUserService currentUserService, 
            IIdentityService identityService,
            UserManager<ApplicationUser> userManager)
        {
            _currentUserService = currentUserService;
            _identityService = identityService;
            _userManager = userManager;
        }

        public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;
            var user = await _userManager.FindByIdAsync(userId.ToString());
            
            if (user == null)
                return false;

            IdentityResult result;

            // Check if user has a password (OAuth users might not have one)
            var hasPassword = !string.IsNullOrEmpty(user.PasswordHash);

            if (!hasPassword)
            {
                // User doesn't have a password yet (OAuth login) - set initial password
                result = await _identityService.SetPasswordAsync(userId, request.NewPassword);
            }
            else
            {
                // User has a password - change it (requires current password)
                if (string.IsNullOrEmpty(request.CurrentPassword))
                {
                    // Current password is required when user already has a password
                    return false;
                }
                result = await _identityService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            }

            return result.Succeeded;
        }
    }
}
