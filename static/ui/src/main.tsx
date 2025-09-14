import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { App } from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/utilities.css';
import { createEmotionCache } from './mui/emotionCache';

const theme = createTheme();

// Проверяем режим разработки
const isDevMode = process.env.VITE_DEV_MODE === 'true' ||
    process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    !window.location.hostname.includes('atlassian');

console.log(`🔧 Режим приложения: ${isDevMode ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🌍 Hostname: ${window.location.hostname}`);
console.log(`🔧 VITE_DEV_MODE: ${process.env.VITE_DEV_MODE}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);

const Root: React.FC = () => {
    const [cache, setCache] = useState<ReturnType<typeof createEmotionCache> | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                if (isDevMode) {
                    console.log('🔧 DEV MODE: Инициализируем без Forge Bridge');
                    // В dev режиме создаём cache сразу без nonce
                    if (mounted) {
                        const created = createEmotionCache();
                        setCache(created);
                        setIsReady(true);
                    }
                } else {
                    console.log('🚀 PROD MODE: Инициализируем с Forge Bridge');

                    // Только в production режиме пытаемся загрузить Forge
                    try {
                        const forgeModule = await import('@forge/bridge');
                        const ctx = await forgeModule.view.getContext();

                        let nonce: string | undefined;
                        if (ctx && typeof ctx.cspNonce === 'string') {
                            console.log('🔐 CSP nonce получен из Forge контекста');
                            nonce = ctx.cspNonce;
                        } else {
                            console.warn('⚠️ CSP nonce недоступен в контексте Forge');
                        }

                        if (mounted) {
                            const created = createEmotionCache(nonce);
                            setCache(created);
                            setIsReady(true);
                        }
                    } catch (forgeError) {
                        console.warn('⚠️ Не удалось загрузить Forge Bridge, работаем без него:', forgeError);

                        if (mounted) {
                            // Fallback: создаём cache без nonce
                            const created = createEmotionCache();
                            setCache(created);
                            setIsReady(true);
                        }
                    }
                }
            } catch (e) {
                console.error('❌ Критическая ошибка при инициализации:', e);

                if (mounted) {
                    // В любом случае пытаемся запустить приложение
                    const created = createEmotionCache();
                    setCache(created);
                    setIsReady(true);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    if (!cache || !isReady) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#666',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <div>
                    {isDevMode ? '🔧 Инициализация dev режима...' : '🚀 Подключение к Forge...'}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    Режим: {isDevMode ? 'Development' : 'Production'}
                </div>
            </div>
        );
    }

    return (
        <CacheProvider value={cache}>
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        </CacheProvider>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
