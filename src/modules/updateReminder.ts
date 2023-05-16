import { color } from 'console-log-colors';
import { Table } from 'console-table-printer';
import Listr from 'listr';
import { HookFailedError, registerCommandModule } from '../util/commandModule.helper';
import { execute, ExecuteError } from '../util/exec.helper';
import { NPMOutputParser } from '../util/npm.helper';
import type { YarnObject } from '../util/yarn.helper';
import { YarnOutputParser } from '../util/yarn.helper';

interface OutdatedNpm {
    current: string;
    latest: string;
    wanted: string;
}

interface GenericOutdated {
    current: string;
    latest: string;
    package: string;
    wanted: string;
}

interface YarnOutdatedTable {
    body: string[][];
    head: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isOutdatedNpm = (object: any): object is OutdatedNpm =>
    Object.prototype.hasOwnProperty.call(object, 'current') &&
    typeof object.current === 'string' &&
    Object.prototype.hasOwnProperty.call(object, 'wanted') &&
    typeof object.wanted === 'string' &&
    Object.prototype.hasOwnProperty.call(object, 'latest') &&
    typeof object.latest === 'string';

const transformNpmOutput = (object: Object): GenericOutdated[] => {
    const result: GenericOutdated[] = [];

    // eslint-disable-next-line guard-for-in
    for (const key in object) {
        // TODO: better typing
        // but i mean there has to be a key if we loop over it right...? Right JavaScript?
        const element = (object as { [index: string]: unknown })[key];
        if (isOutdatedNpm(element)) {
            result.push({
                package: key,
                current: element.current,
                wanted: element.wanted,
                latest: element.latest,
            });
        }
    }

    return result;
};

// I could to a more in depth type guard but i don´t want to. So we will just assume that yarn report right
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isYarnOutdatedTable = (object: any): object is YarnOutdatedTable =>
    Object.prototype.hasOwnProperty.call(object, 'head') &&
    Array.isArray(object.head) &&
    object.head[0] === 'Package' &&
    object.head[1] === 'Current' &&
    object.head[2] === 'Wanted' &&
    object.head[3] === 'Latest' &&
    Object.prototype.hasOwnProperty.call(object, 'body') &&
    Array.isArray(object.body);

const transformYarnOutput = (array: YarnObject[]): GenericOutdated[] => {
    const outdatedTable = array.find(element => element.type === 'table');

    if (!outdatedTable || !isYarnOutdatedTable(outdatedTable.data)) {
        throw new Error('Yarn returned unexpected json');
    }

    const result: GenericOutdated[] = [];

    for (const outdated of outdatedTable.data.body) {
        result.push({
            package: outdated[0],
            current: outdated[1],
            wanted: outdated[2],
            latest: outdated[3],
        });
    }

    return result;
};

export = registerCommandModule()({
    command: 'updateReminder',
    describe: 'Prints a list of packages that have updates',
    // TODO: give more options to define version range
    builder: {
        'package-manager': {
            alias: 'm',
            choices: ['npm', 'yarn'],
            description:
                'The package manager you want to use. Keep in mind that both package managers report differently',
            default: 'npm',
        },
        'no-fail': {
            alias: 'n',
            type: 'boolean',
            description: 'If true only prints warning messages and do not exit with not zero code',
            default: false,
        },
    },
    handler: async argv => {
        const { 'package-manager': packageManager, 'no-fail': noFail } = argv;
        const tasks = new Listr([
            {
                title: `Check for updates with ${color.cyan(`${packageManager} outdated`)}`,
                task: async (context, task) =>
                    await execute(`${packageManager} outdated --json`)
                        .then(() => (task.title = `No package updates found`))
                        .catch((error: unknown) => {
                            if (error instanceof ExecuteError) {
                                let outdatedList: GenericOutdated[];

                                if (packageManager === 'npm') {
                                    outdatedList = transformNpmOutput(
                                        NPMOutputParser(error.stdout),
                                    );
                                } else if (packageManager === 'yarn') {
                                    outdatedList = transformYarnOutput(
                                        YarnOutputParser(error.stdout, error.stderr),
                                    );
                                } else {
                                    throw new Error('Unknown package manager');
                                }

                                context.outdatedList = outdatedList;
                                task.title = `Found ${color.red(
                                    outdatedList.length,
                                )} packages to update:`;
                                throw new HookFailedError();
                            }

                            throw new Error('Unknown error');
                        }),
            },
        ]);

        try {
            await tasks.run();
            process.exit(0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error.context.outdatedList) {
                new Table({
                    columns: [
                        { name: 'package', title: 'Package', alignment: 'left' },
                        { name: 'current', title: 'Current', alignment: 'left', color: 'red' },
                        { name: 'wanted', title: 'Wanted', alignment: 'left', color: 'cyan' },
                        { name: 'latest', title: 'Latest', alignment: 'left', color: 'green' },
                    ],
                    rows: error.context.outdatedList,
                }).printTable();
            }

            if (error instanceof HookFailedError && noFail) {
                process.exit(0);
            }

            process.exit(1);
        }
    },
});
