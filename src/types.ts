export interface TopicOption {
  id: string;
  title: string;
  description?: string;
  votes: number;
}

export interface ScheduleOption {
  id: string;
  title: string;
  votes: number;
}

export interface VoteLogEntry {
  id: string;
  voterId?: string;
  voterName: string;
  selectedTopicId: string;
  selectedTopicTitle: string;
  selectedScheduleId?: string;
  timestamp: string;
  comment?: string;
}

export interface CommentEntry {
  id: string;
  author: string;
  text: string;
  topic: string;
  time: string;
}

export interface PollData {
  pollId: string;
  title: string;
  subtitle: string;
  status: 'active' | 'closed';
  createdAt: string;
  totalVoters: number;
  topics: TopicOption[];
  schedules: ScheduleOption[];
  votesLog: VoteLogEntry[];
  comments: CommentEntry[];
}
