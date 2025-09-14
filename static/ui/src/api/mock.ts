import type { ApiResponse, JiraIssue, JiraProject, JiraUser, ProjectIssuesResponse, AutoAssignResponse } from '../types/jira';
import { getCurrentProjectKey } from './context';

let mockIssues: JiraIssue[] = [
    {
        id: '10001',
        key: 'SCRUM-1',
        summary: 'Создать главную страницу',
        status: 'In Progress',
        assignee: {
            accountId: 'user1',
            displayName: 'Иван Иванов',
            emailAddress: 'ivan@example.com',
            avatarUrl: 'https://via.placeholder.com/24',
            active: true
        },
        priority: { name: 'High', id: '1' },
        duedate: '2024-12-31',
        created: '2024-01-15T10:00:00.000Z',
        updated: '2024-01-20T15:30:00.000Z'
    },
    {
        id: '10002',
        key: 'SCRUM-2',
        summary: 'Настроить базу данных',
        status: 'To Do',
        assignee: null,
        priority: { name: 'Low', id: '4' },
        duedate: '2024-12-25',
        created: '2024-01-16T09:00:00.000Z',
        updated: '2024-01-16T09:00:00.000Z'
    },
    {
        id: '10003',
        key: 'SCRUM-3',
        summary: 'Добавить аутентификацию',
        status: 'Done',
        assignee: {
            accountId: 'user2',
            displayName: 'Мария Петрова',
            emailAddress: 'maria@example.com',
            avatarUrl: 'https://via.placeholder.com/24',
            active: true
        },
        priority: { name: 'Medium', id: '3' },
        duedate: null,
        created: '2024-01-10T14:00:00.000Z',
        updated: '2024-01-18T16:45:00.000Z'
    },
    {
        id: '10004',
        key: 'SCRUM-4',
        summary: 'Исправить мелкие баги в UI',
        status: 'To Do',
        assignee: {
            accountId: 'user3',
            displayName: 'Алексей Сидоров',
            emailAddress: 'alex@example.com',
            avatarUrl: 'https://via.placeholder.com/24',
            active: true
        },
        priority: { name: 'Lowest', id: '5' },
        duedate: '2024-12-20',
        created: '2024-01-17T11:00:00.000Z',
        updated: '2024-01-17T11:00:00.000Z'
    },
    {
        id: '10005',
        key: 'SCRUM-5',
        summary: 'Обновить документацию',
        status: 'To Do',
        assignee: null,
        priority: { name: 'Lowest', id: '5' },
        duedate: '2024-12-22',
        created: '2024-01-18T09:00:00.000Z',
        updated: '2024-01-18T09:00:00.000Z'
    },
    {
        id: '10006',
        key: 'SCRUM-6',
        summary: 'Настроить CI/CD pipeline',
        status: 'In Progress',
        assignee: {
            accountId: 'user1',
            displayName: 'Иван Иванов',
            emailAddress: 'ivan@example.com',
            avatarUrl: 'https://via.placeholder.com/24',
            active: true
        },
        priority: { name: 'High', id: '2' },
        duedate: null,
        created: '2024-01-19T10:00:00.000Z',
        updated: '2024-01-20T11:00:00.000Z'
    },
    {
        id: '10007',
        key: 'SCRUM-7',
        summary: 'Добавить unit тесты',
        status: 'To Do',
        assignee: {
            accountId: 'user2',
            displayName: 'Мария Петрова',
            emailAddress: 'maria@example.com',
            avatarUrl: 'https://via.placeholder.com/24',
            active: true
        },
        priority: { name: 'Medium', id: '3' },
        duedate: '2024-12-30',
        created: '2024-01-20T09:00:00.000Z',
        updated: '2024-01-20T09:00:00.000Z'
    },
    {
        id: '10008',
        key: 'SCRUM-8',
        summary: 'Оптимизировать производительность',
        status: 'To Do',
        assignee: {
            accountId: 'user4',
            displayName: 'Елена Козлова',
            emailAddress: 'elena@example.com',
            avatarUrl: 'https://via.placeholder.com/24',
            active: true
        },
        priority: { name: 'Low', id: '4' },
        duedate: null,
        created: '2024-01-21T14:00:00.000Z',
        updated: '2024-01-21T14:00:00.000Z'
    },
    {
        id: '10010',
        key: 'SCRUM-10',
        summary: 'Вторая задача для Елены',
        status: 'In Progress',
        assignee: {
            accountId: 'user4',
            displayName: 'Елена Козлова',
            emailAddress: 'elena@example.com',
            avatarUrl: 'https://via.placeholder.com/24',
            active: true
        },
        priority: { name: 'Medium', id: '3' },
        duedate: null,
        created: '2024-01-23T10:00:00.000Z',
        updated: '2024-01-23T10:00:00.000Z'
    },
    {
        id: '10009',
        key: 'SCRUM-9',
        summary: 'Исправить критический баг',
        status: 'To Do',
        assignee: null,
        priority: { name: 'Highest', id: '1' },
        duedate: '2024-12-18',
        created: '2024-01-22T16:00:00.000Z',
        updated: '2024-01-22T16:00:00.000Z'
    }
];

const mockUsers: JiraUser[] = [
    {
        accountId: 'user1',
        displayName: 'Иван Иванов',
        emailAddress: 'ivan@example.com',
        avatarUrl: 'https://via.placeholder.com/24',
        active: true
    },
    {
        accountId: 'user2',
        displayName: 'Мария Петрова',
        emailAddress: 'maria@example.com',
        avatarUrl: 'https://via.placeholder.com/24',
        active: true
    },
    {
        accountId: 'user3',
        displayName: 'Алексей Сидоров',
        emailAddress: 'alex@example.com',
        avatarUrl: 'https://via.placeholder.com/24',
        active: true
    },
    {
        accountId: 'user4',
        displayName: 'Елена Козлова',
        emailAddress: 'elena@example.com',
        avatarUrl: 'https://via.placeholder.com/24',
        active: true
    },
    {
        accountId: 'user5',
        displayName: 'Дмитрий Новиков',
        emailAddress: 'dmitry@example.com',
        avatarUrl: 'https://via.placeholder.com/24',
        active: true
    }
];

export function getMockData(functionName: string, payload?: any): any {
    console.log(`🎭 Mock данные для ${functionName}`);

    switch (functionName) {
        case 'getProjectIssues':
            return {
                success: true,
                data: [...mockIssues],
                projectKey: getCurrentProjectKey() || 'SCRUM'
            } as ProjectIssuesResponse;

        case 'getProjectUsers':
            return {
                success: true,
                data: [...mockUsers]
            } as ApiResponse<JiraUser[]>;

        case 'updateIssueAssignee':
            // Обновляем mock данные
            if (payload?.issueKey && payload?.accountId) {
                const issueIndex = mockIssues.findIndex((issue) => issue.key === payload.issueKey);
                const user = mockUsers.find((user) => user.accountId === payload.accountId);

                if (issueIndex !== -1 && user) {
                    mockIssues[issueIndex] = {
                        ...mockIssues[issueIndex],
                        assignee: user,
                        updated: new Date().toISOString()
                    };
                    console.log(`🎭 Mock: Назначен ${user.displayName} на задачу ${payload.issueKey}`);
                }
            }
            return {
                success: true,
                message: `Исполнитель назначен для задачи ${payload?.issueKey}`
            } as ApiResponse<void>;

        case 'updateIssuePriority':
            // Обновляем приоритет в mock данных
            if (payload?.issueKey && payload?.priorityId) {
                const issueIndex = mockIssues.findIndex((issue) => issue.key === payload.issueKey);
                if (issueIndex !== -1) {
                    const priorityNames: { [key: string]: string } = {
                        '1': 'Highest',
                        '2': 'High',
                        '3': 'Medium',
                        '4': 'Low',
                        '5': 'Lowest'
                    };

                    mockIssues[issueIndex] = {
                        ...mockIssues[issueIndex],
                        priority: {
                            id: payload.priorityId,
                            name: priorityNames[payload.priorityId] || 'Medium'
                        },
                        updated: new Date().toISOString()
                    };
                    console.log(
                        `🎭 Mock: Приоритет задачи ${payload.issueKey} изменен на ${priorityNames[payload.priorityId]}`
                    );
                }
            }
            return {
                success: true,
                message: `Приоритет обновлен для задачи ${payload?.issueKey}`
            } as ApiResponse<void>;

        case 'autoAssignUnassigned': {
            // Массовое назначение в mock данных
            const unassignedIssues = mockIssues.filter((issue) => !issue.assignee);
            const activeUsers = mockUsers.filter((user) => user.active);
            const results: Array<{ issueKey: string; assignedTo?: string; success: boolean; error?: string }> = [];

            for (const issue of unassignedIssues) {
                // Подсчитываем загрузку каждого пользователя
                const availableUsers = activeUsers.filter((user) => {
                    const assignedCount = mockIssues.filter((i) => i.assignee && i.assignee.accountId === user.accountId).length;
                    return assignedCount < 2;
                });

                if (availableUsers.length > 0) {
                    const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
                    const issueIndex = mockIssues.findIndex((i) => i.key === issue.key);

                    if (issueIndex !== -1) {
                        mockIssues[issueIndex] = {
                            ...mockIssues[issueIndex],
                            assignee: randomUser,
                            updated: new Date().toISOString()
                        };

                        results.push({
                            issueKey: issue.key,
                            assignedTo: randomUser.displayName,
                            success: true
                        });
                        console.log(`🎭 Mock: Автоназначение ${randomUser.displayName} на ${issue.key}`);
                    }
                } else {
                    results.push({
                        issueKey: issue.key,
                        success: false,
                        error: 'Нет доступных пользователей'
                    });
                }
            }

            const successCount = results.filter((r) => r.success).length;
            return {
                success: true,
                results,
                summary: `Назначено ${successCount} из ${unassignedIssues.length} задач`
            } as AutoAssignResponse;
        }

        case 'getProjects':
            return {
                success: true,
                data: [
                    {
                        id: '10000',
                        key: 'SCRUM',
                        name: 'Scrum Project',
                        projectTypeKey: 'software'
                    },
                    {
                        id: '10001',
                        key: 'KANBAN',
                        name: 'Kanban Board',
                        projectTypeKey: 'software'
                    },
                    {
                        id: '10002',
                        key: 'SUPPORT',
                        name: 'Support Desk',
                        projectTypeKey: 'service_desk'
                    }
                ] as JiraProject[]
            } as ApiResponse<JiraProject[]>;

        default:
            return {
                success: false,
                error: `Неизвестная функция: ${functionName}`
            } as ApiResponse<never>;
    }
}
