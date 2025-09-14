import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Определяем dev режим более точно
    const isDevMode = mode === 'development' || process.env.VITE_DEV_MODE === 'true';

    console.log('🔧 Vite config:', { mode, isDevMode, VITE_DEV_MODE: process.env.VITE_DEV_MODE });

    return {
        plugins: [react()],
        build: {
            outDir: 'build',
            assetsDir: '',
            rollupOptions: {
                input: './index.html',
                output: {
                    entryFileNames: 'index.js',
                    chunkFileNames: '[name].js',
                    assetFileNames: '[name].[ext]'
                }
            }
        },
        define: {
            global: 'globalThis',
            // Важно: передаём переменные окружения в браузер
            'process.env.VITE_DEV_MODE': JSON.stringify(process.env.VITE_DEV_MODE || (isDevMode ? 'true' : 'false')),
            'process.env.NODE_ENV': JSON.stringify(mode),
        },
        base: './',
        esbuild: {
            target: 'es2020'
        },
        server: {
            host: '0.0.0.0',
            port: 3000
        }
    }
});
