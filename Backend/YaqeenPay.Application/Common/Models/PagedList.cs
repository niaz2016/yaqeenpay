namespace YaqeenPay.Application.Common.Models;

public class PagedList<T>
{
    public List<T> Items { get; set; } = new List<T>();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }

    public PagedList()
    {
    }

    public PagedList(List<T> items, int totalCount, int pageNumber, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        PageNumber = pageNumber;
        PageSize = pageSize;
        TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
    }

    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}