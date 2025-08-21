import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        clearMocks: true,
        coverage: {
            exclude: ['src/index.ts'],
            include: ['src/**/*.ts'],
        },
        environment: 'node',
        exclude: ['node_modules', 'dist'],
        globals: true,
        include: ['src/**/*.test.ts'],
        mockReset: true,
        restoreMocks: true,
        watch: false,
    },
});
