#!/bin/bash

echo "Fixing casbin_rule table..."

# Create the casbin_rule table
docker exec soybean-admin-nestjs-postgres-1 psql -U soybean -d soybean-admin-nest-backend -c "
CREATE TABLE IF NOT EXISTS casbin_rule (
    id SERIAL PRIMARY KEY,
    ptype VARCHAR(100) NOT NULL,
    v0 VARCHAR(100),
    v1 VARCHAR(100),
    v2 VARCHAR(100),
    v3 VARCHAR(100),
    v4 VARCHAR(100),
    v5 VARCHAR(100)
);
"

echo "Table created. Inserting basic permissions..."

# Insert basic permissions
docker exec soybean-admin-nestjs-postgres-1 psql -U soybean -d soybean-admin-nest-backend -c "
INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES ('p', 'admin', '*', '*') ON CONFLICT DO NOTHING;
INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES ('p', 'user', '/api/v1/auth/profile', 'GET') ON CONFLICT DO NOTHING;
"

echo "Restarting backend container..."
docker restart soybean-admin-nestjs-backend-1

echo "Done!"
