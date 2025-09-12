// Типы для Jira API

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  assignee: JiraUser | null;
  priority: {
    name: string;
    id: string;
  };
  duedate: string | null;
  created: string;
  updated: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl: string;
  active: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

// API Response типы
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProjectIssuesResponse extends ApiResponse<JiraIssue[]> {
  projectKey?: string;
}

export interface AutoAssignResult {
  issueKey: string;
  assignedTo?: string;
  success: boolean;
  error?: string;
}

export interface AutoAssignResponse extends ApiResponse<AutoAssignResult[]> {
  results?: AutoAssignResult[];
  summary?: string;
}

// Компонент пропсы
export interface ProjectStats {
  totalIssues: number;
  unassignedIssues: number;
  problemIssues: number;
  activeUsers: number;
}

export interface ModalProps {
  show: boolean;
  onClose: () => void;
}

export interface AssignModalProps extends ModalProps {
  issue: JiraIssue | null;
  users: JiraUser[];
  issues: JiraIssue[];
  onAssign: (accountId: string) => Promise<void>;
}

export interface PriorityModalProps extends ModalProps {
  issue: JiraIssue | null;
  onUpdatePriority: (priorityId: string) => Promise<void>;
}

export interface AutoAssignConfirmProps extends ModalProps {
  unassignedIssues: JiraIssue[];
  onConfirm: () => Promise<void>;
}