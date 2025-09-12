// Базовые типы для Jira API

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
        colorName: string;
      };
    };
    assignee: JiraUser | null;
    priority: {
      name: string;
      id: string;
    };
    duedate: string | null;
    created: string;
    updated: string;
  };
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  active: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface ProjectStats {
  totalIssues: number;
  unassignedIssues: number;
  lowPriorityWithDeadline: number;
  activeUsers: number;
}