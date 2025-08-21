// @ts-check
import { auto, vitest } from '@beuluis/eslint-config';
import { config } from 'typescript-eslint';

export default config(
    auto,
    {
        extends: vitest,
        files: [
            '**/*.?(component-){spec,test}.{js,mjs,cjs,jsx}',
            '**/{__mocks__,__tests__}/**/*.{js,mjs,cjs,jsx}',
            '**/vitest.config.{js,mjs,cjs}',
        ],
    },
    {
        rules: {
            'import/extensions': 'off',
            'no-console': 'off',
        },
    },
    {
        ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
    },
);
