-- Create demo_users table for amis-lowcode-backend
CREATE TABLE IF NOT EXISTS demo_users (
    tenant_id VARCHAR(255),
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(255),
    avatar VARCHAR(255),
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create demo_roles table for amis-lowcode-backend
CREATE TABLE IF NOT EXISTS demo_roles (
    tenant_id VARCHAR(255),
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Insert demo data
INSERT INTO demo_users (id, username, email, password, nickname, status, created_by, updated_by) VALUES
('admin-001', 'admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'ACTIVE', 'system', 'system'),
('user-001', 'demo', 'demo@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo User', 'ACTIVE', 'system', 'system')
ON CONFLICT (id) DO NOTHING;

INSERT INTO demo_roles (id, name, code, description, status, created_by, updated_by) VALUES
('role-admin', 'Administrator', 'ADMIN', 'System administrator with full access', 'ACTIVE', 'system', 'system'),
('role-user', 'User', 'USER', 'Regular user with limited access', 'ACTIVE', 'system', 'system'),
('role-guest', 'Guest', 'GUEST', 'Guest user with read-only access', 'ACTIVE', 'system', 'system')
ON CONFLICT (code) DO NOTHING;
