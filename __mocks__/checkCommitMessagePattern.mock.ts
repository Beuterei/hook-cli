import { vi } from 'vitest';
import { mockFn } from 'vitest-mock-extended';

vi.mock(import('../src/commands/checkCommitMessagePattern'), async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        checkCommitMessagePattern: mockFn<
            typeof actual.checkCommitMessagePattern
        >().mockImplementation(undefined as never),
    };
});
