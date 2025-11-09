using MediatR;

namespace TechTorio.Application.Features.Wallets.Commands.TopUpWallet
{
    public class UploadTopUpProofCommand : IRequest<TopUpProofDto>
    {
        public Guid TopUpId { get; set; }
        // FileUrl should be a public-accessible URL (e.g. /uploads/....) written by the API controller
        public string FileUrl { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }
}
