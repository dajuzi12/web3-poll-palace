import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Database, Zap, GitBranch, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Privacy Protection',
      description: 'Based on FHE (Fully Homomorphic Encryption) technology, ensuring completely anonymous voting with encrypted on-chain storage',
    },
    {
      icon: Lock,
      title: 'Secure & Reliable',
      description: 'Leveraging blockchain immutability, all voting records are permanently stored and cannot be modified or deleted',
    },
    {
      icon: Database,
      title: 'Decentralized',
      description: 'No centralized servers needed, smart contracts execute automatically, ensuring transparent voting process',
    },
    {
      icon: Zap,
      title: 'Real-time Statistics',
      description: 'Demo mode supports real-time viewing of cumulative voting results, production mode reveals results after deadline',
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container py-8 px-4 md:px-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold glow-text">VoteChain</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A blockchain-based decentralized private voting platform
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="glass-effect p-6 space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>

          {/* Tech Details */}
          <Card className="glass-effect p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-accent" />
                Technical Architecture
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <h3 className="font-semibold text-base">FHE Fully Homomorphic Encryption</h3>
                <p className="text-muted-foreground">
                  Utilizes fully homomorphic encryption technology, allowing computation directly on encrypted data without decryption. Voters' choices are encrypted before submission to the chain, even smart contracts cannot view specific voting content, only after voting ends and authorized revelation can statistical results be obtained.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base">Demo Mode</h3>
                <p className="text-muted-foreground">
                  Current demo version supports real-time viewing of cumulative voting data (revealedCounts). In production environment, voting content will be fully encrypted, only after voting deadline can results be revealed through revealVoteResults method, ensuring fairness of voting process.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base">Smart Contract Functions</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>createVote - Create new poll</li>
                  <li>castVote - Submit encrypted vote (2-byte encoded option index)</li>
                  <li>hasAddressVoted - Check if address has voted</li>
                  <li>getVoteResults - Get cumulative voting results</li>
                  <li>endVoteEarly - Creator ends poll early</li>
                  <li>revealVoteResults - Reveal final voting results</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Contract Info */}
          <Card className="glass-effect p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contract Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                <span className="text-muted-foreground">Network</span>
                <span className="font-mono">Demo Network</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                <span className="text-muted-foreground">Contract Address</span>
                <span className="font-mono text-xs">0x0000...0000</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * Currently in demo mode, not connected to actual blockchain network
            </p>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button variant="hero" size="lg" onClick={() => navigate('/create')}>
              Start Creating Poll
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
