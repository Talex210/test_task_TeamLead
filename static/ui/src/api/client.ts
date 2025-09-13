import { requestJira } from '@forge/bridge';

console.log('🌉 API Bridge инициализирован');

export const makeJiraRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
        console.log(`📡 Запрос к Jira API: ${endpoint}`);

        const response = await requestJira(endpoint, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Ответ от Jira API:`, data);
        return data as T;
    } catch (error) {
        console.error(`❌ Ошибка запроса к Jira API:`, error);
        throw error;
    }
};
