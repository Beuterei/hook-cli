import path from 'path';
import { color } from 'console-log-colors';
import Listr from 'listr';
import { HookFailedError, registerCommandModule } from '../util/commandModule.helper';
import { execute } from '../util/exec.helper';

export = registerCommandModule<{ filePath: string }>()({
    command: 'checkPackageVersionInFile [filePath]',
    describe: 'Check if the version field is the same for package.json and file',
    builder: {
        'no-fail': {
            alias: 'n',
            type: 'boolean',
            description: 'If true only prints warning messages and do not exit with not zero code',
            default: false,
        },
        'json-path': {
            alias: 'p',
            type: 'string',
            description: 'Path in json file to check',
        },
    },
    handler: async argv => {
        const { 'no-fail': noFail, filePath, 'json-path': jsonPath } = argv;
        const tasks = new Listr([
            {
                title: `Check if ${color.cyan(
                    'package.json',
                )} version field differs from ${color.cyan(filePath)}`,
                task: async (_context, task) => {
                    try {
                        if (!jsonPath) {
                            task.title = 'No json path provided';
                            throw new HookFailedError();
                        }

                        const { stdout: packageVersion } = await execute(
                            `node -p "require('./package.json').version"`,
                        );
                        const { stdout: versionInFile } = await execute(
                            `node -p "require('${path.resolve(filePath)}').${jsonPath}"`,
                        );

                        if (versionInFile.includes('undefined')) {
                            task.title = `Could not find ${color.red(jsonPath)} path in ${color.red(
                                filePath,
                            )}`;
                            throw new HookFailedError();
                        }

                        if (packageVersion !== versionInFile) {
                            task.title = `${color.red(
                                'package.json',
                            )} version field differs from ${color.red(filePath)}`;
                            throw new HookFailedError();
                        }

                        task.title = `${color.green(
                            'package.json',
                        )} version field is the same as ${color.green(filePath)}`;
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
