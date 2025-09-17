using MediatR;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet
{
    public class UploadTopUpProofCommandHandler : IRequestHandler<UploadTopUpProofCommand, TopUpProofDto>
    {
        private readonly IApplicationDbContext _db;
        private readonly ILogger<UploadTopUpProofCommandHandler> _logger;

        public UploadTopUpProofCommandHandler(IApplicationDbContext db, ILogger<UploadTopUpProofCommandHandler> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<TopUpProofDto> Handle(UploadTopUpProofCommand request, CancellationToken cancellationToken)
        {
            // Validate top-up exists
            var topUp = await _db.TopUps.FindAsync(new object[] { request.TopUpId }, cancellationToken);
            if (topUp == null)
                throw new InvalidOperationException($"Top-up not found: {request.TopUpId}");

            // Create entity and persist (controller already saved file and provided FileUrl)
            var fileUrl = request.FileUrl ?? string.Empty;
            var fileName = request.FileName ?? string.Empty;

            var proof = new TopUpProof(request.TopUpId, fileName, fileUrl, request.Notes ?? string.Empty);
            _db.TopUpProofs.Add(proof);
            await _db.SaveChangesAsync(cancellationToken);

            return new TopUpProofDto
            {
                TopUpId = proof.TopUpId,
                FileName = proof.FileName,
                FileUrl = proof.FileUrl,
                Notes = proof.Notes,
                UploadedAt = proof.UploadedAt
            };
        }
    }
}
