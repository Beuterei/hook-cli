import { vi } from 'vitest';
import { mockFn } from 'vitest-mock-extended';

vi.mock(import('../src/commands/checkPackageVersionInFile'), async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        checkPackageVersionInFile: mockFn<
            typeof actual.checkPackageVersionInFile
        >().mockImplementation(undefined as never),
    };
});
