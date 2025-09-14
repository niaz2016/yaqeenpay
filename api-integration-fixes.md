# YaqeenPay API Integration Fixes

## Current Issues

1. **Missing Endpoints**: The frontend is calling endpoints that don't exist in the backend:
   - GET `/api/auth/me` - should be GET `/api/profile`
   - POST `/api/profile/change-password` - endpoint doesn't exist

2. **Field Name Mismatches**: The User interface in the frontend doesn't match the UserProfileDto from the backend.

## Solutions

### Frontend Changes (Already Implemented)

1. ✅ Updated the User interface to match the backend UserProfileDto.
2. ✅ Added a mapping function in `authService.getCurrentUser()` to convert backend field names to frontend field names.
3. ✅ Redirected `/auth/me` calls to use `/profile` instead.

### Backend Changes Needed

The backend needs to implement the following endpoint:

```csharp
// In ProfileController.cs
[HttpPost("change-password")]
public async Task<IActionResult> ChangePassword(ChangePasswordCommand command)
{
    return Ok(await Mediator.Send(command));
}
```

### Next Steps

1. Either implement the missing endpoints in the backend, or
2. Update the frontend to use the endpoints that actually exist

#### Option 1: Implement Change Password Endpoint in the Backend

Create the following files:

```csharp
// YaqeenPay.Application/Features/UserManagement/Commands/ChangePassword/ChangePasswordCommand.cs
using MediatR;

namespace YaqeenPay.Application.Features.UserManagement.Commands.ChangePassword;

public class ChangePasswordCommand : IRequest<bool>
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
```

```csharp
// YaqeenPay.Application/Features/UserManagement/Commands/ChangePassword/ChangePasswordCommandHandler.cs
using MediatR;
using Microsoft.AspNetCore.Identity;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Application.Features.UserManagement.Commands.ChangePassword;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;

    public ChangePasswordCommandHandler(
        UserManager<ApplicationUser> userManager,
        ICurrentUserService currentUserService)
    {
        _userManager = userManager;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return true;
    }
}
```

Then add this to the ProfileController:

```csharp
[HttpPost("change-password")]
public async Task<IActionResult> ChangePassword(ChangePasswordCommand command)
{
    return Ok(new { success = await Mediator.Send(command) });
}
```

#### Option 2: Update Frontend to Use Existing Backend Endpoints

If the backend already has some way to change passwords but with a different endpoint structure, update the frontend to match it.

## For Testing

After making these changes, you should be able to:
1. Log in successfully
2. Get the user profile data from the correct endpoint
3. Change password using the new endpoint