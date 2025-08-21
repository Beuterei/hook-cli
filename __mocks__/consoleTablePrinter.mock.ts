import { type Table } from 'console-table-printer';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

vi.mock(import('console-table-printer'), async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        Table: vi.fn(() => mock<Table>()),
    };
});
