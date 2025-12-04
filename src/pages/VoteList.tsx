import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VoteCard } from '@/components/vote/VoteCard';
import { Search, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/contexts/Web3Context';
import { toast } from 'sonner';

interface Vote {
  id: number;
  title: string;
  description: string;
  deadline: Date;
  totalVotes: number;
  isEnded: boolean;
  status: 'active' | 'ended';
}

export default function VoteList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const { contract } = useWeb3();

  // Load votes from contract
  useEffect(() => {
    const loadVotes = async () => {
      setLoading(true);

      try {
        // Check if contract is available and not demo mode
        if (!contract || contract.target === '0x0000000000000000000000000000000000000000') {
          console.log('[VoteList] Demo mode: No contract available');
          setVotes([]);
          setLoading(false);
          return;
        }

        console.log('[VoteList] Loading votes from contract...');

        // Get total number of votes created
        const nextVoteId = await contract.nextVoteId();
        const totalVotes = Number(nextVoteId);

        console.log(`[VoteList] Total votes to load: ${totalVotes}`);

        if (totalVotes === 0) {
          console.log('[VoteList] No votes found');
          setVotes([]);
          setLoading(false);
          return;
        }

        // Load each vote
        const loadedVotes: Vote[] = [];
        for (let i = 0; i < totalVotes; i++) {
          try {
            const voteInfo = await contract.getVoteInfo(i);
            const [title, description, , deadline, totalVoters, isActive] = voteInfo;

            const deadlineDate = new Date(Number(deadline) * 1000);
            const isEnded = !isActive || deadlineDate < new Date();

            loadedVotes.push({
              id: i,
              title,
              description,
              deadline: deadlineDate,
              totalVotes: Number(totalVoters),
              isEnded,
              status: isEnded ? 'ended' : 'active',
            });

            console.log(`[VoteList] Loaded vote ${i}:`, title);
          } catch (error) {
            console.error(`[VoteList] Error loading vote ${i}:`, error);
          }
        }

        setVotes(loadedVotes);
        console.log(`[VoteList] Successfully loaded ${loadedVotes.length} votes`);

      } catch (error) {
        console.error('[VoteList] Error loading votes:', error);
        toast.error('Failed to load votes');
        setVotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadVotes();
  }, [contract]);

  const filteredVotes = votes.filter((vote) => {
    const matchesSearch =
      vote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vote.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && !vote.isEnded;
    if (filter === 'ended') return matchesSearch && vote.isEnded;
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <div className="container py-8 px-4 md:px-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-12">
          <h1 className="text-4xl md:text-5xl font-bold glow-text">
            Decentralized Voting Platform
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A blockchain-based privacy-protected voting system supporting fully anonymous and verifiable voting processes
          </p>
          <Link to="/create">
            <Button variant="hero" size="lg" className="gap-2 mt-4">
              <Plus className="w-5 h-5" />
              Create New Poll
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search poll title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 glass-effect"
              />
            </div>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="glass-effect">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="ended">Ended</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Vote Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 text-center py-12 glass-effect rounded-lg">
              <p className="text-muted-foreground">Loading polls...</p>
            </div>
          ) : filteredVotes.length > 0 ? (
            filteredVotes.map((vote) => <VoteCard key={vote.id} {...vote} />)
          ) : (
            <div className="col-span-2 text-center py-12 glass-effect rounded-lg">
              <p className="text-muted-foreground">No matching polls found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
