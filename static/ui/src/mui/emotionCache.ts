import createCache from '@emotion/cache';

let singletonCache: ReturnType<typeof createCache> | null = null;

// Создаём единый Emotion cache. Если Forge выдал nonce — используем его,
// чтобы не получать CSP ошибку «Refused to apply inline style ... nonce required».
export function createEmotionCache(nonce?: string) {
    if (singletonCache) return singletonCache;

    singletonCache = createCache({
        key: 'mui',
        ...(nonce ? { nonce } : {})
    });

    return singletonCache;
}
