import Listr from 'listr';
import { HookFailedError, registerCommandModule } from '../util/commandModule.helper';
import { execute, ExecuteError } from '../util/exec.helper';

export = registerCommandModule<{ commitMsgPath: string }>()({
    command: 'checkCommitMessageIssueKey [commitMsgPath]',
    describe: 'Check the commit message for a issue key',
    builder: {
        'no-fail': {
            alias: 'n',
            type: 'boolean',
            description: 'If true only prints warning messages and do not exit with not zero code',
            default: false,
        },
        message: {
            alias: 'm',
            type: 'string',
            description: 'Get message from command line instead of file',
        },
        prefix: {
            alias: 'p',
            type: 'string',
            description: 'Prefix of the issue key',
        },
    },
    handler: async argv => {
        const { 'no-fail': noFail, prefix, message, commitMsgPath } = argv;
        const tasks = new Listr([
            {
                title: 'Check if commit message contains issue key',
                task: async (_context, task) => {
                    if (!commitMsgPath && !message) {
                        task.title = 'No commit message provided';
                        throw new HookFailedError();
                    }

                    // eslint-disable-next-line canonical/id-match
                    const command = __filename.endsWith('.ts')
                        ? 'npx ts-node src/index.ts checkCommitMessagePattern'
                        : 'npx hook-cli checkCommitMessagePattern';

                    const messageArguments = message ? `-m "${message}"` : commitMsgPath;

                    const ticketRegex = `^(${prefix ? prefix : '[A-Z]+'}-[0-9]{1,10})( ?/ ?(${
                        prefix ? prefix : '[A-Z]+'
                    }-[0-9]{1,10}))*? (?!/).*`;

                    await execute(`${command} ${messageArguments} -p "${ticketRegex}"`)
                        .then(() => (task.title = 'Issue key found'))
                        .catch(async (error: unknown) => {
                            if (error instanceof ExecuteError) {
                                task.title = 'Issue key not found';
                                throw new HookFailedError();
                            } else {
                                // eslint-disable-next-line unicorn/prefer-type-error
                                throw new Error('Unknown error');
                            }
                        });
                },
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
