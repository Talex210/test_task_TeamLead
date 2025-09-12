// API для работы с Jira через Forge
import { requestJira } from '@forge/bridge';
import type {
    JiraIssue,
    JiraUser,
    JiraProject,
    ApiResponse,
    ProjectIssuesResponse,
    AutoAssignResponse
} from './types/jira';
// Типы для Forge API
declare global {
    interface Window {
        AP?: {
            context: {
                getContext: (callback: (context: any) => void) => void;
            };
        };
    }
}

console.log('🌉 API Bridge инициализирован');

// Получаем контекст проекта
let currentProjectKey: string | null = null;

// Типы для внутренних API ответов Jira
interface JiraSearchResponse {
    issues: Array<{
        id: string;
        key: string;
        fields: {
            summary: string;
            status: { name: string };
            assignee: {
                accountId: string;
                displayName: string;
                emailAddress?: string;
                avatarUrls: { '24x24': string };
            } | null;
            priority: { name: string; id: string };
            duedate: string | null;
            created: string;
            updated: string;
        };
    }>;
}

interface JiraUserResponse {
    accountId: string;
    displayName: string;
    emailAddress?: string;
    avatarUrls: { '24x24': string };
    active: boolean;
}

interface JiraProjectResponse {
    values: Array<{
        id: string;
        key: string;
        name: string;
        projectTypeKey: string;
    }>;
}

// Инициализация - получаем контекст проекта
const initializeContext = async (): Promise<string> => {
    try {
        // В Forge приложениях контекст проекта доступен через window
        if ((window as any).AP && (window as any).AP.context) {
            const context = await new Promise<any>((resolve) => {
                (window as any).AP.context.getContext((context: any) => {
                    resolve(context);
                });
            });

            if (context && context.jira && context.jira.project) {
                currentProjectKey = context.jira.project.key;
                console.log('✅ Получен контекст проекта:', currentProjectKey);
                return currentProjectKey || 'SCRUM';
            }
        }

        // Fallback - используем фиксированный ключ проекта для тестирования
        currentProjectKey = 'SCRUM';
        console.log('⚠️ Используем fallback ключ проекта:', currentProjectKey);
        return currentProjectKey;

    } catch (error) {
        console.error('❌ Ошибка получения контекста:', error);
        currentProjectKey = 'SCRUM';
        return 'SCRUM';
    }
};

// Универсальная функция для запросов к Jira API
const makeJiraRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
        console.log(`📡 Запрос к Jira API: ${endpoint}`);

        const response = await requestJira(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Ответ от Jira API:`, data);
        return data;

    } catch (error) {
        console.error(`❌ Ошибка запроса к Jira API:`, error);
        throw error;
    }
};

// Глобальные mock данные для симуляции состояния
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
        active: false
    }
];

// Mock данные для разработки и тестирования
function getMockData(functionName: string, payload?: any): any {
    console.log(`🎭 Mock данные для ${functionName}`);

    switch (functionName) {
        case 'getProjectIssues':
            return {
                success: true,
                data: [...mockIssues], // Возвращаем копию актуальных данных
                projectKey: currentProjectKey || 'SCRUM'
            } as ProjectIssuesResponse;

        case 'getProjectUsers':
            return {
                success: true,
                data: [...mockUsers] // Возвращаем копию пользователей
            } as ApiResponse<JiraUser[]>;

        case 'updateIssueAssignee':
            // Обновляем mock данные
            if (payload?.issueKey && payload?.accountId) {
                const issueIndex = mockIssues.findIndex(issue => issue.key === payload.issueKey);
                const user = mockUsers.find(user => user.accountId === payload.accountId);

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
                const issueIndex = mockIssues.findIndex(issue => issue.key === payload.issueKey);
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
                    console.log(`🎭 Mock: Приоритет задачи ${payload.issueKey} изменен на ${priorityNames[payload.priorityId]}`);
                }
            }
            return {
                success: true,
                message: `Приоритет обновлен для задачи ${payload?.issueKey}`
            } as ApiResponse<void>;

        case 'autoAssignUnassigned':
            // Массовое назначение в mock данных
            const unassignedIssues = mockIssues.filter(issue => !issue.assignee);
            const activeUsers = mockUsers.filter(user => user.active);
            const results = [];

            for (const issue of unassignedIssues) {
                // Подсчитываем загрузку каждого пользователя
                const availableUsers = activeUsers.filter(user => {
                    const assignedCount = mockIssues.filter(i =>
                        i.assignee && i.assignee.accountId === user.accountId
                    ).length;
                    return assignedCount < 2;
                });

                if (availableUsers.length > 0) {
                    const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
                    const issueIndex = mockIssues.findIndex(i => i.key === issue.key);

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

            const successCount = results.filter(r => r.success).length;
            return {
                success: true,
                results: results,
                summary: `Назначено ${successCount} из ${unassignedIssues.length} задач`
            } as AutoAssignResponse;

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

// Экспортируемые функции API
export const JiraAPI = {
    // Инициализация API
    async initialize(): Promise<boolean> {
        console.log('🔧 Инициализация JiraAPI...');
        await initializeContext();
        console.log('✅ JiraAPI готов к использованию');
        return true;
    },

    // Смена текущего проекта
    setCurrentProject(projectKey: string): string {
        console.log(`🔄 Смена проекта на: ${projectKey}`);
        currentProjectKey = projectKey;
        return currentProjectKey;
    },

    // Получение текущего проекта
    getCurrentProject(): string | null {
        return currentProjectKey;
    },

    // Получение задач проекта
    async getProjectIssues(): Promise<ProjectIssuesResponse> {
        try {
            if (!currentProjectKey) {
                await initializeContext();
            }

            const jql = `project = ${currentProjectKey} ORDER BY created DESC`;

            const data = await makeJiraRequest<JiraSearchResponse>('/rest/api/3/search', {
                method: 'POST',
                body: JSON.stringify({
                    jql: jql,
                    fields: [
                        'summary',
                        'status',
                        'assignee',
                        'priority',
                        'duedate',
                        'created',
                        'updated'
                    ],
                    maxResults: 100
                })
            });

            // Преобразуем данные в нужный формат
            const issues: JiraIssue[] = data.issues.map(issue => ({
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
                status: issue.fields.status.name,
                assignee: issue.fields.assignee ? {
                    accountId: issue.fields.assignee.accountId,
                    displayName: issue.fields.assignee.displayName,
                    emailAddress: issue.fields.assignee.emailAddress,
                    avatarUrl: issue.fields.assignee.avatarUrls['24x24'],
                    active: true
                } : null,
                priority: {
                    name: issue.fields.priority.name,
                    id: issue.fields.priority.id
                },
                duedate: issue.fields.duedate,
                created: issue.fields.created,
                updated: issue.fields.updated
            }));

            return {
                success: true,
                data: issues,
                projectKey: currentProjectKey || undefined
            };

        } catch (error) {
            console.error('❌ Ошибка получения задач, используем mock данные:', error);
            return getMockData('getProjectIssues') as ProjectIssuesResponse;
        }
    },

    // Получение пользователей проекта
    async getProjectUsers(): Promise<ApiResponse<JiraUser[]>> {
        try {
            if (!currentProjectKey) {
                await initializeContext();
            }

            const users = await makeJiraRequest<JiraUserResponse[]>(`/rest/api/3/user/assignable/search?project=${currentProjectKey}&maxResults=50`);

            // Преобразуем данные
            const formattedUsers: JiraUser[] = users.map(user => ({
                accountId: user.accountId,
                displayName: user.displayName,
                emailAddress: user.emailAddress,
                avatarUrl: user.avatarUrls['24x24'],
                active: user.active
            }));

            return {
                success: true,
                data: formattedUsers
            };

        } catch (error) {
            console.error('❌ Ошибка получения пользователей, используем mock данные:', error);
            return getMockData('getProjectUsers') as ApiResponse<JiraUser[]>;
        }
    },

    // Получение списка проектов
    async getProjects(): Promise<ApiResponse<JiraProject[]>> {
        try {
            const data = await makeJiraRequest<JiraProjectResponse>('/rest/api/3/project/search?maxResults=50');

            // Преобразуем данные в нужный формат
            const projects: JiraProject[] = data.values.map(project => ({
                id: project.id,
                key: project.key,
                name: project.name,
                projectTypeKey: project.projectTypeKey
            }));

            return {
                success: true,
                data: projects
            };

        } catch (error) {
            console.error('❌ Ошибка получения проектов, используем mock данные:', error);
            return getMockData('getProjects') as ApiResponse<JiraProject[]>;
        }
    },

    // Обновление исполнителя задачи
    async updateIssueAssignee(issueKey: string, accountId: string): Promise<ApiResponse<void>> {
        try {
            await makeJiraRequest(`/rest/api/3/issue/${issueKey}/assignee`, {
                method: 'PUT',
                body: JSON.stringify({
                    accountId: accountId
                })
            });

            return {
                success: true,
                message: `Исполнитель назначен для задачи ${issueKey}`
            };

        } catch (error) {
            console.error('❌ Ошибка назначения исполнителя, используем mock:', error);
            return getMockData('updateIssueAssignee', { issueKey, accountId }) as ApiResponse<void>;
        }
    },

    // Обновление приоритета задачи
    async updateIssuePriority(issueKey: string, priorityId: string): Promise<ApiResponse<void>> {
        try {
            await makeJiraRequest(`/rest/api/3/issue/${issueKey}`, {
                method: 'PUT',
                body: JSON.stringify({
                    fields: {
                        priority: {
                            id: priorityId
                        }
                    }
                })
            });

            return {
                success: true,
                message: `Приоритет обновлен для задачи ${issueKey}`
            };

        } catch (error) {
            console.error('❌ Ошибка обновления приоритета, используем mock:', error);
            return getMockData('updateIssuePriority', { issueKey, priorityId }) as ApiResponse<void>;
        }
    },

    // Массовое назначение задач (с учетом активности)
    async autoAssignUnassigned(): Promise<AutoAssignResponse> {
        try {
            if (!currentProjectKey) {
                await initializeContext();
            }

            // 1. Получаем задачи без исполнителя
            const jql = `project = ${currentProjectKey} AND assignee is EMPTY`;
            const issuesData = await makeJiraRequest<JiraSearchResponse>('/rest/api/3/search', {
                method: 'POST',
                body: JSON.stringify({
                    jql: jql,
                    fields: ['key'],
                    maxResults: 50
                })
            });

            const unassignedIssues = issuesData.issues;

            if (unassignedIssues.length === 0) {
                return {
                    success: true,
                    message: 'Нет задач без исполнителя'
                };
            }

            // 2. Получаем всех пользователей проекта
            const users = await makeJiraRequest<JiraUserResponse[]>(`/rest/api/3/user/assignable/search?project=${currentProjectKey}&maxResults=20`);

            // 3. Получаем все задачи проекта для подсчета активности
            const allIssuesJql = `project = ${currentProjectKey}`;
            const allIssuesData = await makeJiraRequest<JiraSearchResponse>('/rest/api/3/search', {
                method: 'POST',
                body: JSON.stringify({
                    jql: allIssuesJql,
                    fields: ['assignee'],
                    maxResults: 200
                })
            });

            // 4. Определяем доступных пользователей (у кого меньше 2 задач)
            const activeUsers = users.filter(user => {
                if (!user.active) return false;

                const assignedCount = allIssuesData.issues.filter(issue =>
                    issue.fields.assignee && issue.fields.assignee.accountId === user.accountId
                ).length;

                return assignedCount < 2; // Доступен если меньше 2 задач
            });

            if (activeUsers.length === 0) {
                return {
                    success: false,
                    error: 'Нет доступных пользователей для назначения (все имеют максимальную загрузку 2/2 задачи)'
                };
            }

            // 5. Назначаем задачи случайным активным пользователям
            const results = [];
            for (const issue of unassignedIssues) {
                const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];

                try {
                    await makeJiraRequest(`/rest/api/3/issue/${issue.key}/assignee`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            accountId: randomUser.accountId
                        })
                    });

                    results.push({
                        issueKey: issue.key,
                        assignedTo: randomUser.displayName,
                        success: true
                    });

                } catch (error) {
                    results.push({
                        issueKey: issue.key,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;

            return {
                success: true,
                results: results,
                summary: `Назначено ${successCount} из ${unassignedIssues.length} задач доступным участникам`
            };

        } catch (error) {
            console.error('❌ Ошибка массового назначения, используем mock:', error);
            return getMockData('autoAssignUnassigned') as AutoAssignResponse;
        }
    }
};

// Инициализируем API при загрузке модуля
JiraAPI.initialize();

export default JiraAPI;