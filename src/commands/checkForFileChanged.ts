import { HookFailedException } from '../exceptions/hookFailed.exception';
import { execute, ExecuteError } from '../util/exec.helper';
import { Spinner } from '../util/spinner.helper';
import { defineCommand } from 'citty';
import { color } from 'console-log-colors';

export const command = defineCommand({
    args: {
        branch: {
            alias: 'b',
            default: 'main',
            description: 'Branch to compare to',
            type: 'string',
        },
        'warn-only': {
            alias: 'w',
            default: false,
            description: 'If true only prints warning messages and do not exit with not zero code',
            type: 'boolean',
        },
    },
    meta: {
        description:
            'Check if a staged file like a changelog was changed locale or remote compared to another branch',
        name: 'checkForFileChanged [FILE_PATH]',
    },
    run: async ({
        args: {
            _: [filePath],
            branch,
            'warn-only': warnOnly,
        },
    }) => {
        const spinner = new Spinner();
        spinner.start(`Checking if ${color.cyan(filePath)} differs from ${color.cyan(branch)}`);

        try {
            await execute(`! git diff origin/${branch} --cached --exit-code -- ${filePath}`)
                .then(() =>
                    spinner.done(
                        `${color.green(filePath)} differs from the version on ${color.green(
                            branch,
                        )}`,
                    ),
                )
                .catch(async (error: unknown) => {
                    if (error instanceof ExecuteError) {
                        spinner.failWithNoFail(
                            warnOnly,
                            `${color.red(filePath)} does not differ from ${color.red(branch)}`,
                        );
                        throw new HookFailedException();
                    } else {
                        spinner.fail(
                            `Unknown error while checking if ${color.red(
                                filePath,
                            )} differs from ${color.red(branch)}`,
                        );
                        throw new Error('Unknown error');
                    }
                });

            process.exit(0);
        } catch (error) {
            if (error instanceof HookFailedException && warnOnly) {
                process.exit(0);
            }

            // If no ending method was called successfully, we do it here to ensure a message is printed
            spinner.fail('Unknown error');

            process.exit(1);
        }
    },
});
