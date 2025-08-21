import { HookFailedException } from '../exceptions/hookFailed.exception';
import { Spinner } from '../util/spinner.helper';
import { defineCommand } from 'citty';
import { color } from 'console-log-colors';
import { readFileSync } from 'fs';

const ignoreWildcards: RegExp[] = [
    /^((Merge pull request)|(Merge (.*?) into (.*)|(Merge branch (.*)))(?:\r?\n)*$)/mu,

    /^(Merge tag (.*))(?:\r?\n)*$/mu,
    /^(R|r)evert (.*)/u,
    /^(fixup|squash)!/u,
    /^(Merged (.*?)(in|into) (.*)|Merged PR (.*): (.*))/u,
    /^Merge remote-tracking branch(\s*)(.*)/u,
    /^Automatic merge(.*)/u,
    /^Auto-merged (.*?) into (.*)/u,
];

export const checkCommitMessagePattern = async ({
    commitMessagePath,
    message,
    pattern,
    warnOnly,
}: {
    commitMessagePath: string;
    message: string;
    pattern: string;
    warnOnly: boolean;
}) => {
    const spinner = new Spinner();
    spinner.start(`Checking if commit message matches pattern ${color.magenta(pattern)}`);

    try {
        if (!commitMessagePath && !message) {
            spinner.fail('No commit message provided');
            throw new Error('No commit message provided');
        }

        if (!pattern) {
            spinner.fail('No pattern provided');
            throw new Error('No pattern provided');
        }

        const finalMessage = message ?? readFileSync(commitMessagePath, 'utf8');

        for (const ignorePattern of ignoreWildcards) {
            if (ignorePattern.test(finalMessage)) {
                spinner.done('Commit message matches ignore pattern');

                process.exit(0);
            }
        }

        if (!new RegExp(pattern, 'u').test(finalMessage)) {
            spinner.failWithNoFail(
                warnOnly,
                `Commit message does not match pattern ${color.red(pattern)}`,
            );
            throw new HookFailedException();
        }

        spinner.done('Commit message matches pattern');

        process.exit(0);
    } catch (error) {
        if (error instanceof HookFailedException && warnOnly) {
            process.exit(0);
        }

        // If no ending method was called successfully, we do it here to ensure a message is printed
        spinner.fail('Unknown error');

        process.exit(1);
    }
};

export const command = defineCommand({
    args: {
        message: {
            alias: 'm',
            description: 'Get message from command line instead of file',
            type: 'string',
        },
        pattern: {
            alias: 'w',
            description: 'Regex pattern to check the message against',
            type: 'string',
        },
        'warn-only': {
            alias: 'n',
            default: false,
            description: 'If true only prints warning messages and do not exit with not zero code',
            type: 'boolean',
        },
    },
    meta: {
        description: 'Check the pattern of a commit message',
        name: 'checkCommitMessagePattern [COMMIT_MESSAGE_PATH]',
    },
    run: async ({
        args: {
            _: [commitMessagePath],
            message,
            pattern,
            'warn-only': warnOnly,
        },
    }) => {
        await checkCommitMessagePattern({
            commitMessagePath,
            message,
            pattern,
            warnOnly,
        });
    },
});
