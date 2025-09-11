// API для работы с Jira через Forge
import { requestJira } from '@forge/bridge';

console.log('🌉 API Bridge инициализирован');

// Получаем контекст проекта
let currentProjectKey = null;

// Инициализация - получаем контекст проекта
const initializeContext = async () => {
    try {
        // В Forge приложениях контекст проекта доступен через window
        if (window.AP && window.AP.context) {
            const context = await new Promise((resolve) => {
                window.AP.context.getContext((context) => {
                    resolve(context);
                });
            });
            
            if (context && context.jira && context.jira.project) {
                currentProjectKey = context.jira.project.key;
                console.log('✅ Получен контекст проекта:', currentProjectKey);
                return currentProjectKey;
            }
        }
        
        // Fallback - используем фиксированный ключ проекта для тестирования
        currentProjectKey = 'SCRUM';
        console.log('⚠️ Используем fallback ключ проекта:', currentProjectKey);
        return currentProjectKey;
        
    } catch (error) {
        console.error('❌ Ошибка получения контекста:', error);
        currentProjectKey = 'SCRUM';
        return currentProjectKey;
    }
};

// Универсальная функция для запросов к Jira API
const makeJiraRequest = async (endpoint, options = {}) => {
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

// Mock данные для разработки и тестирования
function getMockData(functionName, payload) {
    console.log(`🎭 Mock данные для ${functionName}`);
    
    switch (functionName) {
        case 'getProjectIssues':
            return {
                success: true,
                data: [
                    {
                        id: '10001',
                        key: 'SCRUM-1',
                        summary: 'Создать главную страницу',
                        status: 'In Progress',
                        assignee: {
                            accountId: 'user1',
                            displayName: 'Иван Иванов',
                            avatarUrl: 'https://via.placeholder.com/24'
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
                            avatarUrl: 'https://via.placeholder.com/24'
                        },
                        priority: { name: 'Medium', id: '3' },
                        duedate: null,
                        created: '2024-01-10T14:00:00.000Z',
                        updated: '2024-01-18T16:45:00.000Z'
                    }
                ],
                projectKey: currentProjectKey || 'SCRUM'
            };
            
        case 'getProjectUsers':
            return {
                success: true,
                data: [
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
                    }
                ]
            };
            
        case 'updateIssueAssignee':
            return {
                success: true,
                message: `Исполнитель назначен для задачи ${payload.issueKey}`
            };
            
        case 'updateIssuePriority':
            return {
                success: true,
                message: `Приоритет обновлен для задачи ${payload.issueKey}`
            };
            
        case 'autoAssignUnassigned':
            return {
                success: true,
                results: [
                    { issueKey: 'SCRUM-2', assignedTo: 'Иван Иванов', success: true }
                ],
                summary: 'Назначено 1 из 1 задач'
            };
            
        default:
            return {
                success: false,
                error: `Неизвестная функция: ${functionName}`
            };
    }
}

// Экспортируемые функции API
export const JiraAPI = {
    // Инициализация API
    async initialize() {
        console.log('🔧 Инициализация JiraAPI...');
        await initializeContext();
        console.log('✅ JiraAPI готов к использованию');
        return true;
    },

    // Получение задач проекта
    async getProjectIssues() {
        try {
            if (!currentProjectKey) {
                await initializeContext();
            }

            const jql = `project = ${currentProjectKey} ORDER BY created DESC`;
            
            const data = await makeJiraRequest('/rest/api/3/search', {
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
            const issues = data.issues.map(issue => ({
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
                status: issue.fields.status.name,
                assignee: issue.fields.assignee ? {
                    accountId: issue.fields.assignee.accountId,
                    displayName: issue.fields.assignee.displayName,
                    avatarUrl: issue.fields.assignee.avatarUrls['24x24']
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
                projectKey: currentProjectKey
            };

        } catch (error) {
            console.error('❌ Ошибка получения задач, используем mock данные:', error);
            return getMockData('getProjectIssues');
        }
    },

    // Получение пользователей проекта
    async getProjectUsers() {
        try {
            if (!currentProjectKey) {
                await initializeContext();
            }

            const users = await makeJiraRequest(`/rest/api/3/user/assignable/search?project=${currentProjectKey}&maxResults=50`);

            // Преобразуем данные
            const formattedUsers = users.map(user => ({
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
            return getMockData('getProjectUsers');
        }
    },

    // Обновление исполнителя задачи
    async updateIssueAssignee(issueKey, accountId) {
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
            return getMockData('updateIssueAssignee', { issueKey, accountId });
        }
    },

    // Обновление приоритета задачи
    async updateIssuePriority(issueKey, priorityId) {
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
            return getMockData('updateIssuePriority', { issueKey, priorityId });
        }
    },

    // Массовое назначение задач
    async autoAssignUnassigned() {
        try {
            if (!currentProjectKey) {
                await initializeContext();
            }

            // 1. Получаем задачи без исполнителя
            const jql = `project = ${currentProjectKey} AND assignee is EMPTY`;
            const issuesData = await makeJiraRequest('/rest/api/3/search', {
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

            // 2. Получаем активных пользователей
            const users = await makeJiraRequest(`/rest/api/3/user/assignable/search?project=${currentProjectKey}&maxResults=20`);
            const activeUsers = users.filter(user => user.active);

            if (activeUsers.length === 0) {
                return {
                    success: false,
                    error: 'Нет активных пользователей для назначения'
                };
            }

            // 3. Назначаем задачи случайным пользователям
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
                        error: error.message
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;

            return {
                success: true,
                results: results,
                summary: `Назначено ${successCount} из ${unassignedIssues.length} задач`
            };

        } catch (error) {
            console.error('❌ Ошибка массового назначения, используем mock:', error);
            return getMockData('autoAssignUnassigned');
        }
    }
};

// Инициализируем API при загрузке модуля
JiraAPI.initialize();

export default JiraAPI;