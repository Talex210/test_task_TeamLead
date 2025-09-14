import { requestJira } from '@forge/bridge';

// Определяем режим разработки
const isDevMode = process.env.VITE_DEV_MODE === 'true' ||
    process.env.NODE_ENV === 'development' ||
    !window.location.hostname.includes('atlassian');

console.log(`🔧 DevClient: режим разработки = ${isDevMode}`);

async function parseResponseSafe(response: Response): Promise<unknown | null> {
    // 204/205 не содержат тела
    if (response.status === 204 || response.status === 205) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Читаем как текст один раз, дальше решаем — парсить JSON или вернуть текст/ null
    const text = await response.text();

    if (!text || !text.trim()) {
        return null;
    }

    if (isJson) {
        try {
            return JSON.parse(text);
        } catch {
            // Если JSON сломан — не кидаем SyntaxError в UI
            return null;
        }
    }

    // Нежелательно, но иногда полезно — вернуть сырой текст
    return text;
}

// Mock функция для имитации requestJira
const mockRequestJira = async (endpoint: string, options: RequestInit = {}) => {
    console.log(`🎭 Mock Request: ${endpoint}`, options);

    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

    // Возвращаем успешный ответ с пустым телом для большинства запросов
    return new Response('{}', {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const makeJiraRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
        console.log(`📡 Запрос к Jira API: ${endpoint}`);

        let response: Response;

        if (isDevMode) {
            // В режиме разработки используем mock
            response = await mockRequestJira(endpoint, options);
        } else {
            // В production используем реальный requestJira
            response = await requestJira(endpoint, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    // Content-Type ставим только когда реально есть тело запроса
                    ...(options.body ? { 'Content-Type': 'application/json' } : {})
                },
                ...options
            });
        }

        const data = await parseResponseSafe(response);

        if (!response.ok) {
            // Сформируем осмысленную ошибку
            const message =
                (typeof data === 'string' && data) ||
                (data && typeof data === 'object' && 'message' in (data as any) && String((data as any).message)) ||
                response.statusText ||
                'Unknown error';

            console.warn('❌ Ошибка запроса к Jira API:', { status: response.status, body: data });
            throw new Error(`HTTP ${response.status} ${response.statusText} on ${endpoint}: ${message}`);
        }

        console.log('✅ Ответ от Jira API:', data ?? { status: response.status, note: 'no content' });
        return data as T;
    } catch (error) {
        console.error('❌ Ошибка запроса к Jira API:', error);
        throw error;
    }
};
