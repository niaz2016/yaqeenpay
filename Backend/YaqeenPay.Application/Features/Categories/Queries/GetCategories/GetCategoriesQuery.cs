using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Categories.Queries.GetCategories;

public record GetCategoriesQuery : IRequest<ApiResponse<List<CategoryTreeDto>>>
{
    public bool IncludeInactive { get; set; } = false;
}

public record CategoryTreeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int ProductCount { get; set; }
    public List<CategoryTreeDto> SubCategories { get; set; } = new List<CategoryTreeDto>();
}

public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, ApiResponse<List<CategoryTreeDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetCategoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<CategoryTreeDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Categories
            .Include(c => c.SubCategories)
            .AsNoTracking() // Read-only query
            .AsQueryable();

        if (!request.IncludeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        var categories = await query
            .Select(c => new CategoryTreeDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                ParentCategoryId = c.ParentCategoryId,
                SortOrder = c.SortOrder,
                IsActive = c.IsActive,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync(cancellationToken);

        // Build the tree structure
        var rootCategories = categories
            .Where(c => c.ParentCategoryId == null)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToList();

        foreach (var rootCategory in rootCategories)
        {
            BuildCategoryTree(rootCategory, categories);
        }

        return ApiResponse<List<CategoryTreeDto>>.SuccessResponse(rootCategories);
    }

    private void BuildCategoryTree(CategoryTreeDto parent, List<CategoryTreeDto> allCategories)
    {
        parent.SubCategories = allCategories
            .Where(c => c.ParentCategoryId == parent.Id)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToList();

        foreach (var subCategory in parent.SubCategories)
        {
            BuildCategoryTree(subCategory, allCategories);
        }
    }
}