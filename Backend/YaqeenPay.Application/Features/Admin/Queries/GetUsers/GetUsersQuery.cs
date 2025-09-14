using MediatR;
using System.Collections.Generic;

namespace YaqeenPay.Application.Features.Admin.Queries.GetUsers;

public class GetUsersQuery : IRequest<List<UserDto>>
{
}

public class UserDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailConfirmed { get; set; }
    public bool IsActive { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public int ProfileCompleteness { get; set; }
    public List<string> Roles { get; set; } = new();
}
