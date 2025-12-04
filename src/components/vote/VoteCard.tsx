import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VoteCardProps {
  id: number;
  title: string;
  description: string;
  deadline: Date;
  totalVotes: number;
  isEnded: boolean;
  status: 'active' | 'ended';
}

export function VoteCard({
  id,
  title,
  description,
  deadline,
  totalVotes,
  isEnded,
  status,
}: VoteCardProps) {
  const isActive = status === 'active' && !isEnded;
  const timeRemaining = isActive
    ? formatDistanceToNow(deadline, { addSuffix: true })
    : 'Ended';

  return (
    <Link to={`/vote/${id}`}>
      <Card className="glass-effect hover:bg-card-glass/80 transition-all hover:shadow-elevated cursor-pointer group overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>
            
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'bg-accent/20 text-accent border-accent/30' : ''}
            >
              {isActive ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {isActive ? 'Active' : 'Ended'}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{timeRemaining}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{totalVotes} votes</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
