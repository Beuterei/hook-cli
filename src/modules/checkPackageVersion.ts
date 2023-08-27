import { HookFailedError, registerCommandModule } from '../util/commandModule.helper';
import { execute } from '../util/exec.helper';
import { color } from 'console-log-colors';
import Listr from 'listr';

export = registerCommandModule()({
    command: 'checkPackageVersion',
    describe: 'Check if the version field is the same for package.json and package-lock.json',
    builder: {
        'no-fail': {
            alias: 'n',
            type: 'boolean',
            description: 'If true only prints warning messages and do not exit with not zero code',
            default: false,
        },
    },
    handler: async argv => {
        const { 'no-fail': noFail } = argv;
        const tasks = new Listr([
            {
                title: `Check if ${color.cyan(
                    'package.json',
                )} version field differs from ${color.cyan('package-lock.json')}`,
                task: async (_context, task) => {
                    try {
                        const { stdout: packageVersion } = await execute(
                            `node -p "require('./package.json').version"`,
                        );
                        const { stdout: packageLockVersionTop } = await execute(
                            `node -p "require('./package-lock.json').version"`,
                        );
                        const { stdout: packageLockVersionDeep } = await execute(
                            `node -p "require('./package-lock.json').packages[''].version"`,
                        );

                        if (
                            packageVersion !== packageLockVersionTop ||
                            packageVersion !== packageLockVersionDeep
                        ) {
                            task.title = `${color.red(
                                'package.json',
                            )} version field differs from ${color.red('package-lock.json')}`;
                            throw new HookFailedError();
                        } else {
                            task.title = `${color.green(
                                'package.json',
                            )} version field is the same as ${color.green('package-lock.json')}`;
                        }
                    } catch (error: unknown) {
                        if (error instanceof HookFailedError) {
                            throw error;
                        }

                        throw new Error('Unknown error');
                    }
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
