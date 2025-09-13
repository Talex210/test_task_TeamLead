import { requestJira } from '@forge/bridge';

console.log('🌉 API Bridge инициализирован');

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

export const makeJiraRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
        console.log(`📡 Запрос к Jira API: ${endpoint}`);

        const response = await requestJira(endpoint, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                // Content-Type ставим только когда реально есть тело запроса
                ...(options.body ? { 'Content-Type': 'application/json' } : {})
            },
            ...options
        });

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
        // Для 204/empty body вернётся null, приведём тип как T | null и оставим вызывающей стороне решать.
        return data as T;
    } catch (error) {
        console.error('❌ Ошибка запроса к Jira API:', error);
        throw error;
    }
};
