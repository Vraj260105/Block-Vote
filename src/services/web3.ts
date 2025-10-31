import Web3 from 'web3';
import { 
  Candidate, 
  VoterInfo, 
  ContractData, 
  WalletAuthStatus 
} from '@/types/auth.types';
import apiService from './api';

// Polygon Amoy RPC endpoints (fallback order)
const AMOY_RPC_ENDPOINTS = [
  'https://rpc-amoy.polygon.technology',
  'https://polygon-amoy.drpc.org',
  'https://rpc.ankr.com/polygon_amoy',
];

class Web3Service {
  private web3: Web3 | null = null;
  private contract: any = null;
  private account: string = '';
  private contractData: ContractData | null = null;
  private currentRpcIndex: number = 0;

  async initialize(): Promise<boolean> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed!');
      }

      // Use provider from MetaMask directly
      this.web3 = new Web3(window.ethereum);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await this.web3.eth.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }
      
      this.account = accounts[0];
      
      // Load contract data
      await this.loadContract();
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountChange);
      window.ethereum.on('chainChanged', this.handleChainChange);
      
      return true;
    } catch (error) {
      console.error('Web3 initialization failed:', error);
      return false;
    }
  }

  private handleAccountChange = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      this.account = '';
      this.contract = null;
    } else if (accounts[0] !== this.account) {
      // User switched accounts
      this.account = accounts[0];
      // Wallet validation will be handled by useWalletValidation hook
      console.log('Account changed to:', this.account);
    }
  };

  private handleChainChange = () => {
    // Reload the page when chain changes
    window.location.reload();
  };

  private async loadContract(): Promise<void> {
    try {
      // Import the contract data directly (works better with Vite)
      const contractModule = await import('../contracts/VotingSystem.json');
      this.contractData = contractModule.default || contractModule;
      
      if (!this.contractData?.address || !this.contractData?.abi) {
        throw new Error('Invalid contract data');
      }
      
      if (!this.web3) {
        throw new Error('Web3 not initialized');
      }
      
      this.contract = new this.web3.eth.Contract(
        this.contractData.abi,
        this.contractData.address
      );
      
    } catch (error) {
      console.error('Failed to load contract:', error);
      throw new Error('Smart contract not found. Please deploy the contract first.');
    }
  }

  async checkWalletAuthentication(): Promise<WalletAuthStatus> {
    try {
      if (!this.account) {
        return {
          hasWallet: false,
          isVerified: false,
          message: 'Please connect MetaMask'
        };
      }

      // Check with backend if wallet is registered and verified
      const statusResponse = await apiService.getWalletStatus();
      
      if (!statusResponse.success || !statusResponse.data.hasWallet) {
        return {
          hasWallet: false,
          isVerified: false,
          message: 'No wallet registered in profile'
        };
      }

      const verifyResponse = await apiService.verifyWallet({
        walletAddress: this.account
      });

      return {
        hasWallet: true,
        isVerified: verifyResponse.data.isMatching,
        message: verifyResponse.data.message
      };
      
    } catch (error) {
      console.error('Wallet authentication check failed:', error);
      return {
        hasWallet: false,
        isVerified: false,
        message: 'Failed to verify wallet authentication'
      };
    }
  }

  async getContractOwner(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not loaded');
    }
    
    return await this.contract.methods.owner().call();
  }

  async isOwner(): Promise<boolean> {
    try {
      const owner = await this.getContractOwner();
      return owner.toLowerCase() === this.account.toLowerCase();
    } catch {
      return false;
    }
  }

  async isVotingOpen(): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not loaded');
    }
    
    return await this.contract.methods.votingOpen().call();
  }

  async getVoterInfo(): Promise<VoterInfo> {
    if (!this.contract) {
      throw new Error('Contract not loaded');
    }
    
    const voterInfo = await this.contract.methods.voters(this.account).call();
    return {
      isRegistered: voterInfo.isRegistered,
      hasVoted: voterInfo.hasVoted,
      votedCandidateId: voterInfo.votedCandidateId ? parseInt(voterInfo.votedCandidateId) : undefined
    };
  }

  async getCandidates(): Promise<Candidate[]> {
    if (!this.contract) {
      throw new Error('Contract not loaded');
    }
    
    const candidateCount = await this.contract.methods.getCandidateCount().call();
    const candidates: Candidate[] = [];
    
    for (let i = 0; i < candidateCount; i++) {
      const candidateData = await this.contract.methods.getCandidate(i).call();
      candidates.push({
        id: i,
        name: candidateData.name,
        votes: parseInt(candidateData.votes)
      });
    }
    
    return candidates;
  }

  async registerSelf(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not loaded');
    }
    
    const tx = await this.contract.methods.registerSelf().send({ 
      from: this.account,
      gas: 200000,
      gasPrice: await this.web3!.eth.getGasPrice()
    });
    
    return tx.transactionHash;
  }

  async addCandidate(name: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not loaded');
    }
    
    try {
      console.log('🔧 Attempting to add candidate:', name);
      console.log('📝 From account:', this.account);
      console.log('📍 Contract address:', this.contractData?.address);
      
      // First try to estimate gas
      const gasEstimate = await this.contract.methods.addCandidate(name).estimateGas({ 
        from: this.account 
      });
      console.log('⛽ Gas estimate:', gasEstimate);
      
      const tx = await this.contract.methods.addCandidate(name).send({ 
        from: this.account,
        gas: Math.floor(gasEstimate * 1.5), // Add 50% buffer
        gasPrice: await this.web3!.eth.getGasPrice() // Use network gas price
      });
      
      return tx.transactionHash;
    } catch (error: any) {
      console.error('❌ Add candidate failed:', error);
      if (error.message) {
        throw new Error(error.message);
      }
      throw error;
    }
  }

  async openVoting(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not loaded');
    }
    
    const tx = await this.contract.methods.openVoting().send({ 
      from: this.account,
      gas: 100000,
      gasPrice: await this.web3!.eth.getGasPrice()
    });
    
    return tx.transactionHash;
  }

  async closeVoting(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not loaded');
    }
    
    const tx = await this.contract.methods.closeVoting().send({ 
      from: this.account,
      gas: 100000,
      gasPrice: await this.web3!.eth.getGasPrice()
    });
    
    return tx.transactionHash;
  }

  async castVote(candidateId: number): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not loaded');
    }
    
    const tx = await this.contract.methods.castVote(candidateId).send({ 
      from: this.account,
      gas: 200000,
      gasPrice: await this.web3!.eth.getGasPrice()
    });
    
    return tx.transactionHash;
  }

  getAccount(): string {
    return this.account;
  }

  getContractAddress(): string {
    return this.contractData?.address || '';
  }

  isInitialized(): boolean {
    return !!(this.web3 && this.contract && this.account);
  }

  async switchToPolygonAmoy(): Promise<boolean> {
    try {
      const amoyChainId = '0x13882'; // 80002 in hex
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: amoyChainId }],
      });
      
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                rpcUrls: [import.meta.env.VITE_POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology'],
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://amoy.polygonscan.com/'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Polygon Amoy network:', addError);
          return false;
        }
      } else {
        console.error('Failed to switch to Polygon Amoy network:', switchError);
        return false;
      }
    }
  }


  cleanup(): void {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountChange);
      window.ethereum.removeListener('chainChanged', this.handleChainChange);
    }
    
    this.web3 = null;
    this.contract = null;
    this.account = '';
    this.contractData = null;
  }
}

// Create and export singleton instance
const web3Service = new Web3Service();
export default web3Service;