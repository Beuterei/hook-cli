import { color } from 'console-log-colors';
import Listr from 'listr';
import { HookFailedError, registerCommandModule } from '../util/commandModule.helper';
import { execute, ExecuteError } from '../util/exec.helper';

export = registerCommandModule<{ filePath: string }>()({
    command: 'checkForFileChanged [filePath]',
    describe:
        'Check if a staged file like a changelog was changed locale or remote compared to another branch',
    builder: {
        'no-fail': {
            alias: 'n',
            type: 'boolean',
            description: 'If true only prints warning messages and do not exit with not zero code',
            default: false,
        },
        branch: {
            alias: 'b',
            type: 'string',
            description: 'Branch to compare to',
            default: 'main',
        },
    },
    handler: async argv => {
        const { 'no-fail': noFail, branch, filePath } = argv;
        const tasks = new Listr([
            {
                title: `Check if ${color.cyan(filePath)} differs from ${color.cyan(branch)}`,
                task: async (_context, task) =>
                    await execute(`! git diff origin/${branch} --cached --exit-code -- ${filePath}`)
                        .then(
                            () =>
                                (task.title = `${color.green(
                                    filePath,
                                )} differs from the version on ${color.green(branch)}`),
                        )
                        .catch(async (error: unknown) => {
                            if (error instanceof ExecuteError) {
                                task.title = `${color.red(filePath)} do not differ from ${color.red(
                                    branch,
                                )}`;
                                throw new HookFailedError();
                            } else {
                                // TODO: recheck if we dont have a message for such cases
                                // eslint-disable-next-line unicorn/prefer-type-error
                                throw new Error('Unknown error');
                            }
                        }),
            },
        ]);

        try {
            await tasks.run();
            process.exit(0);
        } catch (error) {
            if (error instanceof HookFailedError && noFail) {
                process.exit(0);
            }

            process.exit(1);
        }
    },
});
