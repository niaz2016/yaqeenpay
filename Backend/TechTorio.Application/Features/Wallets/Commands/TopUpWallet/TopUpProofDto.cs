using System;

namespace TechTorio.Application.Features.Wallets.Commands.TopUpWallet
{
    public class TopUpProofDto
    {
        public Guid TopUpId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
    public string? Notes { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
