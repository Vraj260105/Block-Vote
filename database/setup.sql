-- Blockchain Voting System Database Setup
-- Create database and user for the voting system

-- Create the database
CREATE DATABASE IF NOT EXISTS blockchain_voting;

-- Use the database
USE blockchain_voting;

-- Create a user for the application (you can change the password)
CREATE USER IF NOT EXISTS 'voting_user'@'localhost' IDENTIFIED BY 'voting_password123';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON blockchain_voting.* TO 'voting_user'@'localhost';

-- Flush privileges to ensure they take effect
FLUSH PRIVILEGES;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'election_admin', 'voter') DEFAULT 'voter',
    walletAddress VARCHAR(255) DEFAULT NULL,
    isVerified BOOLEAN DEFAULT FALSE,
    isActive BOOLEAN DEFAULT TRUE,
    lastLogin TIMESTAMP NULL DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_wallet (walletAddress),
    INDEX idx_role (role)
);

-- OTP codes table for email verification and login
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type ENUM('registration', 'login', 'password_reset') NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    isUsed BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_type (email, type),
    INDEX idx_code (code),
    INDEX idx_expires (expiresAt)
);

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    startDate TIMESTAMP NOT NULL,
    endDate TIMESTAMP NOT NULL,
    isActive BOOLEAN DEFAULT FALSE,
    contractAddress VARCHAR(255) DEFAULT NULL,
    createdBy INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_active (isActive),
    INDEX idx_dates (startDate, endDate),
    INDEX idx_contract (contractAddress)
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    electionId INT NOT NULL,
    blockchainId INT DEFAULT NULL, -- ID from the smart contract
    imageUrl VARCHAR(500) DEFAULT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (electionId) REFERENCES elections(id) ON DELETE CASCADE,
    INDEX idx_election (electionId),
    INDEX idx_blockchain (blockchainId),
    INDEX idx_active (isActive)
);

-- Votes table (for tracking and audit purposes)
CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    electionId INT NOT NULL,
    candidateId INT NOT NULL,
    transactionHash VARCHAR(255) NOT NULL,
    blockNumber BIGINT DEFAULT NULL,
    votedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (electionId) REFERENCES elections(id) ON DELETE CASCADE,
    FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_election (userId, electionId), -- One vote per user per election
    INDEX idx_election (electionId),
    INDEX idx_candidate (candidateId),
    INDEX idx_transaction (transactionHash),
    INDEX idx_user (userId)
);

-- Voter registrations (blockchain voter registration tracking)
CREATE TABLE IF NOT EXISTS voter_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    walletAddress VARCHAR(255) NOT NULL,
    transactionHash VARCHAR(255) NOT NULL,
    blockNumber BIGINT DEFAULT NULL,
    isRegistered BOOLEAN DEFAULT TRUE,
    registeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_wallet (userId, walletAddress),
    INDEX idx_wallet (walletAddress),
    INDEX idx_transaction (transactionHash),
    INDEX idx_registered (isRegistered)
);

-- Audit log table for tracking important actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entityType VARCHAR(50) NOT NULL, -- 'user', 'election', 'vote', etc.
    entityId INT DEFAULT NULL,
    oldValues JSON DEFAULT NULL,
    newValues JSON DEFAULT NULL,
    ipAddress VARCHAR(45) DEFAULT NULL,
    userAgent TEXT DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (userId),
    INDEX idx_action (action),
    INDEX idx_entity (entityType, entityId),
    INDEX idx_created (createdAt)
);

-- Session tokens table for JWT token blacklisting
CREATE TABLE IF NOT EXISTS token_blacklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jti VARCHAR(255) NOT NULL UNIQUE, -- JWT ID
    userId INT NOT NULL,
    tokenType ENUM('access', 'refresh') NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    blacklistedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_jti (jti),
    INDEX idx_user (userId),
    INDEX idx_expires (expiresAt)
);

-- Insert default admin user (password: Admin123!)
-- Password hash for 'Admin123!' using bcrypt with salt rounds 12
INSERT IGNORE INTO users (
    email, 
    password, 
    firstName, 
    lastName, 
    role, 
    isVerified, 
    isActive
) VALUES (
    'admin@votingsystem.com',
    '$2b$12$LQv3c1yqBOFcXqvEWrHUnOulaGq6BdgL7.jZcKKkOWXSIzI5qTQD2', -- Admin123!
    'System',
    'Administrator',
    'super_admin',
    TRUE,
    TRUE
);

-- Show created tables
SHOW TABLES;

-- Show the admin user that was created
SELECT id, email, firstName, lastName, role, isVerified, isActive, createdAt 
FROM users 
WHERE email = 'admin@votingsystem.com';

-- Database setup completed successfully!
-- Database: blockchain_voting
-- User: voting_user
-- Password: voting_password123
-- Admin User: admin@votingsystem.com / Admin123!

SELECT 'Database setup completed successfully!' as message;
SELECT 'Database: blockchain_voting' as database_info;
SELECT 'User: voting_user' as user_info;
SELECT 'Password: voting_password123' as password_info;
SELECT 'Admin User: admin@votingsystem.com / Admin123!' as admin_info;
