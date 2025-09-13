import React, { useEffect } from 'react';
import type { JiraIssue } from './types/jira';
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
import { appDataStore } from './store/appDataStore';

export const App: React.FC = observer(() => {
    useEffect(() => {
        appDataStore.initialize();
    }, []);

    const handleAssignIssue = async (issueKey: string, accountId: string): Promise<void> => {
        try {
            await appDataStore.assignIssue(issueKey, accountId);
        } catch (error) {
            alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const handleProjectChange = async (projectKey: string): Promise<void> => {
        await appDataStore.changeProject(projectKey);
    };

    const handleAutoAssign = async (): Promise<void> => {
        try {
            await appDataStore.autoAssign();
            appUiStore.setShowAutoAssignConfirm(false);
        } catch (error) {
            alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
            appUiStore.setShowAutoAssignConfirm(false);
        }
    };

    const handleFixPriority = async (issueKey: string, priorityId: string = '3'): Promise<void> => {
        try {
            await appDataStore.updatePriority(issueKey, priorityId);
        } catch (error) {
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

    if (appDataStore.loading) {
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

    if (appDataStore.error) {
        return (
            <Container maxWidth="md" sx={{ mt: 8 }}>
                <Typography variant="h4" gutterBottom>🚀 Jira Team Assistant</Typography>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>❌ Ошибка</Typography>
                    <Typography>{appDataStore.error}</Typography>
                </Alert>
                <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
                    Перезагрузить
                </Button>
            </Container>
        );
    }

    const issues = appDataStore.issues;
    const users = appDataStore.users;
    const projects = appDataStore.projects;
    const currentProject = appDataStore.currentProject || '';

    const unassignedIssues = issues.filter(issue => !issue.assignee);

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
                            currentProject={currentProject}
                            onProjectChange={handleProjectChange}
                            unassignedCount={appDataStore.unassignedCount}
                            problemCount={appDataStore.problemCount}
                            onOpenAutoAssign={() => appUiStore.setShowAutoAssignConfirm(true)}
                            canAutoAssign={appDataStore.activeUsersCount > 0}
                            activeUsersCount={appDataStore.activeUsersCount}
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
                        getUserActivity={appDataStore.getUserActivity}
                    />
                )}

                <AssignModal
                    show={appUiStore.showAssignModal && !!appUiStore.selectedIssue}
                    issue={appUiStore.selectedIssue}
                    users={appDataStore.activeUsers}
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
                    activeUsersCount={appDataStore.activeUsersCount}
                    onConfirm={handleAutoAssign}
                    onClose={closeModals}
                />
            </div>
        </Container>
    );
});
