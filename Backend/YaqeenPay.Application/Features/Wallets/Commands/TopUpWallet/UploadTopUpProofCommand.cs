using MediatR;

namespace YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet
{
    public class UploadTopUpProofCommand : IRequest<TopUpProofDto>
    {
        public Guid TopUpId { get; set; }
        public Stream FileStream { get; set; } = Stream.Null;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }
}
