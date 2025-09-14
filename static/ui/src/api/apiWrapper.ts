// Обёртка для API вызовов с поддержкой mock режима

// Определяем режим разработки
const isDevMode = process.env.VITE_DEV_MODE === 'true' ||
    process.env.NODE_ENV === 'development' ||
    !window.location.hostname.includes('atlassian');

let forgeInvoke: any;
let forgeView: any;
let requestJira: any;

if (isDevMode) {
    // В dev режиме используем mock
    console.log('🔧 Загружаем mock версию Forge API');
    import('./forgeMock').then((mock) => {
        forgeInvoke = mock.mockForgeInvoke;
        forgeView = mock.mockForgeView;
    });
} else {
    // В production используем реальный Forge
    import('@forge/bridge').then((forge) => {
        forgeInvoke = forge.invoke;
        forgeView = forge.view;
        requestJira = forge.requestJira;
    });
}

export const apiWrapper = {
    async invoke(functionName: string, payload?: any): Promise<any> {
        if (isDevMode && forgeInvoke) {
            return forgeInvoke(functionName, payload);
        }

        if (!isDevMode && forgeInvoke) {
            return forgeInvoke(functionName, payload);
        }

        // Fallback если модули еще не загружены
        await new Promise(resolve => setTimeout(resolve, 100));

        if (isDevMode) {
            const { mockForgeInvoke } = await import('./forgeMock');
            return mockForgeInvoke(functionName, payload);
        } else {
            const { invoke } = await import('@forge/bridge');
            return invoke(functionName, payload);
        }
    },

    async getContext(): Promise<any> {
        if (isDevMode && forgeView) {
            return forgeView.getContext();
        }

        if (!isDevMode && forgeView) {
            return forgeView.getContext();
        }

        // Fallback
        if (isDevMode) {
            const { mockForgeView } = await import('./forgeMock');
            return mockForgeView.getContext();
        } else {
            const { view } = await import('@forge/bridge');
            return view.getContext();
        }
    },

    // Для обратной совместимости с существующим кодом
    async makeJiraRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        if (isDevMode) {
            // В dev режиме используем mock данные
            console.log(`🔧 Mock запрос к: ${endpoint}`);

            // Мапим эндпоинты на функции mock
            if (endpoint.includes('/search')) {
                const { mockForgeInvoke } = await import('./forgeMock');
                const response = await mockForgeInvoke('getProjectIssues', {
                    projectKey: 'SCRUM',
                    ...options
                });
                return response.data as T;
            }

            if (endpoint.includes('/user/search')) {
                const { mockForgeInvoke } = await import('./forgeMock');
                const response = await mockForgeInvoke('getProjectUsers', options);
                return response.data as T;
            }

            if (endpoint.includes('/project/search')) {
                const { mockForgeInvoke } = await import('./forgeMock');
                const response = await mockForgeInvoke('getProjects', options);
                return response.data as T;
            }

            // Для других запросов возвращаем заглушку
            return {} as T;
        } else {
            // В production используем реальный requestJira
            if (!requestJira) {
                const { requestJira: realRequestJira } = await import('@forge/bridge');
                requestJira = realRequestJira;
            }

            // Используем оригинальную логику из client.ts
            const response = await requestJira(endpoint, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    ...(options.body ? { 'Content-Type': 'application/json' } : {})
                },
                ...options
            });

            // Простейший парсинг ответа
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText} on ${endpoint}`);
            }

            if (response.status === 204 || response.status === 205) {
                return null as T;
            }

            const text = await response.text();
            if (!text || !text.trim()) {
                return null as T;
            }

            try {
                return JSON.parse(text) as T;
            } catch {
                return text as T;
            }
        }
    }
};

export default apiWrapper;
