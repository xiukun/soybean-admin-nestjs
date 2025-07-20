-- Create casbin_rule table if it doesn't exist
CREATE TABLE IF NOT EXISTS "casbin_rule" (
    "id" SERIAL NOT NULL,
    "ptype" TEXT NOT NULL,
    "v0" TEXT,
    "v1" TEXT,
    "v2" TEXT,
    "v3" TEXT,
    "v4" TEXT,
    "v5" TEXT,
    CONSTRAINT "casbin_rule_pkey" PRIMARY KEY ("id")
);

-- Insert some basic permissions if the table is empty
INSERT INTO "casbin_rule" ("ptype", "v0", "v1", "v2") 
SELECT 'p', 'admin', '*', '*'
WHERE NOT EXISTS (SELECT 1 FROM "casbin_rule" WHERE "ptype" = 'p' AND "v0" = 'admin');

INSERT INTO "casbin_rule" ("ptype", "v0", "v1", "v2") 
SELECT 'p', 'user', '/api/v1/auth/profile', 'GET'
WHERE NOT EXISTS (SELECT 1 FROM "casbin_rule" WHERE "ptype" = 'p' AND "v0" = 'user' AND "v1" = '/api/v1/auth/profile');
