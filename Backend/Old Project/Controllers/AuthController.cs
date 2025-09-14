using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using yaqeenpay.DTOs;
using yaqeenpay.Models;
using yaqeenpay.Services;

namespace yaqeenpay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly JwtService _jwtService;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            JwtService jwtService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse 
                { 
                    Success = false, 
                    Message = "Invalid registration data" 
                });
            }

            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Email is already registered"
                });
            }

            // Create new user with GUID v7
            var user = new ApplicationUser
            {
                Id = GuidV7Generator.GenerateV7(),
                UserName = model.Email,
                Email = model.Email,
                PhoneNumber = model.PhoneNumber,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = string.Join(", ", result.Errors.Select(e => e.Description))
                });
            }

            // Add default buyer role
            await EnsureRoleExists(UserRole.Buyer.ToString());
            await _userManager.AddToRoleAsync(user, UserRole.Buyer.ToString());

            // Generate OTP and send verification email/SMS (not implemented here)
            // SendVerificationOtp(user.Email, "Email");

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Registration successful. Please verify your email/phone."
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid login data"
                });
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            var result = await _signInManager.PasswordSignInAsync(user, model.Password, false, true);
            if (result.Succeeded)
            {
                var jwtResult = await _jwtService.GenerateTokensAsync(user);
                var roles = await _userManager.GetRolesAsync(user);

                return Ok(new AuthResponse
                {
                    Success = true,
                    Message = "Login successful",
                    AccessToken = jwtResult.AccessToken,
                    RefreshToken = jwtResult.RefreshToken.Token,
                    RefreshTokenExpiry = jwtResult.RefreshToken.ExpiresAt,
                    UserId = user.Id.ToString(),
                    Email = user.Email,
                    Roles = roles.ToList()
                });
            }

            if (result.IsLockedOut)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Account locked out. Try again later."
                });
            }

            return Unauthorized(new AuthResponse
            {
                Success = false,
                Message = "Invalid email or password"
            });
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid token data"
                });
            }

            var result = await _jwtService.RefreshTokenAsync(model.AccessToken, model.RefreshToken);
            if (result == null)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid or expired token"
                });
            }

            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(result.AccessToken);
            var userId = jwtToken.Claims.First(c => c.Type == "uid").Value;
            var email = jwtToken.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email).Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "User not found"
                });
            }
            
            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Token refreshed successfully",
                AccessToken = result.AccessToken,
                RefreshToken = result.RefreshToken.Token,
                RefreshTokenExpiry = result.RefreshToken.ExpiresAt,
                UserId = userId,
                Email = email,
                Roles = roles.ToList()
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirstValue("uid");
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var guidUserId))
            {
                return BadRequest(new { Success = false, Message = "Invalid user ID" });
            }

            await _jwtService.RevokeRefreshTokensForUserAsync(guidUserId);
            await _signInManager.SignOutAsync();

            return Ok(new { Success = true, Message = "Logged out successfully" });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid OTP data"
                });
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return NotFound(new AuthResponse
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Verify OTP (in a real app, check against stored OTP)
            bool isOtpValid = true; // Replace with actual OTP validation

            if (!isOtpValid)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid OTP"
                });
            }

            // Mark email or phone as verified
            if (model.Type.Equals("Email", StringComparison.OrdinalIgnoreCase))
            {
                user.EmailVerifiedAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);
            }
            else if (model.Type.Equals("Phone", StringComparison.OrdinalIgnoreCase))
            {
                user.PhoneVerifiedAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);
            }

            return Ok(new AuthResponse
            {
                Success = true,
                Message = $"{model.Type} verified successfully"
            });
        }

        // Helper method to ensure role exists
        private async Task EnsureRoleExists(string roleName)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
            }
        }
    }
}