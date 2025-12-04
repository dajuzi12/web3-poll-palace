import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWeb3 } from '@/contexts/Web3Context';
import { toast } from 'sonner';
import { Plus, Trash2, CalendarIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CreateVote() {
  const navigate = useNavigate();
  const { account, contract } = useWeb3();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [deadline, setDeadline] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    } else {
      toast.error('Maximum 10 options allowed');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      toast.error('At least 2 options required');
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast.error('Please connect wallet first');
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    const filledOptions = options.filter((opt) => opt.trim());
    if (filledOptions.length < 2) {
      toast.error('At least 2 valid options required');
      return;
    }

    if (!deadline || deadline <= new Date()) {
      toast.error('Please select a future deadline');
      return;
    }

    try {
      setSubmitting(true);

      // Check if contract is available
      if (!contract || contract.target === '0x0000000000000000000000000000000000000000') {
        toast.error('Contract not available. Please deploy a contract first.');
        return;
      }

      // Call actual smart contract
      toast.info('Creating poll on blockchain...');

      const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);
      const tx = await contract.createVote(
        title,
        description,
        filledOptions,
        deadlineTimestamp
      );

      toast.info('Waiting for transaction confirmation...');
      const receipt = await tx.wait();

      // Get the voteId from the event
      const voteCreatedEvent = receipt.logs.find(
        (log: any) => log.fragment && log.fragment.name === 'VoteCreated'
      );

      if (voteCreatedEvent) {
        const voteId = voteCreatedEvent.args[0];
        toast.success(`Poll created successfully! Vote ID: ${voteId}`);
      } else {
        toast.success('Poll created successfully!');
      }

      navigate('/');
    } catch (error: any) {
      console.error('Failed to create poll:', error);

      // Handle specific error cases
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction rejected by user');
      } else if (error.message && error.message.includes('user rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Failed to create poll: ${error.message || 'Please retry'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container py-8 px-4 md:px-6 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold glow-text">Create New Poll</h1>
            <p className="text-muted-foreground">
              Create a new decentralized poll, all voting records will be permanently stored on the blockchain
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="glass-effect p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter poll title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-effect"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Poll Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the background and purpose of this poll..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-effect min-h-32"
                  maxLength={500}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Poll Options * (2-10 options)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={options.length >= 10}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="glass-effect"
                        maxLength={100}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={options.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deadline *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal glass-effect',
                        !deadline && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? (
                        format(deadline, 'PPP HH:mm')
                      ) : (
                        <span>Select deadline date and time</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-effect" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Please select a deadline greater than current time
                </p>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="hero"
                disabled={submitting || !account}
                className="flex-1"
              >
                {submitting ? 'Creating...' : 'Create Poll'}
              </Button>
            </div>

            {!account && (
              <p className="text-center text-sm text-muted-foreground">
                Please connect wallet to create poll
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
