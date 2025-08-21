import { vi } from 'vitest';
import { mockFn } from 'vitest-mock-extended';

vi.mock(import('../src/util/yarn.helper'), async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        YarnOutputParser: mockFn<typeof actual.YarnOutputParser>().mockImplementation(() => []),
    };
});
