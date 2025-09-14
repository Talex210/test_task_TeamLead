// Определяем режим разработки
const isDevMode = process.env.VITE_DEV_MODE === 'true' ||
    process.env.NODE_ENV === 'development' ||
    !window.location.hostname.includes('atlassian');

let forgeInvoke: any;
let forgeView: any;

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
    });
}

export const apiAdapter = {
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
    }
};
