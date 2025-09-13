import { makeAutoObservable, computed } from 'mobx';
import { JiraAPI } from '../api';
import type { JiraIssue, JiraProject, JiraUser } from '../types/jira';

class AppDataStore {
    loading = true;
    error: string | null = null;

    issues: JiraIssue[] = [];
    users: JiraUser[] = [];
    projects: JiraProject[] = [];
    currentProject: string | null = null;

    constructor() {
        makeAutoObservable(this, {
            unassignedCount: computed,
            problemCount: computed,
            activeUsers: computed,
            activeUsersCount: computed,
        });
    }

    initialize = async () => {
        this.loading = true;
        this.error = null;
        try {
            await JiraAPI.initialize();
            await this.loadProjects();
            this.currentProject = JiraAPI.getCurrentProject();
            await this.loadData();
        } catch (e) {
            console.error('❌ Ошибка инициализации:', e);
            this.error = e instanceof Error ? e.message : 'Неизвестная ошибка';
        } finally {
            this.loading = false;
        }
    };

    loadProjects = async () => {
        try {
            const res = await JiraAPI.getProjects();
            if (res.success && res.data) {
                this.projects = res.data;
            } else {
                throw new Error(res.error || 'Ошибка загрузки проектов');
            }
        } catch (e) {
            console.error('❌ Ошибка загрузки проектов:', e);
            this.error = e instanceof Error ? e.message : 'Ошибка загрузки проектов';
        }
    };

    loadData = async () => {
        try {
            const [issuesRes, usersRes] = await Promise.all([
                JiraAPI.getProjectIssues(),
                JiraAPI.getProjectUsers(),
            ]);

            if (issuesRes.success && issuesRes.data) {
                this.issues = issuesRes.data;
            } else {
                throw new Error(issuesRes.error || 'Ошибка загрузки задач');
            }

            if (usersRes.success && usersRes.data) {
                this.users = usersRes.data;
            } else {
                throw new Error(usersRes.error || 'Ошибка загрузки пользователей');
            }
        } catch (e) {
            console.error('❌ Ошибка загрузки данных:', e);
            this.error = e instanceof Error ? e.message : 'Ошибка загрузки данных';
        }
    };

    changeProject = async (projectKey: string) => {
        this.loading = true;
        this.error = null;
        try {
            JiraAPI.setCurrentProject(projectKey);
            this.currentProject = projectKey;
            await this.loadData();
        } catch (e) {
            console.error('❌ Ошибка смены проекта:', e);
            this.error = e instanceof Error ? e.message : 'Ошибка смены проекта';
        } finally {
            this.loading = false;
        }
    };

    assignIssue = async (issueKey: string, accountId: string) => {
        try {
            const res = await JiraAPI.updateIssueAssignee(issueKey, accountId);
            if (res.success) {
                await this.loadData();
            } else {
                throw new Error(res.error || 'Неизвестная ошибка');
            }
        } catch (e) {
            console.error('❌ Ошибка назначения исполнителя:', e);
            throw e;
        }
    };

    updatePriority = async (issueKey: string, priorityId: string = '3') => {
        try {
            const res = await JiraAPI.updateIssuePriority(issueKey, priorityId);
            if (res.success) {
                await this.loadData();
            } else {
                throw new Error(res.error || 'Неизвестная ошибка');
            }
        } catch (e) {
            console.error('❌ Ошибка повышения приоритета:', e);
            throw e;
        }
    };

    autoAssign = async () => {
        try {
            const res = await JiraAPI.autoAssignUnassigned();
            if (res.success) {
                await this.loadData();
            } else {
                throw new Error(res.error || 'Неизвестная ошибка');
            }
        } catch (e) {
            console.error('❌ Ошибка массового назначения:', e);
            throw e;
        }
    };

    // computed
    get unassignedCount(): number {
        return this.issues.filter(i => !i.assignee).length;
    }

    get problemCount(): number {
        return this.issues.filter(i => {
            const unassigned = !i.assignee;
            const low = i.priority.name === 'Low' || i.priority.name === 'Lowest';
            const soonDeadline =
                !!i.duedate &&
                new Date(i.duedate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            return unassigned || (low && soonDeadline);
        }).length;
    }

    get activeUsers(): JiraUser[] {
        return this.users.filter(u => u.active && this.getUserActivity(u));
    }

    get activeUsersCount(): number {
        return this.activeUsers.length;
    }

    // helper for Team tab
    getUserActivity = (user: JiraUser): boolean => {
        const assignedCount = this.issues.filter(
            i => i.assignee && i.assignee.accountId === user.accountId
        ).length;
        return assignedCount < 2;
    };
}

export const appDataStore = new AppDataStore();
