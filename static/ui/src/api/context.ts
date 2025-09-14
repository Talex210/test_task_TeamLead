declare global {
    interface Window {
        AP?: {
            context: {
                getContext: (callback: (context: any) => void) => void;
            };
        };
    }
}

// Определяем режим разработки
const isDevMode = process.env.VITE_DEV_MODE === 'true' ||
    process.env.NODE_ENV === 'development' ||
    !window.location.hostname.includes('atlassian');

let currentProjectKey: string | null = null;

export const initializeContext = async (): Promise<string> => {
    try {
        if (isDevMode) {
            console.log('🔧 Dev Mode: используем mock контекст');
            currentProjectKey = 'SCRUM';
            return currentProjectKey;
        }

        if (window.AP && window.AP.context) {
            const context = await new Promise<any>((resolve) => {
                window.AP!.context.getContext((ctx: any) => {
                    resolve(ctx);
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

export const setCurrentProjectKey = (projectKey: string): string => {
    console.log(`🔄 Смена проекта на: ${projectKey}`);
    currentProjectKey = projectKey;
    return currentProjectKey;
};

export const getCurrentProjectKey = (): string | null => currentProjectKey;
