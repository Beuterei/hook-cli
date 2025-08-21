// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/checkPackageVersionInFile.mock';
import { command } from './checkPackageVersion';
import { checkPackageVersionInFile } from './checkPackageVersionInFile';
import { describe, expect, it } from 'vitest';
import { mockedFn } from 'vitest-mock-extended';

const checkPackageVersionInFileMock = mockedFn(checkPackageVersionInFile);

const createContext = (args: Record<string, unknown>) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    cmd: command,
    rawArgs: [],
});

describe('checkPackageVersion command', () => {
    it.each([
        { title: 'no-fail false', warnOnly: false },
        { title: 'no-fail true', warnOnly: true },
        { title: 'no no-fail provided', warnOnly: undefined },
    ])('calls helper with correct parameters - $title', async ({ warnOnly }) => {
        await command.run?.(createContext(warnOnly === undefined ? {} : { 'warn-only': warnOnly }));

        expect(checkPackageVersionInFileMock).toHaveBeenCalledWith({
            filePath: 'package-lock.json',
            jsonPath: "packages[''].version",
            warnOnly,
        });
    });

    it('should propagate errors from checkPackageVersionInFile', async () => {
        const testError = new Error('Test error');
        checkPackageVersionInFileMock.mockRejectedValue(testError);

        await expect(
            command.run?.(
                createContext({
                    'warn-only': false,
                }),
            ),
        ).rejects.toThrow('Test error');

        expect(checkPackageVersionInFileMock).toHaveBeenCalledWith({
            filePath: 'package-lock.json',
            jsonPath: "packages[''].version",
            warnOnly: false,
        });
    });
});
