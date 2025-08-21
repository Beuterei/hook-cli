import { vi } from 'vitest';
import { mockFn } from 'vitest-mock-extended';

vi.mock(import('fs'), async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        readFileSync: mockFn<typeof actual.readFileSync>().mockImplementation(() => ''),
    };
});
