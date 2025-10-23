# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Build and Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend Services (Full System)
```bash
# Start MySQL and backend API (different terminal)
cd ../backend
npm start

# Deploy blockchain contracts (different terminal) 
cd ../blockchain
npx truffle migrate --network development

# Reset contracts if needed
npx truffle migrate --reset --network development
```

## Architecture Overview

This is a **full-stack blockchain voting system** with three main components:

### 1. Frontend (Block-vote - Current Directory)
- **Framework**: React + TypeScript + Vite
- **UI Library**: ShadCN/UI components built on Radix UI + Tailwind CSS
- **State Management**: React Context (AuthContext) + TanStack Query
- **Routing**: React Router DOM
- **Web3 Integration**: Web3.js for Ethereum blockchain interaction

### 2. Authentication & Security Architecture
- **Authentication Flow**: JWT + Email OTP (2-factor authentication)
- **API Service** (`src/services/api.ts`): Centralized API client with automatic token refresh
- **Auth Context** (`src/contexts/AuthContext.tsx`): Global authentication state management
- **Protected Routes**: Route-level authentication guards
- **Wallet Verification**: MetaMask wallet integration with backend verification

### 3. Blockchain Integration
- **Web3 Service** (`src/services/web3.ts`): Smart contract interaction layer
- **Contract Artifacts** (`src/contracts/VotingSystem.json`): Deployed smart contract ABI and address
- **Ganache Integration**: Local blockchain development environment
- **MetaMask Integration**: Wallet connection and transaction signing

## Key Components and Services

### Core Services
- `src/services/api.ts` - Backend API client with authentication
- `src/services/web3.ts` - Blockchain interaction service
- `src/contexts/AuthContext.tsx` - Authentication state management

### Main Pages
- `src/pages/VotingPage.tsx` - Complete voting interface (admin + voter functionality)
- `src/pages/LoginPage.tsx` - Login with OTP verification
- `src/pages/RegisterPage.tsx` - Registration with email verification
- `src/pages/ProfilePage.tsx` - User profile and wallet management

### Component Architecture
- **UI Components**: Located in `src/components/ui/` (ShadCN components)
- **Layout Components**: Navigation, ProtectedRoute, LoadingSpinner
- **Type Definitions**: `src/types/auth.types.ts` - Comprehensive TypeScript interfaces

## Backend Dependencies

This frontend requires three backend services to function:

1. **MySQL Database** - User accounts, authentication, profile data
2. **Node.js Backend API** (port 5000) - Authentication, user management, wallet verification
3. **Ganache Blockchain** (port 7545) - Local Ethereum network for smart contracts

## Smart Contract Integration

### Contract Features
- **Voter Registration**: Self-registration on blockchain
- **Candidate Management**: Admin-only candidate addition
- **Voting Control**: Admin-controlled voting sessions
- **Vote Casting**: Secure, immutable vote recording
- **Real-time Results**: Live vote counting and percentages

### Admin vs Voter Functionality
- **Admin** (contract owner): Add candidates, open/close voting, view results
- **Voter**: Register to vote, cast single vote, view results
- **Role Detection**: Automatic based on wallet address matching contract owner

## Environment Configuration

Required environment variables in `.env`:
```
VITE_API_URL=http://localhost:5000/api
VITE_GANACHE_URL=http://127.0.0.1:7545
```

## Development Workflow

### Initial Setup (from documentation)
1. Start MySQL database
2. Start backend API server
3. Launch Ganache blockchain
4. Deploy smart contracts
5. Configure MetaMask with Ganache network
6. Run frontend development server

### Common Development Tasks
- **Add new UI components**: Use ShadCN CLI or copy from `src/components/ui/`
- **Extend API functionality**: Add new endpoints to `src/services/api.ts`
- **Smart contract changes**: Update artifacts in `src/contracts/` after redeployment
- **Authentication flows**: Modify `src/contexts/AuthContext.tsx`
- **New pages**: Add to `src/pages/` and register routes in `App.tsx`

## Code Patterns

### API Calls
All API interactions use the centralized `apiService` with automatic authentication headers and token refresh.

### Web3 Integration
The `web3Service` provides a clean interface for all blockchain operations with error handling and transaction management.

### State Management
Authentication state is global via `AuthContext`. Component state uses React hooks. Server state uses TanStack Query for caching.

### Error Handling
- API errors: Handled in service layer with toast notifications
- Blockchain errors: Transaction-level error handling with user feedback
- Form validation: Uses React Hook Form with Zod schemas

## Testing Notes

When testing, ensure all three backend services are running. Use the first Ganache account as the admin account for full functionality testing.

## Common Issues

- **MetaMask connection**: Ensure Ganache network is added to MetaMask (Chain ID: 1337)
- **Contract not found**: Redeploy contracts and update artifacts
- **Authentication failures**: Check backend API is running and database is accessible
- **Wallet verification**: Ensure wallet address is registered in user profile
- **CORS errors**: Frontend runs on port 3000 to match backend CORS configuration
- **React Router warnings**: Future flags are enabled in App.tsx to suppress v7 warnings
