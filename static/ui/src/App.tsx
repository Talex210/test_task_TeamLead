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

import { observer } from 'mobx-react-lite';
import { appUiStore } from './store/appUiStore';
import { Container, Typography, CircularProgress, Alert, Button, Box } from '@mui/material';

export const App: React.FC = observer(() => {
    const [loading, setLoading] = useState<boolean>(true);
    const [issues, setIssues] = useState<JiraIssue[]>([]);
    const [users, setUsers] = useState<JiraUser[]>([]);
    const [projects, setProjects] = useState<JiraProject[]>([]);
    const [currentProject, setCurrentProject] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                appUiStore.setShowAutoAssignConfirm(false);
                await loadData();
            } else {
                throw new Error(response.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('❌ Ошибка массового назначения:', error);
            alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
            appUiStore.setShowAutoAssignConfirm(false);
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

        appUiStore.setSelectedIssue(issue);

        if (isUnassigned && isLowPriorityWithDeadline) {
            appUiStore.setShowMultiFixModal(true);
        } else if (isUnassigned) {
            appUiStore.setShowAssignModal(true);
        } else if (isLowPriorityWithDeadline) {
            appUiStore.setShowPriorityModal(true);
        }
    };

    const closeModals = (): void => {
        appUiStore.resetModals();
        appUiStore.setSelectedIssue(null);
    };

    const handleAssignFromModal = async (accountId: string): Promise<void> => {
        if (appUiStore.selectedIssue) {
            await handleAssignIssue(appUiStore.selectedIssue.key, accountId);
            closeModals();
        }
    };

    const handleFixPriorityFromModal = async (priorityId: string = '3'): Promise<void> => {
        if (appUiStore.selectedIssue) {
            await handleFixPriority(appUiStore.selectedIssue.key, priorityId);
            closeModals();
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
                <Typography variant="h4" gutterBottom>🚀 Jira Team Assistant</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress />
                    <Typography>Загрузка данных...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 8 }}>
                <Typography variant="h4" gutterBottom>🚀 Jira Team Assistant</Typography>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>❌ Ошибка</Typography>
                    <Typography>{error}</Typography>
                </Alert>
                <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
                    Перезагрузить
                </Button>
            </Container>
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
        <Container maxWidth="lg" sx={{ py: 2 }}>
            <div className={styles.app}>
                <Tabs
                    activeTab={appUiStore.activeTab}
                    onChange={appUiStore.setActiveTab}
                />

                {appUiStore.activeTab === 'issues' && (
                    <div>
                        <ProjectStatsPanel
                            issues={issues}
                            users={users}
                            projects={projects}
                            currentProject={currentProject || ''}
                            onProjectChange={handleProjectChange}
                            unassignedCount={unassignedIssues.length}
                            problemCount={problemIssues.length}
                            onOpenAutoAssign={() => appUiStore.setShowAutoAssignConfirm(true)}
                            canAutoAssign={getActiveUsers().length > 0}
                            activeUsersCount={getActiveUsers().length}
                        />

                        <IssuesTable
                            issues={issues}
                            onFix={handleFix}
                        />
                    </div>
                )}

                {appUiStore.activeTab === 'team' && (
                    <TeamGrid
                        users={users}
                        issues={issues}
                        getUserActivity={getUserActivity}
                    />
                )}

                <AssignModal
                    show={appUiStore.showAssignModal && !!appUiStore.selectedIssue}
                    issue={appUiStore.selectedIssue}
                    users={getActiveUsers()}
                    issues={issues}
                    onAssign={handleAssignFromModal}
                    onClose={closeModals}
                />

                <PriorityModal
                    show={appUiStore.showPriorityModal && !!appUiStore.selectedIssue}
                    issue={appUiStore.selectedIssue}
                    onUpdatePriority={handleFixPriorityFromModal}
                    onClose={closeModals}
                />

                <MultiFixModal
                    show={appUiStore.showMultiFixModal && !!appUiStore.selectedIssue}
                    issue={appUiStore.selectedIssue}
                    onChooseAssign={() => { appUiStore.setShowMultiFixModal(false); appUiStore.setShowAssignModal(true); }}
                    onChoosePriority={() => { appUiStore.setShowMultiFixModal(false); appUiStore.setShowPriorityModal(true); }}
                    onClose={closeModals}
                />

                <AutoAssignConfirm
                    show={appUiStore.showAutoAssignConfirm}
                    unassignedIssues={unassignedIssues}
                    activeUsersCount={getActiveUsers().length}
                    onConfirm={handleAutoAssign}
                    onClose={closeModals}
                />
            </div>
        </Container>
    );
});
