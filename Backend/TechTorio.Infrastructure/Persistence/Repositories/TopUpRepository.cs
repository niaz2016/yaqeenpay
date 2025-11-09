
using Microsoft.EntityFrameworkCore;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;
using TechTorio.Domain.Interfaces;
using TechTorio.Infrastructure.Persistence;

namespace TechTorio.Infrastructure.Persistence.Repositories
{
    public class TopUpRepository : ITopUpRepository
    {
        private readonly ApplicationDbContext _context;

        public TopUpRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TopUp?> GetByIdAsync(Guid id)
        {
            return await _context.TopUps
                .FindAsync(id);
        }
        public async Task<IEnumerable<TopUp>> GetAllAsync(int page = 1, int pageSize = 100)
        {
            return await _context.TopUps
                .OrderByDescending(t => t.RequestedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<TopUp>> GetByUserIdAsync(Guid userId, int page = 1, int pageSize = 20)
        {
            return await _context.TopUps
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.RequestedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<TopUp>> GetByStatusAsync(TopUpStatus status, int page = 1, int pageSize = 20)
        {
            return await _context.TopUps
                .Where(t => t.Status == status)
                .OrderByDescending(t => t.RequestedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<TopUp> CreateAsync(TopUp topUp)
        {
            _context.TopUps.Add(topUp);
            await _context.SaveChangesAsync();
            return topUp;
        }

        public async Task UpdateAsync(TopUp topUp)
        {
            _context.Entry(topUp).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetTopUpCountByUserIdAsync(Guid userId)
        {
            return await _context.TopUps
                .CountAsync(t => t.UserId == userId);
        }

        public async Task<TopUp?> GetByExternalReferenceAsync(string externalReference)
        {
            return await _context.TopUps
                .FirstOrDefaultAsync(t => t.ExternalReference == externalReference);
        }
    }
}