namespace TechTorio.Application.Common.Interfaces;

public interface IDocumentStorageService
{
    Task<string> StoreDocumentAsync(string base64Content, string fileName, Guid userId, string documentType);
    Task<bool> DeleteDocumentAsync(string documentUrl);
    string GetDocumentUrl(string documentPath);
}