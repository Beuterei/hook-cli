import { HookFailedError, registerCommandModule } from '../util/commandModule.helper';
import fs from 'fs';
import Listr from 'listr';

const ignoreWildcards: RegExp[] = [
    // eslint-disable-next-line unicorn/no-unsafe-regex
    /^((Merge pull request)|(Merge (.*?) into (.*)|(Merge branch (.*)))(?:\r?\n)*$)/mu,
    // eslint-disable-next-line unicorn/no-unsafe-regex
    /^(Merge tag (.*))(?:\r?\n)*$/mu,
    /^(R|r)evert (.*)/u,
    /^(fixup|squash)!/u,
    /^(Merged (.*?)(in|into) (.*)|Merged PR (.*): (.*))/u,
    /^Merge remote-tracking branch(\s*)(.*)/u,
    /^Automatic merge(.*)/u,
    /^Auto-merged (.*?) into (.*)/u,
];

export = registerCommandModule<{ commitMsgPath: string }>()({
    command: 'checkCommitMessagePattern [commitMsgPath]',
    describe: 'Check the pattern of a commit message',
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
        pattern: {
            alias: 'p',
            type: 'string',
            description: 'Regex pattern to check the message against',
        },
    },
    handler: async argv => {
        const { 'no-fail': noFail, message, pattern, commitMsgPath } = argv;
        const tasks = new Listr([
            {
                title: 'Check if commit message matches pattern',
                task: async (_context, task) => {
                    if (!commitMsgPath && !message) {
                        task.title = 'No commit message provided';
                        throw new HookFailedError();
                    }

                    if (!pattern) {
                        task.title = 'No pattern provided';
                        throw new HookFailedError();
                    }

                    const finalMessage = message ?? fs.readFileSync(commitMsgPath, 'utf8');

                    for (const ignorePattern of ignoreWildcards) {
                        if (ignorePattern.test(finalMessage)) {
                            task.title = 'Commit message matches ignore pattern';

                            process.exit(0);
                        }
                    }

                    if (!new RegExp(pattern, 'u').test(finalMessage)) {
                        task.title = 'Commit message does not match pattern';
                        throw new HookFailedError();
                    }

                    task.title = 'Commit message matches pattern';
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
