namespace YaqeenPay.Application.Interfaces;

public interface IFileUploadService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default);
    Task<List<string>> UploadFilesAsync(List<(Stream fileStream, string fileName)> files, string folder, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string filePath, CancellationToken cancellationToken = default);
    string GetFileUrl(string relativePath);
    bool IsValidImageFile(string fileName, long fileSize);
}