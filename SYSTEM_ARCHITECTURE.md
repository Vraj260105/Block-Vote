# System Architecture - Full-Stack Blockchain Voting Platform

## Overview
Transform the existing simple blockchain voting app into a secure, production-ready multi-election platform with backend authentication, data persistence, and role-based access control.

## Architecture Components

### 1. Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with modern UI components
- **State Management**: React Context + useReducer for global state
- **Routing**: React Router v6 with protected routes
- **Authentication**: JWT token management with automatic refresh
- **Web3 Integration**: Maintained for blockchain interactions

### 2. Backend (Node.js + Express)
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT + Email OTP (2FA)
- **Database**: MySQL with Sequelize ORM
- **Security**: Helmet, CORS, Rate Limiting, Input Validation
- **Email Service**: Nodemailer for OTP delivery
- **File Structure**: MVC pattern with middleware, controllers, services

### 3. Database Schema (MySQL)
- **Users**: Authentication, roles, profile information
- **OTP**: Temporary storage for email verification
- **Audit_logs**: Stores all the logs generated

### 4. Smart Contract (Updated)
- **Multi-Election Support**: Separate contract instances or election mapping
- **Access Control**: Admin roles and permissions
- **Event Logging**: Enhanced events for backend synchronization

### 5. Security Architecture
- **RBAC**: Role-based access (Super Admin, Election Admin, Voter)
- **2FA**: Email OTP for all authentication
- **JWT**: Secure token management with refresh tokens
- **Encryption**: Sensitive data encryption at rest

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'election_admin', 'voter') DEFAULT 'voter',
    wallet_address VARCHAR(42),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Elections Table
```sql
CREATE TABLE elections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
    contract_address VARCHAR(42),
    created_by INT,
    voter_eligibility TEXT, -- JSON rules for voter eligibility
    settings JSON, -- Election-specific settings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Candidates Table
```sql
CREATE TABLE candidates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    election_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    position_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
);
```

### Votes Table
```sql
CREATE TABLE votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    election_id INT NOT NULL,
    candidate_id INT NOT NULL,
    voter_id INT NOT NULL,
    transaction_hash VARCHAR(66), -- Blockchain transaction hash
    block_number BIGINT,
    gas_used INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    UNIQUE KEY unique_vote_per_election (election_id, voter_id),
    FOREIGN KEY (election_id) REFERENCES elections(id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (voter_id) REFERENCES users(id)
);
```

### OTP Codes Table
```sql
CREATE TABLE otp_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type ENUM('registration', 'login', 'password_reset') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_type (email, type),
    INDEX idx_expires_at (expires_at)
);
```

### Election Permissions Table (RBAC)
```sql
CREATE TABLE election_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    election_id INT NOT NULL,
    permission ENUM('admin', 'monitor', 'vote') NOT NULL,
    granted_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_election (user_id, election_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (election_id) REFERENCES elections(id),
    FOREIGN KEY (granted_by) REFERENCES users(id)
);
```

## API Structure

### Authentication Routes
- `POST /api/auth/register` - Register with email verification
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/login` - Login with email/password + OTP
- `POST /api/auth/verify-login` - Verify login OTP
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password with OTP

### Election Management Routes
- `GET /api/elections` - List elections (filtered by user role)
- `POST /api/elections` - Create election (admin only)
- `GET /api/elections/:id` - Get election details
- `PUT /api/elections/:id` - Update election (admin only)
- `DELETE /api/elections/:id` - Delete election (admin only)
- `POST /api/elections/:id/deploy` - Deploy to blockchain
- `POST /api/elections/:id/start` - Start election
- `POST /api/elections/:id/end` - End election

### Candidate Management Routes
- `GET /api/elections/:id/candidates` - List candidates
- `POST /api/elections/:id/candidates` - Add candidate (admin only)
- `PUT /api/candidates/:id` - Update candidate (admin only)
- `DELETE /api/candidates/:id` - Delete candidate (admin only)

### Voting Routes
- `POST /api/elections/:id/vote` - Cast vote
- `GET /api/elections/:id/results` - Get election results
- `GET /api/votes/history` - User's voting history

### User Management Routes
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/admin/users` - List users (admin only)
- `PUT /api/admin/users/:id/role` - Change user role (super admin only)

## Security Considerations

### Authentication Security
- **Password Hashing**: bcrypt with salt rounds ≥ 12
- **JWT Security**: Short-lived access tokens (15 min) + refresh tokens (7 days)
- **OTP Security**: 6-digit codes, 5-minute expiry, single use
- **Rate Limiting**: Login attempts, OTP requests, API calls

### Data Protection
- **Input Validation**: Joi validation for all API inputs
- **SQL Injection**: Sequelize ORM prevents SQL injection
- **XSS Protection**: Helmet middleware + input sanitization
- **CORS**: Configured for specific frontend domain only

### Blockchain Security
- **Transaction Verification**: All votes verified on blockchain
- **Immutable Audit Trail**: Blockchain provides tamper-proof record
- **Smart Contract Security**: Multi-sig for admin functions

## Technology Stack

### Backend Dependencies
- **Core**: express, typescript, nodemon
- **Database**: mysql2, sequelize, sequelize-cli
- **Authentication**: jsonwebtoken, bcryptjs
- **Email**: nodemailer
- **Security**: helmet, cors, express-rate-limit, joi
- **Blockchain**: web3, truffle
- **Testing**: jest, supertest

### Frontend Dependencies (Additional)
- **Routing**: react-router-dom
- **State**: @reduxjs/toolkit (if needed for complex state)
- **Forms**: formik + yup
- **UI**: @headlessui/react, @heroicons/react
- **HTTP**: axios
- **Notifications**: react-hot-toast

## Implementation Phases

### Phase 1: Backend Foundation
1. Set up Express server with TypeScript
2. Configure MySQL database and Sequelize
3. Implement user authentication with JWT + OTP
4. Create basic CRUD APIs

### Phase 2: Smart Contract Enhancement
1. Update contract for multi-election support
2. Add proper access controls
3. Enhanced event logging
4. Deploy and test contracts

### Phase 3: Frontend Transformation
1. Restructure React app with routing
2. Implement authentication flow
3. Create reusable UI components
4. Add state management

### Phase 4: Integration and Security
1. Connect frontend to backend APIs
2. Implement role-based UI rendering
3. Add comprehensive error handling
4. Security testing and hardening

### Phase 5: Advanced Features
1. Real-time notifications
2. Election analytics dashboard
3. Audit logging system
4. Performance optimization

This architecture provides a solid foundation for a production-ready blockchain voting platform with enterprise-grade security and scalability.