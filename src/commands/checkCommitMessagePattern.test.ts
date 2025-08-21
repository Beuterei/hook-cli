// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/consoleTablePrinter.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/spinner.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/fs.mock';
import { command } from './checkCommitMessagePattern';
import { readFileSync } from 'fs';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { mockedFn } from 'vitest-mock-extended';

const readFileSyncMock = mockedFn(readFileSync);

const createContext = (args: Record<string, unknown>) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    cmd: command,
    rawArgs: [],
});

describe('checkCommitMessagePattern command', () => {
    let exitSpy: MockInstance;

    beforeEach(() => {
        exitSpy = vi
            .spyOn(process, 'exit')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .mockImplementation((() => {}) as any);
    });

    it.each([
        {
            args: {
                _: [],
                message: 'feat: add new feature',
                pattern: '^(feat|fix|docs):\\s.+',
                'warn-only': false,
            },
            title: 'direct message matches pattern',
        },
        {
            args: {
                _: ['.git/COMMIT_EDITMSG'],
                pattern: '^(feat|fix|docs):\\s.+',
                'warn-only': false,
            },
            fileContent: 'fix: resolve bug',
            title: 'message read from file matches pattern',
        },
    ])('$title', async ({ args, fileContent }) => {
        if (args._.length && fileContent) {
            readFileSyncMock.mockReturnValue(fileContent);
        }

        await command.run?.(createContext(args));
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it.each([
        'Merge pull request #123 from feature/branch',
        'Merge branch feature/test into main',
        'Revert "feat: add new feature"',
        'fixup! correct typo',
        'squash! regroup commits',
        'Merge tag v1.2.3',
        'Automatic merge from branch',
    ])('ignore pattern "%s" returns exit 0', async (message) => {
        await command.run?.(
            createContext({
                _: [],
                message,
                pattern: '^(feat|fix|docs):\\s.+',
                'warn-only': false,
            }),
        );
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it.each([
        { expected: 1, title: 'mismatch with no-fail=false ➜ exit 1', warnOnly: false },
        { expected: 0, title: 'mismatch with no-fail=true  ➜ exit 0', warnOnly: true },
    ])('$title', async ({ expected, warnOnly }) => {
        await command.run?.(
            createContext({
                _: [],
                message: 'invalid commit message',
                pattern: '^(feat|fix|docs):\\s.+',
                'warn-only': warnOnly,
            }),
        );
        expect(exitSpy).toHaveBeenCalledWith(expected);
    });

    it('should exit with 1 when no pattern is provided', async () => {
        await command.run?.(
            createContext({
                _: [],
                message: 'feat: add new feature',
                'warn-only': false,
            }),
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with 1 when no message or commit message path is provided', async () => {
        await command.run?.(
            createContext({
                _: [],
                pattern: '^(feat|fix|docs):\\s.+',
                'warn-only': false,
            }),
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with 1 when file reading fails', async () => {
        readFileSyncMock.mockImplementation(() => {
            throw new Error('File not found');
        });

        await command.run?.(
            createContext({
                _: ['.git/COMMIT_EDITMSG'],
                pattern: '^(feat|fix|docs):\\s.+',
                'warn-only': false,
            }),
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should prefer message parameter over file path when both are provided', async () => {
        readFileSyncMock.mockReturnValue('file content that should be ignored');

        await command.run?.(
            createContext({
                _: ['.git/COMMIT_EDITMSG'],
                message: 'feat: add new feature',
                pattern: '^(feat|fix|docs):\\s.+',
                'warn-only': false,
            }),
        );
        expect(readFileSyncMock).not.toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle multiline commit messages', async () => {
        const multilineMessage = 'feat: add auth\n\nThis commit adds:\n- Login\n- Validation';

        await command.run?.(
            createContext({
                _: [],
                message: multilineMessage,
                pattern: '^feat:\\s.+',
                'warn-only': false,
            }),
        );
        expect(exitSpy).toHaveBeenCalledWith(0);
    });
});
