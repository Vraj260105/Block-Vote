# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a blockchain-based online voting system that combines React frontend, Ethereum smart contracts, and Web3 integration. It's a full-stack decentralized application (dApp) that demonstrates secure, transparent voting on blockchain.

## Architecture

### Core Components
- **Frontend**: React 19 + TypeScript + TailwindCSS with Web3.js integration
- **Smart Contract**: Solidity contract deployed via Truffle on Ganache local blockchain  
- **Blockchain Layer**: Ethereum-compatible using Ganache for local development
- **Build System**: Truffle for contract compilation and deployment

### Key Files
- `blockchain/contracts/VotingSystem.sol` - Main smart contract with voting logic
- `frontend/src/App.tsx` - Single-page React app with complete UI
- `blockchain/truffle-config.js` - Truffle configuration for deployment
- `frontend/src/contracts/VotingSystem.json` - Contract ABI and address (generated post-deployment)

## Common Development Commands

### Blockchain Setup
```bash
# Deploy smart contracts (must be run from blockchain/ directory)
cd blockchain
npx truffle migrate --network development

# Test smart contracts
cd blockchain
npx truffle test

# Reset and redeploy contracts
cd blockchain
npx truffle migrate --reset --network development
```

### Frontend Development
```bash
# Start React development server (from frontend/ directory)
cd frontend
npm start

# Build for production
cd frontend
npm run build

# Run tests
cd frontend
npm test
```

### Network Verification
```bash
# Check network connectivity and contract deployment (from root)
node check_network.js

# Show real blockchain data and verify contract interaction
node show_real_data.js
```

## Development Flow

### Initial Setup Process
1. Start Ganache on `http://127.0.0.1:7545` (port 7545, Chain ID 1337)
2. Deploy contracts: `cd blockchain && npx truffle migrate`
3. Start frontend: `cd frontend && npm start` 
4. Configure MetaMask with first Ganache account

### Development Architecture
- **Contract-first approach**: Smart contract defines the business logic
- **Single-page app**: All UI logic contained in `App.tsx` with React hooks
- **Web3 integration**: Direct contract interaction via Web3.js (no backend API)
- **State management**: Local React state with useEffect hooks for blockchain sync

### Smart Contract Design
- **Owner-based admin**: First account (index 0) from Ganache is contract owner
- **Self-registration**: Voters can register themselves (demo convenience feature)  
- **Immutable voting**: Votes cannot be changed once cast
- **Real-time results**: Vote counts update immediately via contract calls

## Testing Strategy

### Manual Testing Flow
1. **Admin functions**: Add candidates, open/close voting (use first Ganache account)
2. **Voter experience**: Switch MetaMask accounts, register, vote (use other Ganache accounts)
3. **Result verification**: Check vote counts and percentages update in real-time
4. **Network verification**: Run `node check_network.js` to verify setup

### Contract Testing
- Smart contract tests should go in `blockchain/test/` directory
- Use Truffle's testing framework for contract logic verification
- Frontend testing uses React Testing Library (configured in package.json)

## Configuration Requirements

### MetaMask Setup for Development
- Network: Custom RPC
- RPC URL: `http://127.0.0.1:7545`
- Chain ID: `1337` (or `5777` depending on Ganache)
- Currency: ETH
- Import first Ganache account private key for admin access

### Environment Variables
While this demo runs without .env files, production setup needs:
- Frontend: `REACT_APP_GANACHE_URL=http://127.0.0.1:7545`
- Contract deployment networks in truffle-config.js

## Architecture Patterns

### State Management
- React functional components with hooks
- Direct Web3 contract calls (no middleware)
- useEffect for blockchain data synchronization
- Loading states and error handling for all async operations

### Web3 Integration Pattern
```typescript
// Contract interaction pattern used throughout App.tsx
const contractMethod = async () => {
  try {
    setLoading(true);
    await contract.methods.methodName(params).send({ from: account });
    await loadContractData(); // Refresh UI state
    setError('');
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### UI Component Structure
- Single component architecture in `App.tsx`
- Conditional rendering based on user state (owner, registered, voted)
- Glassmorphism design with TailwindCSS
- Real-time progress bars and vote visualization

## Common Issues & Solutions

### Contract Deployment
- If "Contract not found" error: Run `npx truffle migrate` from blockchain/ directory
- If migration fails: Check Ganache is running on correct port (7545)
- Address changes: Each migration creates new contract address in VotingSystem.json

### MetaMask Connection
- "Failed to connect": Verify Ganache network matches MetaMask RPC settings
- Transaction failures: Ensure sufficient ETH balance and correct network
- Wrong network: Chain ID must match Ganache configuration (usually 1337)

### Development Debugging
- Use browser DevTools to inspect Web3 calls and contract interactions
- Console logs in `App.tsx` show detailed contract interaction flow
- `check_network.js` script helps verify complete setup

## Modern UI Features

The frontend implements contemporary design patterns:
- **Glassmorphism**: Backdrop blur effects and translucent cards
- **Gradient systems**: Dynamic color gradients throughout interface  
- **Micro-interactions**: Hover animations and state transitions
- **Responsive design**: Mobile-first approach with touch-friendly interactions
- **Real-time updates**: Vote percentages and progress bars animate on change

## File Structure Context

```
blockchain-voting-system/
├── frontend/           # React app with complete UI
├── blockchain/         # Truffle project with smart contracts
├── database/           # MySQL schema (unused in current demo)
├── backend/            # Node.js API (unused in current demo)  
├── check_network.js    # Development utility script
└── show_real_data.js   # Blockchain verification script
```

Note: This implementation currently uses only frontend + blockchain. Database and backend directories exist for future full-stack expansion but are not used in current demo version.