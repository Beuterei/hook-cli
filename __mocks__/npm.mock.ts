import { vi } from 'vitest';
import { mockFn } from 'vitest-mock-extended';

vi.mock(import('../src/util/npm.helper'), async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        NPMOutputParser: mockFn<typeof actual.NPMOutputParser>().mockImplementation(() => ({})),
    };
});
