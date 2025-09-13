import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { view } from '@forge/bridge';
import { App } from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/utilities.css';
import { createEmotionCache } from './mui/emotionCache';

const theme = createTheme();

const Root: React.FC = () => {
    const [nonce, setNonce] = useState<string | undefined>(undefined);
    const [cache, setCache] = useState<ReturnType<typeof createEmotionCache> | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                // Пытаемся получить nonce для CSP из Forge
                const ctx = await view.getContext();
                if (mounted && ctx && typeof ctx.cspNonce === 'string') {
                    console.log('🔐 CSP nonce получен из Forge контекста');
                    setNonce(ctx.cspNonce);
                } else {
                    console.warn('⚠️ CSP nonce недоступен в контексте Forge, стили будут вставляться без nonce');
                }
            } catch (e) {
                console.warn('⚠️ Не удалось получить Forge контекст (nonce):', e);
            } finally {
                // Создаём Emotion cache один раз (с nonce, если удалось получить)
                if (mounted) {
                    const created = createEmotionCache(nonce);
                    setCache(created);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [nonce]);

    if (!cache) {
        // Можно показать лёгкий прелоадер или просто вернуть null на 1 тик
        return null;
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
