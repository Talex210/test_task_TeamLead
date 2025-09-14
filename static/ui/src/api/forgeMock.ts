// Mock implementation for Forge Bridge when running in development mode

export const mockForgeView = {
    async getContext(): Promise<any> {
        return {
            cspNonce: undefined, // Для локальной разработки CSP nonce не нужен
            extension: {
                project: {
                    key: 'SCRUM',
                    id: '10000'
                }
            }
        };
    }
};

export const mockForgeInvoke = async (functionName: string, payload?: any): Promise<any> => {
    // Используем существующие mock данные
    const { getMockData } = await import('./mock');
    console.log(`🔧 Dev Mode: Вызов ${functionName} с данными:`, payload);

    // Небольшая задержка для имитации сетевого запроса
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

    return getMockData(functionName, payload);
};

// Mock для всего @forge/bridge модуля
export const forgeBridgeMock = {
    view: mockForgeView,
    invoke: mockForgeInvoke
};
