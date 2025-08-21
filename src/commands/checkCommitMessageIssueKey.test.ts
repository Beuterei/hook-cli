// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/checkCommitMessagePattern.mock';
import { command } from './checkCommitMessageIssueKey';
import { checkCommitMessagePattern } from './checkCommitMessagePattern';
import { describe, expect, it } from 'vitest';
import { mockedFn } from 'vitest-mock-extended';

const checkCommitMessagePatternMock = mockedFn(checkCommitMessagePattern);

const buildPattern = (prefix?: string) =>
    `^(${prefix ?? '[A-Z]+'}-[0-9]{1,10})( ?/ ?(${prefix ?? '[A-Z]+'}-[0-9]{1,10}))*? (?!/).*`;

const createContext = (args: Record<string, unknown>) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    cmd: command,
    rawArgs: [],
});

describe('checkCommitMessageIssueKey command', () => {
    it.each([
        {
            args: {
                _: ['.git/COMMIT_EDITMSG'],
                message: 'JIRA-123 fix authentication bug',
                'warn-only': false,
            },
            prefix: undefined,
            title: 'default prefix pattern with path',
        },
        {
            args: {
                _: [],
                message: 'PROJ-456 implement new feature',
                prefix: 'PROJ',
                'warn-only': false,
            },
            prefix: 'PROJ',
            title: 'custom prefix pattern',
        },
        {
            args: {
                _: [],
                message: 'ABC-999 test commit',
                'warn-only': true,
            },
            prefix: undefined,
            title: 'no-fail parameter true',
        },
        {
            args: {
                _: ['.git/COMMIT_EDITMSG'],
                prefix: 'TASK',
                'warn-only': false,
            },
            prefix: 'TASK',
            title: 'commit message path provided',
        },
        {
            args: {
                _: [],
                message: 'FEAT-100 add new functionality',
            },
            prefix: undefined,
            title: 'default no-fail undefined',
        },
    ])('$title', async ({ args, prefix }) => {
        await command.run?.(createContext(args));

        const expected = {
            commitMessagePath: (args._ as string[] | undefined)?.[0],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: (args as any).message,
            pattern: buildPattern(prefix),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            warnOnly: (args as any)['warn-only'],
        };

        expect(checkCommitMessagePatternMock).toHaveBeenCalledWith(expected);
    });

    it('should propagate errors from checkCommitMessagePattern', async () => {
        const testError = new Error('Pattern validation failed');
        checkCommitMessagePatternMock.mockRejectedValue(testError);

        await expect(
            command.run?.(
                createContext({
                    _: [],
                    message: 'invalid commit',
                    'warn-only': false,
                }),
            ),
        ).rejects.toThrow('Pattern validation failed');

        expect(checkCommitMessagePatternMock).toHaveBeenCalledWith({
            commitMessagePath: undefined,
            message: 'invalid commit',
            pattern: buildPattern(),
            warnOnly: false,
        });
    });
});
