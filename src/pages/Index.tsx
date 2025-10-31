import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote, Shield, Users, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8 shadow-glow">
            <Vote className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Block-Vote
            </span>
            <br />
            <span className="text-3xl md:text-5xl text-foreground">
              Secure Blockchain Voting Platform
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Transparent, immutable, and decentralized voting powered by Ethereum blockchain technology. 
            Your vote matters, and blockchain ensures it counts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button asChild size="lg" className="shadow-elegant text-lg">
                <Link to="/voting">
                  Go to Voting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="shadow-elegant text-lg">
                  <Link to="/register">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Blockchain Voting?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-card border-border/50 hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Immutable Records</CardTitle>
                <CardDescription>
                  Once cast, votes are permanently recorded on the blockchain and cannot be altered or deleted
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card border-border/50 hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Complete Transparency</CardTitle>
                <CardDescription>
                  All voting data is publicly verifiable on the blockchain while maintaining voter privacy
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card border-border/50 hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Instant Results</CardTitle>
                <CardDescription>
                  Real-time vote counting with instant verification through smart contracts
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          
          <div className="space-y-6">
            {[
              { step: 1, title: 'Create Your Account', description: 'Register with email verification and secure your account' },
              { step: 2, title: 'Connect Your Wallet', description: 'Link your MetaMask wallet for blockchain interaction' },
              { step: 3, title: 'Register as Voter', description: 'Get verified on the blockchain to participate in elections' },
              { step: 4, title: 'Cast Your Vote', description: 'Vote securely through smart contracts - one vote per person' },
            ].map((item) => (
              <Card key={item.step} className="shadow-card border-border/50">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="container mx-auto px-4 py-20">
          <Card className="max-w-3xl mx-auto shadow-elegant border-primary/20 bg-gradient-card">
            <CardContent className="text-center py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Voting?</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Join thousands of users already voting securely on the blockchain
              </p>
              <Button asChild size="lg" className="shadow-elegant text-lg">
                <Link to="/register">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

export default Index;
