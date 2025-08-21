// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/exec.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/spinner.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/npm.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/yarn.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/consoleTablePrinter.mock';
import { execute, ExecuteError } from '../util/exec.helper';
import { NPMOutputParser } from '../util/npm.helper';
import { YarnOutputParser } from '../util/yarn.helper';
import { command } from './updateReminder';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { mockedFn } from 'vitest-mock-extended';

const executeMock = mockedFn(execute);
const npmOutputParserMock = mockedFn(NPMOutputParser);
const yarnOutputParserMock = mockedFn(YarnOutputParser);

const createContext = (args: Record<string, unknown>) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    cmd: command,
    rawArgs: [],
});

describe('updateReminder command', () => {
    let exitSpy: MockInstance;

    beforeEach(() => {
        exitSpy = vi
            .spyOn(process, 'exit')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .mockImplementation((() => {}) as any);
    });

    it.each([
        { cmd: 'npm outdated --json', pm: 'npm' },
        { cmd: 'yarn outdated --json', pm: 'yarn' },
    ])('exits with 0 when no outdated packages are found - %s', async ({ cmd, pm }) => {
        executeMock.mockResolvedValue({ code: 0, stderr: '', stdout: '' });

        await command.run?.(
            createContext({
                'package-manager': pm,
                'warn-only': false,
            }),
        );

        expect(executeMock).toHaveBeenCalledWith(cmd);
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle execution errors gracefully', async () => {
        executeMock.mockRejectedValue(new Error('Command failed'));

        await command.run?.(
            createContext({
                'package-manager': 'npm',
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should call NPMOutputParser when npm command fails', async () => {
        const mockError = new Error('ExecuteError');
        Object.assign(mockError, {
            stderr: '',
            stdout: '{"lodash":{"current":"4.17.20","latest":"4.17.21","wanted":"4.17.21"}}',
        });
        // Make it behave like ExecuteError for instanceof check
        Object.setPrototypeOf(mockError, ExecuteError.prototype);

        npmOutputParserMock.mockReturnValue({
            lodash: {
                current: '4.17.20',
                latest: '4.17.21',
                wanted: '4.17.21',
            },
        });

        executeMock.mockRejectedValue(mockError);

        await command.run?.(
            createContext({
                'package-manager': 'npm',
                'warn-only': false,
            }),
        );

        expect(npmOutputParserMock).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should call YarnOutputParser when yarn command fails', async () => {
        yarnOutputParserMock.mockReturnValue([
            {
                data: {
                    body: [['lodash', '4.17.20', '4.17.21', '4.17.21']],
                    head: ['Package', 'Current', 'Wanted', 'Latest'],
                },
                type: 'table',
            },
        ]);

        executeMock.mockRejectedValue(new ExecuteError(1, 'yarn stdout', 'yarn stderr'));

        await command.run?.(
            createContext({
                'package-manager': 'yarn',
                'warn-only': false,
            }),
        );

        expect(yarnOutputParserMock).toHaveBeenCalledWith('yarn stdout', 'yarn stderr');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle yarn invalid format error', async () => {
        const mockError = new Error('ExecuteError');
        Object.assign(mockError, {
            stderr: 'yarn stderr',
            stdout: 'yarn stdout',
        });
        Object.setPrototypeOf(mockError, ExecuteError.prototype);

        yarnOutputParserMock.mockReturnValue([
            {
                data: { invalid: 'structure' },
                type: 'invalidType',
            },
        ]);

        executeMock.mockRejectedValue(mockError);

        await command.run?.(
            createContext({
                'package-manager': 'yarn',
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unknown package manager error', async () => {
        const mockError = new Error('ExecuteError');
        Object.setPrototypeOf(mockError, ExecuteError.prototype);

        executeMock.mockRejectedValue(mockError);

        await command.run?.(
            createContext({
                'package-manager': 'pnpm',
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with 0 when outdated packages found but no-fail is true', async () => {
        const mockError = new Error('ExecuteError');
        Object.assign(mockError, {
            stderr: '',
            stdout: '{"lodash":{"current":"4.17.20","latest":"4.17.21","wanted":"4.17.21"}}',
        });
        Object.setPrototypeOf(mockError, ExecuteError.prototype);

        npmOutputParserMock.mockReturnValue({
            lodash: {
                current: '4.17.20',
                latest: '4.17.21',
                wanted: '4.17.21',
            },
        });

        executeMock.mockRejectedValue(mockError);

        await command.run?.(
            createContext({
                'package-manager': 'npm',
                'warn-only': true,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(0);
    });
});
