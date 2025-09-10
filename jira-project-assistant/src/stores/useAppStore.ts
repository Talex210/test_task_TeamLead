import { create } from 'zustand';
import { JiraIssue, JiraProject, JiraUser, ProjectStats } from '../types/jira';

interface AppState {
  // Данные
  currentProject: JiraProject | null;
  issues: JiraIssue[];
  users: JiraUser[];
  stats: ProjectStats | null;
  
  // UI состояния
  loading: boolean;
  error: string | null;
  
  // Действия
  setCurrentProject: (project: JiraProject) => void;
  setIssues: (issues: JiraIssue[]) => void;
  setUsers: (users: JiraUser[]) => void;
  setStats: (stats: ProjectStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Обновление отдельной задачи
  updateIssue: (issueKey: string, updates: Partial<JiraIssue['fields']>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Начальное состояние
  currentProject: null,
  issues: [],
  users: [],
  stats: null,
  loading: false,
  error: null,
  
  // Действия
  setCurrentProject: (project) => set({ currentProject: project }),
  setIssues: (issues) => set({ issues }),
  setUsers: (users) => set({ users }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  updateIssue: (issueKey, updates) => {
    const { issues } = get();
    const updatedIssues = issues.map(issue => 
      issue.key === issueKey 
        ? { ...issue, fields: { ...issue.fields, ...updates } }
        : issue
    );
    set({ issues: updatedIssues });
  },
}));