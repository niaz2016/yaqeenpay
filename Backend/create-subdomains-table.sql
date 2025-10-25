-- Create Subdomains table
CREATE TABLE IF NOT EXISTS "Subdomains" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(63) NOT NULL UNIQUE,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "ApplicantEmail" VARCHAR(255),
    "ApplicantName" VARCHAR(255),
    "Purpose" TEXT,
    "ContactPhone" VARCHAR(20),
    "RequestedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ApprovedAt" TIMESTAMP,
    "ApprovedBy" VARCHAR(255),
    "RejectionReason" TEXT,
    "Notes" TEXT,
    "IsActive" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "LastModifiedAt" TIMESTAMP,
    "LastModifiedBy" VARCHAR(255)
);

-- Create index on Name for faster lookups
CREATE INDEX IF NOT EXISTS "IX_Subdomains_Name" ON "Subdomains" ("Name");

-- Create index on Status for filtering
CREATE INDEX IF NOT EXISTS "IX_Subdomains_Status" ON "Subdomains" ("Status");

-- Insert some reserved subdomains to prevent registration
INSERT INTO "Subdomains" ("Name", "Status", "IsActive", "ApprovedBy", "Notes", "CreatedAt")
VALUES 
    ('www', 'Reserved', FALSE, 'System', 'Reserved for WWW subdomain', CURRENT_TIMESTAMP),
    ('mail', 'Reserved', FALSE, 'System', 'Reserved for email services', CURRENT_TIMESTAMP),
    ('ftp', 'Reserved', FALSE, 'System', 'Reserved for FTP services', CURRENT_TIMESTAMP),
    ('admin', 'Reserved', FALSE, 'System', 'Reserved for administration', CURRENT_TIMESTAMP),
    ('api', 'Reserved', FALSE, 'System', 'Reserved for API services', CURRENT_TIMESTAMP),
    ('app', 'Reserved', FALSE, 'System', 'Reserved for applications', CURRENT_TIMESTAMP),
    ('yaqeenpay', 'Active', TRUE, 'System', 'YaqeenPay platform', CURRENT_TIMESTAMP),
    ('status', 'Active', TRUE, 'System', 'Status monitoring', CURRENT_TIMESTAMP)
ON CONFLICT ("Name") DO NOTHING;

-- Verify table creation
SELECT COUNT(*) as total_subdomains FROM "Subdomains";
