import { vi } from 'vitest';
import { mockFn } from 'vitest-mock-extended';

vi.mock(import('../src/util/exec.helper'), async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        execute: mockFn<typeof actual.execute>(),
    };
});
