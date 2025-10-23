# 🗳️ Block-vote Backend Integration - Setup Guide

## Overview
The Block-vote React app has been fully integrated with the blockchain voting system backend. This provides:

- **JWT + Email OTP Authentication** (2FA security)
- **MySQL Database** with comprehensive user management
- **Web3 Blockchain Integration** with MetaMask
- **Real-time Voting System** with secure wallet verification
- **Role-based Access Control** (Admin/Voter permissions)

## Prerequisites

1. **Node.js** (v16+)
2. **MySQL** (v8.0+)
3. **Ganache** (for local blockchain)
4. **MetaMask** browser extension

## Installation Steps

### 1. Install Dependencies
```bash
cd Block-vote
npm install
```

### 2. Set up MySQL Database
```bash
# Navigate to the database folder and run the setup script
mysql -u root -p < ../database/setup.sql
```

### 3. Start Backend Server
```bash
# In a new terminal, navigate to backend folder
cd ../backend
npm install
npm start
```
The backend will run on `http://localhost:5000`

### 4. Start Ganache
- Open Ganache GUI application
- Create new workspace on `http://127.0.0.1:7545`
- Note the first account's private key for importing to MetaMask

### 5. Deploy Smart Contracts
```bash
cd ../blockchain
npm install
npx truffle migrate --network development
```

### 6. Configure MetaMask
- Add Ganache network:
  - **Network Name:** Ganache
  - **RPC URL:** `http://127.0.0.1:7545`
  - **Chain ID:** `1337`
  - **Currency Symbol:** `ETH`
- Import the first Ganache account using its private key

### 7. Start Frontend
```bash
cd ../Block-vote
npm run dev
```
The frontend will run on `http://localhost:5173`

## Environment Configuration

The `.env` file is already configured with:
```
VITE_API_URL=http://localhost:5000/api
VITE_GANACHE_URL=http://127.0.0.1:7545
```

## Usage Flow

### For New Users:
1. **Register:** Go to `/register` and create an account
2. **Email Verification:** Check email for OTP code
3. **Login:** Use email/password + OTP verification
4. **Profile Setup:** Add wallet address in profile (optional)
5. **Voting:** Access `/voting` to participate

### For Admins:
1. **Connect MetaMask:** Must use the first Ganache account (contract owner)
2. **Add Candidates:** Use admin panel to add candidates
3. **Open Voting:** Start the election process
4. **Monitor Results:** View real-time vote counts

### Voting Process:
1. **Wallet Verification:** Connect MetaMask with registered wallet
2. **Register as Voter:** One-time blockchain registration
3. **Cast Vote:** Select candidate and confirm transaction
4. **View Results:** Real-time blockchain-verified results

## Key Features

### Security
- ✅ JWT tokens with automatic refresh
- ✅ Email OTP for all authentications
- ✅ Wallet address verification
- ✅ Blockchain immutability
- ✅ Rate limiting and input validation

### User Experience
- ✅ Modern UI with ShadCN components
- ✅ Real-time transaction feedback
- ✅ Comprehensive error handling
- ✅ Loading states and progress indicators
- ✅ Responsive design

### Admin Features
- ✅ Candidate management
- ✅ Voting session control
- ✅ Real-time monitoring
- ✅ Role-based permissions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email verification
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/login` - Login with OTP
- `POST /api/auth/verify-login` - Verify login OTP
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Wallet Management
- `GET /api/wallet/status` - Check wallet registration
- `POST /api/wallet/verify` - Verify wallet address
- `PUT /api/users/profile` - Update profile/wallet

## Troubleshooting

### Common Issues:

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check network is set to Ganache (Chain ID: 1337)
   - Try refreshing the page

2. **Backend Connection Error**
   - Verify backend is running on port 5000
   - Check MySQL database is running
   - Ensure `.env` files are properly configured

3. **Smart Contract Not Found**
   - Run `truffle migrate --network development` in blockchain folder
   - Verify Ganache is running on port 7545
   - Check contract artifact exists in `src/contracts/`

4. **Wallet Not Verified**
   - Register wallet address in profile page
   - Ensure MetaMask account matches registered address
   - Switch MetaMask to the correct account

### Database Issues:
```bash
# Reset database if needed
mysql -u root -p
DROP DATABASE blockchain_voting;
SOURCE ../database/setup.sql;
```

### Smart Contract Reset:
```bash
cd ../blockchain
npx truffle migrate --reset --network development
```

## Architecture

```
Block-vote/
├── src/
│   ├── components/     # UI components
│   ├── contexts/       # Authentication context
│   ├── pages/          # Application pages
│   ├── services/       # API and Web3 services
│   ├── types/          # TypeScript definitions
│   └── contracts/      # Smart contract artifacts
├── .env               # Environment configuration
└── package.json       # Dependencies
```

## Testing

1. **Registration Flow:** Test user registration with email OTP
2. **Login Flow:** Test login with email/password + OTP
3. **Wallet Integration:** Test MetaMask connection and verification
4. **Admin Functions:** Test candidate management and voting control
5. **Voting Process:** Test complete voting flow from registration to results

The integration is now complete and ready for production use!