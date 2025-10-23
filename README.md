# Blockchain-Based Online Voting System

A secure, decentralized voting platform built with React, Node.js, Ethereum smart contracts, and MySQL.

## 🏗️ Architecture

- **Frontend**: React + TailwindCSS + MetaMask integration
- **Backend**: Node.js + Express + JWT authentication
- **Blockchain**: Ethereum smart contracts (Solidity) deployed via Truffle on Ganache
- **Database**: MySQL with Sequelize ORM
- **Web3 Integration**: Web3.js for blockchain interactions

## 📁 Project Structure

```
blockchain-voting-system/
├── frontend/          # React app with TailwindCSS
├── backend/           # Node.js + Express API server
├── blockchain/        # Truffle project with smart contracts
├── database/          # MySQL schema and migrations
└── docs/             # Documentation
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16+)
2. **MySQL** (v8.0+)
3. **Ganache** (for local blockchain)
4. **MetaMask** browser extension
5. **Truffle** (`npm install -g truffle`)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd blockchain-voting-system
   npm install
   ```

2. **Set up MySQL database**:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Start Ganache**:
   - Open Ganache GUI
   - Create new workspace on `http://127.0.0.1:7545`

4. **Deploy smart contracts**:
   ```bash
   cd blockchain
   npm install
   truffle migrate --network development
   ```

5. **Start backend server**:
   ```bash
   cd backend
   npm install
   npm start
   ```

6. **Start frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 🔐 Features

### User Roles
- **Voter**: Register with MetaMask, cast votes, view results
- **Admin**: Create elections, manage candidates, deploy contracts

### Security Features
- MetaMask wallet authentication
- JWT session management
- Encrypted wallet key storage
- Role-based access control
- Blockchain immutability

### Core Functionality
- Voter registration via MetaMask
- Election creation and management
- Candidate management
- Secure vote casting
- Real-time result tracking
- Blockchain transaction verification

## 🔧 Configuration

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env)**:
```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=voting_system
JWT_SECRET=your_jwt_secret
GANACHE_URL=http://127.0.0.1:7545
ENCRYPTION_KEY=your_32_character_encryption_key
```

**Frontend (.env)**:
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GANACHE_URL=http://127.0.0.1:7545
```

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user with MetaMask
- `POST /api/auth/login` - Login with MetaMask
- `POST /api/auth/logout` - Logout

### Elections
- `GET /api/elections` - Get all elections
- `POST /api/elections` - Create election (admin)
- `GET /api/elections/:id` - Get election details

### Candidates
- `GET /api/candidates/:electionId` - Get candidates for election
- `POST /api/candidates` - Add candidate (admin)

### Voting
- `POST /api/vote` - Cast vote
- `GET /api/results/:electionId` - Get election results

## 🧪 Testing

Run tests for each component:

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# Smart contract tests
cd blockchain && truffle test
```

## 🚀 Deployment

### Local Development
Follow the Quick Start guide above.

### Production Deployment
1. Deploy to Ethereum testnet (Ropsten/Goerli)
2. Use production MySQL database
3. Configure HTTPS and secure environment variables
4. Set up proper CORS policies

## 🛠️ Technology Stack

- **Frontend**: React 18, TailwindCSS, Web3.js, MetaMask
- **Backend**: Node.js, Express, Sequelize, JWT
- **Blockchain**: Solidity, Truffle, Ganache, Web3.js
- **Database**: MySQL 8.0
- **Security**: bcrypt, crypto, helmet, cors

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For issues and questions, please create an issue in the GitHub repository.