// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/exec.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/spinner.mock';
import { execute, ExecuteError } from '../util/exec.helper';
import { command } from './checkPackageVersionInFile';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { mockedFn } from 'vitest-mock-extended';

const executeMock = mockedFn(execute);

const createContext = (args: Record<string, unknown>) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    cmd: command,
    rawArgs: [],
});

describe('checkPackageVersionInFile command', () => {
    let exitSpy: MockInstance;

    beforeEach(() => {
        exitSpy = vi
            .spyOn(process, 'exit')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .mockImplementation((() => {}) as any);
    });

    it.each([
        {
            expected: 0,
            fileVer: '1.2.3',
            pkgVer: '1.2.3',
            title: 'matching versions ➜ exit 0',
            warnOnly: false,
        },
        {
            expected: 1,
            fileVer: '1.0.0',
            pkgVer: '1.2.3',
            title: 'versions differ, no-fail=false ➜ exit 1',
            warnOnly: false,
        },
        {
            expected: 0,
            fileVer: '1.0.0',
            pkgVer: '1.2.3',
            title: 'versions differ, no-fail=true ➜ exit 0',
            warnOnly: true,
        },
    ])('$title', async ({ expected, fileVer, pkgVer, warnOnly }) => {
        executeMock
            .mockResolvedValueOnce({ code: 0, stderr: '', stdout: pkgVer })
            .mockResolvedValueOnce({ code: 0, stderr: '', stdout: fileVer });

        await command.run?.(
            createContext({
                _: ['manifest.json'],
                'json-path': 'version',
                'warn-only': warnOnly,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(expected);
    });

    it('should exit with 1 when no json path is provided', async () => {
        await command.run?.(
            createContext({
                _: ['manifest.json'],
                'json-path': '',
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with 1 when json path is undefined', async () => {
        await command.run?.(
            createContext({
                _: ['manifest.json'],
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it.each([
        { title: 'json path not found, no-fail=false ➜ exit 1', warnOnly: false },
        { title: 'json path not found, no-fail=true  ➜ exit 1', warnOnly: true },
    ])('$title', async ({ warnOnly }) => {
        executeMock
            .mockResolvedValueOnce({ code: 0, stderr: '', stdout: '1.2.3' })
            .mockResolvedValueOnce({ code: 0, stderr: '', stdout: 'undefined' });

        await command.run?.(
            createContext({
                _: ['manifest.json'],
                'json-path': 'nonexistent.path',
                'warn-only': warnOnly,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with 1 when package.json version command fails', async () => {
        executeMock.mockRejectedValueOnce(new ExecuteError(1, '', 'Cannot find package.json'));

        await command.run?.(
            createContext({
                _: ['manifest.json'],
                'json-path': 'version',
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with 1 when file reading command fails', async () => {
        executeMock
            .mockResolvedValueOnce({ code: 0, stderr: '', stdout: '1.2.3' })
            .mockRejectedValueOnce(new ExecuteError(1, '', 'Cannot find manifest.json'));

        await command.run?.(
            createContext({
                _: ['manifest.json'],
                'json-path': 'version',
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle complex json paths correctly', async () => {
        executeMock
            .mockResolvedValueOnce({ code: 0, stderr: '', stdout: '2.1.0' })
            .mockResolvedValueOnce({ code: 0, stderr: '', stdout: '2.1.0' });

        await command.run?.(
            createContext({
                _: ['config/app.json'],
                'json-path': 'app.version',
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(0);
    });
});
