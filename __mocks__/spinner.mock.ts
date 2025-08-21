import { type Spinner } from '../src/util/spinner.helper';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

vi.mock(import('../src/util/spinner.helper'), async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        Spinner: vi.fn(() => mock<Spinner>()),
    };
});
