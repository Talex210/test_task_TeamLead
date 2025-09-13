import React, { useState, useEffect } from 'react';
import { JiraAPI } from './api';
import type {
    JiraIssue,
    JiraUser,
    JiraProject,
} from './types/jira';
import styles from './styles/App.module.css';
import { Tabs } from './components/Tabs';
import { ProjectStatsPanel } from './components/ProjectStatsPanel';
import { IssuesTable } from './components/IssuesTable';
import { TeamGrid } from './components/TeamGrid';
import { AssignModal } from './components/modals/AssignModal';
import { PriorityModal } from './components/modals/PriorityModal';
import { MultiFixModal } from './components/modals/MultiFixModal';
import { AutoAssignConfirm } from './components/modals/AutoAssignConfirm';

export const App: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [issues, setIssues] = useState<JiraIssue[]>([]);
    const [users, setUsers] = useState<JiraUser[]>([]);
    const [projects, setProjects] = useState<JiraProject[]>([]);
    const [currentProject, setCurrentProject] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
    const [showPriorityModal, setShowPriorityModal] = useState<boolean>(false);
    const [showMultiFixModal, setShowMultiFixModal] = useState<boolean>(false);
    const [showAutoAssignConfirm, setShowAutoAssignConfirm] = useState<boolean>(false);
    const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
    const [activeTab, setActiveTab] = useState<'issues' | 'team'>('issues');

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async (): Promise<void> => {
        try {
            await JiraAPI.initialize();
            await loadProjects();
            const currentProjectKey = JiraAPI.getCurrentProject();
            setCurrentProject(currentProjectKey);
            await loadData();
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
        } finally {
            setLoading(false);
        }
    };

    const loadProjects = async (): Promise<void> => {
        try {
            const projectsResponse = await JiraAPI.getProjects();
            if (projectsResponse.success && projectsResponse.data) {
                setProjects(projectsResponse.data);
            } else {
                throw new Error(`Ошибка загрузки проектов: ${projectsResponse.error}`);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки проектов:', error);
            setError(error instanceof Error ? error.message : 'Ошибка загрузки проектов');
        }
    };

    const loadData = async (): Promise<void> => {
        try {
            const [issuesResponse, usersResponse] = await Promise.all([
                JiraAPI.getProjectIssues(),
                JiraAPI.getProjectUsers()
            ]);

            if (issuesResponse.success && issuesResponse.data) {
                setIssues(issuesResponse.data);
            } else {
                throw new Error(`Ошибка загрузки задач: ${issuesResponse.error}`);
            }

            if (usersResponse.success && usersResponse.data) {
                setUsers(usersResponse.data);
            } else {
                throw new Error(`Ошибка загрузки пользователей: ${usersResponse.error}`);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            setError(error instanceof Error ? error.message : 'Ошибка загрузки данных');
        }
    };

    const handleAssignIssue = async (issueKey: string, accountId: string): Promise<void> => {
        try {
            const response = await JiraAPI.updateIssueAssignee(issueKey, accountId);
            if (response.success) {
                await loadData();
            } else {
                throw new Error(response.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('❌ Ошибка назначения исполнителя:', error);
            alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const handleProjectChange = async (projectKey: string): Promise<void> => {
        try {
            setLoading(true);
            JiraAPI.setCurrentProject(projectKey);
            setCurrentProject(projectKey);
            await loadData();
        } catch (error) {
            console.error('❌ Ошибка смены проекта:', error);
            setError(error instanceof Error ? error.message : 'Ошибка смены проекта');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAssign = async (): Promise<void> => {
        try {
            const response = await JiraAPI.autoAssignUnassigned();
            if (response.success) {
                setShowAutoAssignConfirm(false);
                await loadData();
            } else {
                throw new Error(response.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('❌ Ошибка массового назначения:', error);
            alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
            setShowAutoAssignConfirm(false);
        }
    };

    const handleFixPriority = async (issueKey: string, priorityId: string = '3'): Promise<void> => {
        try {
            const response = await JiraAPI.updateIssuePriority(issueKey, priorityId);
            if (response.success) {
                await loadData();
            } else {
                throw new Error(response.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('❌ Ошибка повышения приоритета:', error);
            alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const handleFix = (issue: JiraIssue): void => {
        const isUnassigned = !issue.assignee;
        const isLowPriority = issue.priority.name === 'Low' || issue.priority.name === 'Lowest';
        const isLowPriorityWithDeadline = isLowPriority && issue.duedate &&
            new Date(issue.duedate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        setSelectedIssue(issue);

        if (isUnassigned && isLowPriorityWithDeadline) {
            setShowMultiFixModal(true);
        } else if (isUnassigned) {
            setShowAssignModal(true);
        } else if (isLowPriorityWithDeadline) {
            setShowPriorityModal(true);
        }
    };

    const closeModals = (): void => {
        setShowAssignModal(false);
        setShowPriorityModal(false);
        setShowMultiFixModal(false);
        setShowAutoAssignConfirm(false);
        setSelectedIssue(null);
    };

    const handleAssignFromModal = async (accountId: string): Promise<void> => {
        if (selectedIssue) {
            await handleAssignIssue(selectedIssue.key, accountId);
            closeModals();
        }
    };

    const handleFixPriorityFromModal = async (priorityId: string = '3'): Promise<void> => {
        if (selectedIssue) {
            await handleFixPriority(selectedIssue.key, priorityId);
            closeModals();
        }
    };

    if (loading) {
        return (
            <div className={styles.appLoading}>
                <h2>🚀 Jira Team Assistant</h2>
                <p>Загрузка данных...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.appError}>
                <h2>🚀 Jira Team Assistant</h2>
                <div className={styles.errorBox}>
                    <h3>❌ Ошибка</h3>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Перезагрузить</button>
                </div>
            </div>
        );
    }

    const unassignedIssues = issues.filter(issue => !issue.assignee);
    const problemIssues = issues.filter(issue =>
        !issue.assignee ||
        ((issue.priority.name === 'Low' || issue.priority.name === 'Lowest')
            && issue.duedate && new Date(issue.duedate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    );

    const getUserActivity = (user: JiraUser): boolean => {
        const assignedCount = issues.filter(issue =>
            issue.assignee && issue.assignee.accountId === user.accountId
        ).length;
        return assignedCount < 2;
    };

    const getActiveUsers = (): JiraUser[] => {
        return users.filter(user => user.active && getUserActivity(user));
    };

    return (
        <div className={styles.app}>
            <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {activeTab === 'issues' && (
                <div>
                    <ProjectStatsPanel
                        issues={issues}
                        users={users}
                        projects={projects}
                        currentProject={currentProject || ''}
                        onProjectChange={handleProjectChange}
                        unassignedCount={unassignedIssues.length}
                        problemCount={problemIssues.length}
                        onOpenAutoAssign={() => setShowAutoAssignConfirm(true)}
                        canAutoAssign={getActiveUsers().length > 0}
                        activeUsersCount={getActiveUsers().length}
                    />

                    <IssuesTable
                        issues={issues}
                        onFix={handleFix}
                    />
                </div>
            )}

            {activeTab === 'team' && (
                <TeamGrid
                    users={users}
                    issues={issues}
                    getUserActivity={getUserActivity}
                />
            )}

            <AssignModal
                show={showAssignModal && !!selectedIssue}
                issue={selectedIssue}
                users={getActiveUsers()}
                issues={issues}
                onAssign={handleAssignFromModal}
                onClose={closeModals}
            />

            <PriorityModal
                show={showPriorityModal && !!selectedIssue}
                issue={selectedIssue}
                onUpdatePriority={handleFixPriorityFromModal}
                onClose={closeModals}
            />

            <MultiFixModal
                show={showMultiFixModal && !!selectedIssue}
                issue={selectedIssue}
                onChooseAssign={() => { setShowMultiFixModal(false); setShowAssignModal(true); }}
                onChoosePriority={() => { setShowMultiFixModal(false); setShowPriorityModal(true); }}
                onClose={closeModals}
            />

            <AutoAssignConfirm
                show={showAutoAssignConfirm}
                unassignedIssues={unassignedIssues}
                activeUsersCount={getActiveUsers().length}
                onConfirm={handleAutoAssign}
                onClose={closeModals}
            />
        </div>
    );
};
