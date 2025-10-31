import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Vote, 
  Crown, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  Play,
  Square,
  Loader2
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import web3Service from '@/services/web3';
import { toast } from 'sonner';
import { 
  Candidate, 
  VoterInfo, 
  WalletAuthStatus 
} from '@/types/auth.types';

export default function VotingPage() {
  const { user, isAuthenticated } = useAuth();
  
  // Web3 and blockchain state
  const [web3Initialized, setWeb3Initialized] = useState(false);
  const [account, setAccount] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voterInfo, setVoterInfo] = useState<VoterInfo>({ isRegistered: false, hasVoted: false });
  const [isOwner, setIsOwner] = useState(false);
  const [votingOpen, setVotingOpen] = useState(false);
  const [walletAuthStatus, setWalletAuthStatus] = useState<WalletAuthStatus | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCandidateName, setNewCandidateName] = useState('');
  
  useEffect(() => {
    if (isAuthenticated) {
      initializeWeb3();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (web3Initialized) {
      loadContractData();
      checkWalletAuth();
    }
  }, [web3Initialized]);

  const initializeWeb3 = async () => {
    try {
      setLoading(true);
      const initialized = await web3Service.initialize();
      
      if (initialized) {
        setWeb3Initialized(true);
        setAccount(web3Service.getAccount());
        setError('');
      } else {
        setError('Failed to connect to MetaMask. Please install MetaMask and connect to Polygon Amoy Testnet.');
      }
    } catch (error: any) {
      console.error('Web3 initialization failed:', error);
      setError(error.message || 'Failed to initialize Web3');
    } finally {
      setLoading(false);
    }
  };

  const loadContractData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading contract data...');
      
      // Load all contract data in parallel
      const [
        ownerStatus,
        votingStatus,
        voterData,
        candidatesData
      ] = await Promise.all([
        web3Service.isOwner(),
        web3Service.isVotingOpen(),
        web3Service.getVoterInfo(),
        web3Service.getCandidates()
      ]);
      
      setIsOwner(ownerStatus);
      setVotingOpen(votingStatus);
      setVoterInfo(voterData);
      setCandidates(candidatesData);
      
      console.log('✅ Contract data loaded successfully!');
      setError('');
      
    } catch (error: any) {
      console.error('❌ Error loading contract data:', error);
      setError(`Failed to load contract data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkWalletAuth = async () => {
    try {
      const status = await web3Service.checkWalletAuthentication();
      setWalletAuthStatus(status);
    } catch (error: any) {
      console.error('Wallet auth check failed:', error);
      setWalletAuthStatus({
        hasWallet: false,
        isVerified: false,
        message: 'Failed to verify wallet authentication'
      });
    }
  };

  const registerSelf = async () => {
    if (!walletAuthStatus?.isVerified) {
      toast.error('Please ensure you are connected with your registered wallet address');
      return;
    }

    try {
      setLoading(true);
      const txHash = await web3Service.registerSelf();
      toast.success('Registration successful!', {
        description: `Transaction: ${txHash.slice(0, 10)}...`
      });
      
      // Reload voter info
      const voterData = await web3Service.getVoterInfo();
      setVoterInfo(voterData);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Registration failed', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const addCandidate = async () => {
    if (!newCandidateName.trim()) {
      toast.error('Please enter a candidate name');
      return;
    }

    if (!walletAuthStatus?.isVerified) {
      toast.error('Please ensure you are connected with your registered wallet address');
      return;
    }

    try {
      setLoading(true);
      const txHash = await web3Service.addCandidate(newCandidateName);
      toast.success('Candidate added successfully!', {
        description: `Transaction: ${txHash.slice(0, 10)}...`
      });
      
      setNewCandidateName('');
      // Reload candidates
      const candidatesData = await web3Service.getCandidates();
      setCandidates(candidatesData);
    } catch (error: any) {
      console.error('Add candidate error:', error);
      toast.error('Failed to add candidate', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const openVoting = async () => {
    try {
      setLoading(true);
      const txHash = await web3Service.openVoting();
      toast.success('Voting opened successfully!', {
        description: `Transaction: ${txHash.slice(0, 10)}...`
      });
      
      setVotingOpen(true);
    } catch (error: any) {
      console.error('Open voting error:', error);
      toast.error('Failed to open voting', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const closeVoting = async () => {
    try {
      setLoading(true);
      const txHash = await web3Service.closeVoting();
      toast.success('Voting closed successfully!', {
        description: `Transaction: ${txHash.slice(0, 10)}...`
      });
      
      setVotingOpen(false);
    } catch (error: any) {
      console.error('Close voting error:', error);
      toast.error('Failed to close voting', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (candidateId: number) => {
    if (!walletAuthStatus?.isVerified) {
      toast.error('Please ensure you are connected with your registered wallet address');
      return;
    }

    try {
      setLoading(true);
      const txHash = await web3Service.castVote(candidateId);
      toast.success('Vote cast successfully!', {
        description: `Transaction: ${txHash.slice(0, 10)}...`
      });
      
      // Reload data
      const [voterData, candidatesData] = await Promise.all([
        web3Service.getVoterInfo(),
        web3Service.getCandidates()
      ]);
      
      setVoterInfo(voterData);
      setCandidates(candidatesData);
    } catch (error: any) {
      console.error('Voting error:', error);
      toast.error('Voting failed', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const switchToPolygonAmoy = async () => {
    try {
      setLoading(true);
      const success = await web3Service.switchToPolygonAmoy();
      if (success) {
        toast.success('Switched to Polygon Amoy Testnet');
        // Reinitialize after network switch
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Failed to switch to Polygon Amoy network');
      }
    } catch (error: any) {
      toast.error('Network switch failed', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              Please login to access the blockchain voting system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!web3Initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">Connection Required</CardTitle>
            <CardDescription>
              Please install MetaMask and connect to Polygon Amoy Testnet (Chain ID: 80002)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Button onClick={initializeWeb3} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect MetaMask
              </Button>
              <Button variant="outline" onClick={switchToPolygonAmoy} disabled={loading} className="w-full">
                Switch to Polygon Amoy Testnet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <Card className="border-border/50 shadow-card">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
              <Vote className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-4xl bg-gradient-primary bg-clip-text text-transparent">
              🗳️ Block-Vote System
            </CardTitle>
            <CardDescription className="text-lg">
              Secure, Transparent, Decentralized Voting
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Wallet Status</h3>
                <div className="flex items-center justify-center space-x-1">
                  {walletAuthStatus?.isVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-semibold text-sm ${
                    walletAuthStatus?.isVerified ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {walletAuthStatus?.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Registration</h3>
                <div className="flex items-center justify-center space-x-1">
                  {voterInfo.isRegistered ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-semibold text-sm ${
                    voterInfo.isRegistered ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {voterInfo.isRegistered ? 'Registered' : 'Not Registered'}
                  </span>
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Voting Status</h3>
                <div className="flex items-center justify-center space-x-1">
                  {votingOpen ? (
                    <Play className="h-4 w-4 text-green-500" />
                  ) : (
                    <Square className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-semibold text-sm ${
                    votingOpen ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {votingOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Your Role</h3>
                <div className="flex items-center justify-center space-x-1">
                  {isOwner ? (
                    <Crown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  ) : (
                    <Vote className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  )}
                  <span className="font-semibold text-sm">
                    {isOwner ? 'Admin' : 'Voter'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Wallet Authentication Warning */}
        {walletAuthStatus && !walletAuthStatus.isVerified && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div>
                <h4 className="font-semibold">Wallet Authentication Required</h4>
                <p className="text-sm mt-1">{walletAuthStatus.message}</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href="/profile">
                    {walletAuthStatus.hasWallet ? 'Check Profile' : 'Register Wallet'}
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Processing blockchain transaction... Please wait
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Panel */}
        {isOwner && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                <Crown className="h-5 w-5" />
                <span>Admin Panel</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Add Candidate</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      value={newCandidateName}
                      onChange={(e) => setNewCandidateName(e.target.value)}
                      placeholder="Candidate name"
                      disabled={loading}
                    />
                    <Button
                      onClick={addCandidate}
                      disabled={loading || !newCandidateName.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Voting Control</Label>
                  <div className="flex space-x-2 mt-2">
                    {!votingOpen ? (
                      <Button
                        onClick={openVoting}
                        disabled={loading || candidates.length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Open Voting
                      </Button>
                    ) : (
                      <Button
                        onClick={closeVoting}
                        disabled={loading}
                        variant="destructive"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Close Voting
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration */}
        {!voterInfo.isRegistered && (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/30">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-200">📝 Voter Registration</CardTitle>
              <CardDescription>
                You need to register before you can vote. Click the button below to register your wallet address.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Button
                onClick={registerSelf}
                disabled={loading || !walletAuthStatus?.isVerified}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Register to Vote
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Voting Section */}
        {voterInfo.isRegistered && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {voterInfo.hasVoted ? '📊 Election Results' : '🗳️ Cast Your Vote'}
              </CardTitle>
              <CardDescription>
                {candidates.length === 0 
                  ? 'No candidates available yet.'
                  : voterInfo.hasVoted
                    ? 'Thank you for voting! Here are the current results.'
                    : 'Select your preferred candidate below.'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {candidates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Vote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No candidates available yet.</p>
                  {isOwner && <p className="text-sm">Use the admin panel to add candidates.</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <Card key={candidate.id} className="relative overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{candidate.name}</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Votes: {candidate.votes}</span>
                                <span>
                                  {totalVotes > 0 
                                    ? `${((candidate.votes / totalVotes) * 100).toFixed(1)}%`
                                    : '0%'
                                  }
                                </span>
                              </div>
                              {totalVotes > 0 && (
                                <Progress 
                                  value={(candidate.votes / totalVotes) * 100} 
                                  className="h-2"
                                />
                              )}
                            </div>
                          </div>
                          
                          {!voterInfo.hasVoted && votingOpen && walletAuthStatus?.isVerified && (
                            <Button
                              onClick={() => castVote(candidate.id)}
                              disabled={loading}
                              className="ml-4 bg-green-600 hover:bg-green-700"
                            >
                              Vote
                            </Button>
                          )}
                        </div>
                        
                        {voterInfo.hasVoted && voterInfo.votedCandidateId === candidate.id && (
                          <Badge className="absolute top-2 right-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Your Vote
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {voterInfo.hasVoted && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-950/30">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    ✅ Thank you for voting! Your vote has been recorded on the blockchain.
                  </AlertDescription>
                </Alert>
              )}
              
              {!votingOpen && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    🔴 Voting is currently closed.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by Ethereum Smart Contracts • Built with React & Web3.js</p>
        </div>
      </div>
    </div>
  );
}