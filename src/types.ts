export interface User {
  username: string;
  name: string;
  invitationCode: string; // New field
}

export interface Task {
  id: string;
  description: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  department: string;
  deadline: string;
  completed: boolean;
  source: 'personal' | 'team';
  teamId?: string;
  relatedSummary?: string;
}

export interface Decision {
  id: string;
  description: string;
}

export interface AnalysisResult {
  summary: string;
  tasks: Task[];
  decisions: Decision[];
}

export interface Announcement {
  id: string;
  teamId: string;
  content: string;
  createdAt: string;
  author: string;
}

export interface Team {
  id: string;
  name: string;
  members: string[];
  createdBy?: string;
}