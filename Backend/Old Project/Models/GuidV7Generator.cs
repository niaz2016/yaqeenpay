using System;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.ValueGeneration;

namespace yaqeenpay.Models
{
    /// <summary>
    /// Generates GUID v7 IDs as per draft RFC: https://datatracker.ietf.org/doc/html/draft-peabody-uuid-guid-version-00
    /// GUID v7 uses a timestamp as the first component for chronological ordering
    /// </summary>
    public class GuidV7Generator : ValueGenerator<Guid>
    {
        private static readonly DateTime _epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        
        public override bool GeneratesTemporaryValues => false;

        public override Guid Next(EntityEntry entry)
        {
            return GenerateV7();
        }

        public static Guid GenerateV7()
        {
            // Get milliseconds since Unix epoch
            long milliseconds = (long)(DateTime.UtcNow - _epoch).TotalMilliseconds;
            
            // Convert to byte array with proper byte order (big-endian)
            byte[] timestampBytes = new byte[8];
            timestampBytes[0] = (byte)(milliseconds >> 40);
            timestampBytes[1] = (byte)(milliseconds >> 32);
            timestampBytes[2] = (byte)(milliseconds >> 24);
            timestampBytes[3] = (byte)(milliseconds >> 16);
            timestampBytes[4] = (byte)(milliseconds >> 8);
            timestampBytes[5] = (byte)milliseconds;
            
            // Generate the random bytes for remaining data
            byte[] randomBytes = new byte[10];
            Random.Shared.NextBytes(randomBytes);
            
            // Create the GUID bytes
            byte[] guidBytes = new byte[16];
            
            // First 6 bytes: timestamp
            Buffer.BlockCopy(timestampBytes, 0, guidBytes, 0, 6);
            
            // Byte 6: version 7 (set the 4 most significant bits to 0b0111)
            guidBytes[6] = (byte)((randomBytes[0] & 0x0F) | 0x70);
            
            // Byte 7: variant (set the 2 most significant bits to 0b10)
            guidBytes[7] = (byte)((randomBytes[1] & 0x3F) | 0x80);
            
            // Last 8 bytes: random
            Buffer.BlockCopy(randomBytes, 2, guidBytes, 8, 8);
            
            return new Guid(guidBytes);
        }
    }
}