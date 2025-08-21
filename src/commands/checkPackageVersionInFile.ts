import { HookFailedException } from '../exceptions/hookFailed.exception';
import { execute } from '../util/exec.helper';
import { Spinner } from '../util/spinner.helper';
import { defineCommand } from 'citty';
import { color } from 'console-log-colors';
import path from 'path';

// TODO: output does not work
export const checkPackageVersionInFile = async ({
    filePath,
    jsonPath,
    warnOnly,
}: {
    filePath: string;
    jsonPath: string;
    warnOnly: boolean;
}) => {
    const spinner = new Spinner();
    spinner.start(
        `Checking if ${color.cyan(
            'package.json',
        )} version field is the same as ${color.magentaBright(filePath)} in ${color.cyan(
            filePath,
        )}`,
    );

    try {
        if (!jsonPath) {
            spinner.fail('No json path provided');
            throw new Error('No json path provided');
        }

        const { stdout: packageVersion } = await execute(
            `node -p "require('./package.json').version"`,
        );
        const { stdout: versionInFile } = await execute(
            `node -p "require('${path.resolve(filePath)}').${jsonPath}"`,
        );

        if (versionInFile.includes('undefined')) {
            spinner.fail(`Could not find ${color.red(jsonPath)} path in ${color.red(filePath)}`);
            throw new Error('Could not find json path');
        }

        if (packageVersion !== versionInFile) {
            spinner.failWithNoFail(
                warnOnly,
                `${color.red('package.json')} version field differs from ${color.red(filePath)}`,
            );
            throw new HookFailedException();
        }

        spinner.done(
            `${color.green('package.json')} version field is the same as ${color.green(filePath)}`,
        );

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
        'json-path': {
            alias: 'p',
            description: 'Path in json file to check',
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
        description: 'Check if the version field is the same for package.json and the file',
        name: 'checkPackageVersionInFile [FILE_PATH]',
    },
    run: async ({
        args: {
            _: [filePath],
            'json-path': jsonPath,
            'warn-only': warnOnly,
        },
    }) => {
        await checkPackageVersionInFile({
            filePath,
            jsonPath,
            warnOnly,
        });
    },
});
