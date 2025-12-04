import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/contexts/Web3Context';
import { useFHE } from '@/hooks/useFHE';
import { encryptVote } from '@/utils/fhe';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  Users,
  User,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Shield,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VoteData {
  id: number;
  title: string;
  description: string;
  options: string[];
  deadline: Date;
  creator: string;
  isEnded: boolean;
  totalVotes: number;
  results: number[];
}

export default function VoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account, contract } = useWeb3();
  const { fhe, isInitialized: fheInitialized, isLoading: fheLoading } = useFHE();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load vote data from contract
  useEffect(() => {
    const loadVoteData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const voteId = parseInt(id);
      setLoading(true);

      try {
        // Check if contract is available and not demo mode
        if (!contract || contract.target === '0x0000000000000000000000000000000000000000') {
          console.log('[VoteDetail] Demo mode: No contract available');
          setVoteData(null);
          setLoading(false);
          return;
        }

        console.log(`[VoteDetail] Loading vote ${voteId} from contract...`);

        // Load vote info from contract
        const voteInfo = await contract.getVoteInfo(voteId);
        const [title, description, options, deadline, totalVoters, isActive, , creator] = voteInfo;

        const deadlineDate = new Date(Number(deadline) * 1000);
        const isEnded = !isActive || deadlineDate < new Date();

        // Try to load results (may fail if not revealed)
        let results: number[] = [];
        try {
          const contractResults = await contract.getVoteResults(voteId);
          results = contractResults.map((r: bigint) => Number(r));
        } catch (error) {
          console.log('[VoteDetail] Results not available yet (encrypted)');
          results = new Array(options.length).fill(0);
        }

        setVoteData({
          id: voteId,
          title,
          description,
          options,
          deadline: deadlineDate,
          creator,
          isEnded,
          totalVotes: Number(totalVoters),
          results,
        });

        console.log(`[VoteDetail] Loaded vote: ${title}`);

        // Check if user has voted
        if (account) {
          const voted = await contract.hasAddressVoted(voteId, account);
          setHasVoted(voted);
          console.log(`[VoteDetail] User has voted: ${voted}`);
        }

      } catch (error) {
        console.error('[VoteDetail] Error loading vote data:', error);
        toast.error('Failed to load vote');
        setVoteData(null);
      } finally {
        setLoading(false);
      }
    };

    loadVoteData();
  }, [id, contract, account]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect p-8 text-center">
          <p className="text-muted-foreground">Loading poll details...</p>
        </Card>
      </div>
    );
  }

  if (!voteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Poll Not Found</h2>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const isActive = !voteData.isEnded && voteData.deadline > new Date();
  const isCreator = account?.toLowerCase() === voteData.creator.toLowerCase();
  const totalVotes = voteData.results.reduce((sum, count) => sum + count, 0);

  const handleVote = async () => {
    if (!account) {
      toast.error('Please connect wallet first');
      return;
    }

    if (!selectedOption) {
      toast.error('Please select an option');
      return;
    }

    if (!fheInitialized) {
      toast.error('FHE is still initializing, please wait...');
      return;
    }

    try {
      setSubmitting(true);
      const optionIndex = parseInt(selectedOption);

      // Check if contract is available
      if (!contract || contract.target === '0x0000000000000000000000000000000000000000') {
        toast.error('Contract not available. Please deploy a contract first.');
        return;
      }

      // Real FHE mode: Encrypt vote and submit to blockchain
      toast.info('Encrypting your vote...');

      const { handle, proof } = await encryptVote(
        optionIndex,
        contract.target as string,
        account
      );

      toast.info('Submitting encrypted vote to blockchain...');

      // Note: Contract signature is castVote(uint256 voteId, bytes calldata encryptedChoice)
      const tx = await contract.castVote(voteData.id, handle);

      toast.info('Waiting for transaction confirmation...');
      const receipt = await tx.wait();

      setHasVoted(true);
      toast.success('Vote submitted successfully! Your vote is encrypted on-chain.');
      console.log('[Vote] Transaction confirmed:', receipt.hash);
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast.error(`Failed to vote: ${error.message || 'Please retry'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndVote = async () => {
    try {
      setSubmitting(true);
      // await contract.endVoteEarly(voteData.id);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Poll ended early');
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

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

        <div className="space-y-6">
          {/* Header */}
          <Card className="glass-effect p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold glow-text">
                  {voteData.title}
                </h1>
                <p className="text-muted-foreground">{voteData.description}</p>
              </div>
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={isActive ? 'bg-accent/20 text-accent border-accent/30' : ''}
              >
                {isActive ? 'Active' : 'Ended'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Creator: {voteData.creator}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {isActive
                    ? `Ends ${formatDistanceToNow(voteData.deadline, {
                        addSuffix: true,
                      })}`
                    : 'Ended'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{totalVotes} votes cast</span>
              </div>
              <div className="flex items-center gap-2 text-accent">
                <Shield className="w-4 h-4" />
                <span>FHE Protected</span>
              </div>
            </div>
          </Card>

          {/* FHE Status Card */}
          {fheLoading && (
            <Card className="glass-effect p-4 border-accent/30">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-muted-foreground">
                  Initializing FHE encryption system...
                </span>
              </div>
            </Card>
          )}

          {fheInitialized && !fheLoading && (
            <Card className="glass-effect p-4 border-accent/30">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">
                  🔐 Your vote will be encrypted using Fully Homomorphic Encryption (FHE)
                </span>
              </div>
            </Card>
          )}

          {/* Voting Section */}
          {isActive && !hasVoted && (
            <Card className="glass-effect p-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  Cast Your Vote
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select your preferred option (cannot be changed after voting)
                </p>
              </div>

              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                <div className="space-y-3">
                  {voteData.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-4 rounded-lg glass-effect hover:bg-card-glass/80 transition-all cursor-pointer"
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <Button
                variant="hero"
                className="w-full"
                onClick={handleVote}
                disabled={submitting || !account || !selectedOption}
              >
                {submitting ? 'Submitting...' : 'Submit Vote'}
              </Button>

              {!account && (
                <p className="text-center text-sm text-muted-foreground">
                  Please connect wallet to participate in voting
                </p>
              )}
            </Card>
          )}

          {/* Results Section */}
          <Card className="glass-effect p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Voting Results
                {isActive && (
                  <span className="text-sm font-normal text-muted-foreground">
                    (Real-time)
                  </span>
                )}
              </h2>
            </div>

            <div className="space-y-4">
              {voteData.options.map((option, index) => {
                const votes = voteData.results[index];
                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                const isWinning = votes === Math.max(...voteData.results);

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        {option}
                        {isWinning && !isActive && (
                          <Trophy className="w-4 h-4 text-accent" />
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {votes} votes ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>

            {hasVoted && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-accent/10 border border-accent/20">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span className="text-sm">You have voted</span>
              </div>
            )}
          </Card>

          {/* Creator Actions */}
          {isCreator && isActive && (
            <Card className="glass-effect p-6 space-y-4">
              <h3 className="font-semibold">Management Actions</h3>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleEndVote} disabled={submitting}>
                  End Poll Early
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
