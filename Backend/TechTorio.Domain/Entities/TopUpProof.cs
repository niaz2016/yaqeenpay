using System;
namespace TechTorio.Domain.Entities
{
    public class TopUpProof
    {
        public Guid Id { get; private set; }
        public Guid TopUpId { get; private set; }
        public string FileName { get; private set; } = string.Empty;
        public string FileUrl { get; private set; } = string.Empty;
        public string? Notes { get; private set; }
        public DateTime UploadedAt { get; private set; }

        // Navigation
        public virtual TopUp TopUp { get; private set; } = null!;

        private TopUpProof() { }

        public TopUpProof(Guid topUpId, string fileName, string fileUrl, string? notes = null)
        {
            Id = Guid.NewGuid();
            TopUpId = topUpId;
            FileName = fileName ?? string.Empty;
            FileUrl = fileUrl ?? string.Empty;
            Notes = notes;
            UploadedAt = DateTime.UtcNow;
        }
    }
}
