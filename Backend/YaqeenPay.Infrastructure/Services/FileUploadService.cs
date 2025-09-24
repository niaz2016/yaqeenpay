using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using YaqeenPay.Application.Interfaces;

namespace YaqeenPay.Infrastructure.Services;

public class FileUploadService : IFileUploadService
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly string _uploadsPath;
    private readonly string _baseUrl;
    private readonly long _maxFileSize = 5 * 1024 * 1024; // 5MB
    private readonly string[] _allowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

    public FileUploadService(IWebHostEnvironment environment, IConfiguration configuration)
    {
        _environment = environment;
        _configuration = configuration;
        _uploadsPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads");
        _baseUrl = _configuration["BaseUrl"] ?? "https://localhost:7001";
        
        // Ensure uploads directory exists
        Directory.CreateDirectory(_uploadsPath);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
    {
        if (!IsValidImageFile(fileName, fileStream.Length))
            throw new ArgumentException("Invalid image file");

        var folderPath = Path.Combine(_uploadsPath, folder);
        Directory.CreateDirectory(folderPath);

        // Generate unique filename
        var fileExtension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(folderPath, uniqueFileName);

        using var fileStream2 = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(fileStream2, cancellationToken);

        // Return relative path for URL generation
        return Path.Combine(folder, uniqueFileName).Replace('\\', '/');
    }

    public async Task<List<string>> UploadFilesAsync(List<(Stream fileStream, string fileName)> files, string folder, CancellationToken cancellationToken = default)
    {
        var uploadedFiles = new List<string>();

        foreach (var (fileStream, fileName) in files)
        {
            try
            {
                var relativePath = await UploadFileAsync(fileStream, fileName, folder, cancellationToken);
                uploadedFiles.Add(relativePath);
            }
            catch
            {
                // Clean up any successfully uploaded files if one fails
                foreach (var uploadedFile in uploadedFiles)
                {
                    await DeleteFileAsync(uploadedFile, cancellationToken);
                }
                throw;
            }
        }

        return uploadedFiles;
    }

    public async Task<bool> DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var fullPath = Path.Combine(_uploadsPath, relativePath.Replace('/', '\\'));
            if (File.Exists(fullPath))
            {
                await Task.Run(() => File.Delete(fullPath), cancellationToken);
                return true;
            }
            return false;
        }
        catch
        {
            return false;
        }
    }

    public string GetFileUrl(string relativePath)
    {
        return $"{_baseUrl}/uploads/{relativePath}";
    }

    public bool IsValidImageFile(string fileName, long fileSize)
    {
        if (fileSize > _maxFileSize)
            return false;

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return _allowedImageExtensions.Contains(extension);
    }
}