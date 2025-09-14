using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using YaqeenPay.Application.Common.Interfaces;

namespace YaqeenPay.Infrastructure.Services;

public class LocalDocumentStorageService : IDocumentStorageService
{
    private readonly string _basePath;
    private readonly string _baseUrl;
    private readonly ILogger<LocalDocumentStorageService> _logger;

    public LocalDocumentStorageService(
        IConfiguration configuration,
        ILogger<LocalDocumentStorageService> logger)
    {
        _basePath = configuration["DocumentStorage:BasePath"] ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Documents");
        _baseUrl = configuration["DocumentStorage:BaseUrl"] ?? "/documents";
        _logger = logger;

        // Ensure the directory exists
        if (!Directory.Exists(_basePath))
        {
            Directory.CreateDirectory(_basePath);
        }
    }

    public async Task<string> StoreDocumentAsync(string base64Content, string fileName, Guid userId, string documentType)
    {
        try
        {
            // Sanitize file name
            fileName = SanitizeFileName(fileName);

            // Extract file extension
            var extension = Path.GetExtension(fileName);
            if (string.IsNullOrEmpty(extension))
            {
                extension = ".pdf"; // Default extension
            }

            // Create directories if they don't exist
            var userDirectory = Path.Combine(_basePath, userId.ToString());
            var typeDirectory = Path.Combine(userDirectory, documentType);

            if (!Directory.Exists(userDirectory))
            {
                Directory.CreateDirectory(userDirectory);
            }

            if (!Directory.Exists(typeDirectory))
            {
                Directory.CreateDirectory(typeDirectory);
            }

            // Create a unique file name
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(typeDirectory, uniqueFileName);

            // Convert base64 to bytes and save
            var base64Data = base64Content;
            
            // If the string contains data URI scheme (e.g., "data:image/png;base64,"), remove it
            if (base64Data.Contains(","))
            {
                base64Data = base64Data.Split(',')[1];
            }
            
            var bytes = Convert.FromBase64String(base64Data);
            await File.WriteAllBytesAsync(filePath, bytes);

            // Return the relative path
            return GetDocumentUrl(Path.Combine(userId.ToString(), documentType, uniqueFileName));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error storing document");
            throw new InvalidOperationException("Failed to store document", ex);
        }
    }

    public async Task<bool> DeleteDocumentAsync(string documentUrl)
    {
        try
        {
            var relativePath = documentUrl.Replace(_baseUrl, "").TrimStart('/');
            var fullPath = Path.Combine(_basePath, relativePath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document");
            return false;
        }
    }

    public string GetDocumentUrl(string documentPath)
    {
        return $"{_baseUrl}/{documentPath.Replace("\\", "/")}";
    }

    private string SanitizeFileName(string fileName)
    {
        // Replace invalid characters with underscore
        var invalidChars = Regex.Escape(new string(Path.GetInvalidFileNameChars()));
        var invalidCharsPattern = $"[{invalidChars}]";
        
        return Regex.Replace(fileName, invalidCharsPattern, "_");
    }
}