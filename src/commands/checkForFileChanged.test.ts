// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/exec.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/spinner.mock';
import { execute, ExecuteError } from '../util/exec.helper';
import { command } from './checkForFileChanged';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { mockedFn } from 'vitest-mock-extended';

const executeMock = mockedFn(execute);

const createContext = (args: Record<string, unknown>) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    cmd: command,
    rawArgs: [],
});

describe('checkForFileChanged command', () => {
    let exitSpy: MockInstance;

    beforeEach(() => {
        exitSpy = vi
            .spyOn(process, 'exit')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .mockImplementation((() => {}) as any);
    });

    it.each([
        {
            expectedExit: 0,
            reject: false,
            title: 'file differs from branch ➜ exit 0',
            warnOnly: false,
        },
        {
            expectedExit: 1,
            reject: true,
            title: 'file does not differ, no-fail=false ➜ exit 1',
            warnOnly: false,
        },
        {
            expectedExit: 0,
            reject: true,
            title: 'file does not differ, no-fail=true ➜ exit 0',
            warnOnly: true,
        },
    ])('$title', async ({ expectedExit, reject, warnOnly }) => {
        if (reject) {
            executeMock.mockRejectedValue(new ExecuteError(1, '', ''));
        } else {
            executeMock.mockResolvedValue({ code: 0, stderr: '', stdout: '' });
        }

        await command.run?.(
            createContext({
                _: ['README.md'],
                branch: 'main',
                'warn-only': warnOnly,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(expectedExit);
    });

    it('should exit with 1 when an unknown error occurs', async () => {
        executeMock.mockRejectedValue(new Error('Unknown error'));

        await command.run?.(
            createContext({
                _: ['README.md'],
                branch: 'main',
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});
