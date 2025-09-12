import api, { route } from '@forge/api';

// Экспортируем функции для использования в веб-ресурсе
export async function getProjectIssues(projectKey) {
    console.log('🔍 Получение задач проекта:', projectKey);

    try {
        // JQL запрос для получения задач
        const jql = `project = ${projectKey} ORDER BY created DESC`;

        // API запрос к Jira
        const response = await api.asUser().requestJira(route`/rest/api/3/search`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
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

        const data = await response.json();
        console.log(`✅ Получено ${data.issues.length} задач`);

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
            projectKey: projectKey
        };

    } catch (error) {
        console.error('❌ Ошибка получения задач:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export async function getProjectUsers(projectKey) {
    console.log('👥 Получение пользователей проекта:', projectKey);

    try {
        // Получаем пользователей, которые могут быть назначены на задачи
        const response = await api.asUser().requestJira(
            route`/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=50`
        );

        const users = await response.json();
        console.log(`✅ Получено ${users.length} пользователей`);

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
        console.error('❌ Ошибка получения пользователей:', error);
        return {
            success: false,
            error: error.message
        };
    }
}