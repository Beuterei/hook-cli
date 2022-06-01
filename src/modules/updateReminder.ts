import { color } from 'console-log-colors';
import Listr from 'listr';
import { Table } from 'console-table-printer';

import { HookFailedError, registerCommandModule } from '../util/commandModule.helper';
import { execute, ExecuteError } from '../util/exec.helper';
import { NPMOutputParser } from '../util/npm.helper';
import { YarnObject, YarnOutputParser } from '../util/yarn.helper';

interface OutdatedNpm {
    current: string;
    wanted: string;
    latest: string;
}

interface GenericOutdated {
    package: string;
    current: string;
    wanted: string;
    latest: string;
}

interface YarnOutdatedTable {
    head: string[];
    body: string[][];
}

const isOutdatedNpm = (obj: any): obj is OutdatedNpm =>
    Object.prototype.hasOwnProperty.call(obj, 'current') &&
    typeof obj.current === 'string' &&
    Object.prototype.hasOwnProperty.call(obj, 'wanted') &&
    typeof obj.wanted === 'string' &&
    Object.prototype.hasOwnProperty.call(obj, 'latest') &&
    typeof obj.latest === 'string';

const transformNpmOutput = (obj: Object): GenericOutdated[] => {
    let result: GenericOutdated[] = [];

    for (let key in obj) {
        // TODO: better typing
        // but i mean there has to be a key if we loop over it right...? Right JavaScript?
        const el = (obj as { [index: string]: unknown })[key];
        if (isOutdatedNpm(el)) {
            result.push({
                package: key,
                current: el.current,
                wanted: el.wanted,
                latest: el.latest,
            });
        }
    }

    return result;
};

// I could to a more in depth type guard but i don´t want to. So we will just assume that yarn report right
const isYarnOutdatedTable = (obj: any): obj is YarnOutdatedTable =>
    Object.prototype.hasOwnProperty.call(obj, 'head') &&
    Array.isArray(obj.head) &&
    obj.head[0] === 'Package' &&
    obj.head[1] === 'Current' &&
    obj.head[2] === 'Wanted' &&
    obj.head[3] === 'Latest' &&
    Object.prototype.hasOwnProperty.call(obj, 'body') &&
    Array.isArray(obj.body);

const transformYarnOutput = (arr: YarnObject[]): GenericOutdated[] => {
    const outdatedTable = arr.find(el => el.type === 'table');

    if (!outdatedTable || !isYarnOutdatedTable(outdatedTable.data)) {
        throw new Error('Yarn returned unexpected json');
    }

    let result: GenericOutdated[] = [];

    for (var outdated of outdatedTable.data.body) {
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
        fail: {
            alias: 'f',
            type: 'boolean',
            description: 'If true it will exit with a non zero in case of updates',
            default: false,
        },
    },
    handler: async argv => {
        const { 'package-manager': packageManager, fail } = argv;
        const tasks = new Listr([
            {
                title: `Check for updates with '${color.cyan(`${packageManager} outdated`)}'`,
                task: (ctx, task) =>
                    execute(`${packageManager} outdated --json`)
                        .then(() => (task.title = `No package updates found`))
                        .catch((e: unknown) => {
                            if (e instanceof ExecuteError) {
                                let outdatedList: GenericOutdated[];

                                if (packageManager === 'npm') {
                                    outdatedList = transformNpmOutput(NPMOutputParser(e.stdout));
                                } else if (packageManager === 'yarn') {
                                    outdatedList = transformYarnOutput(
                                        YarnOutputParser(e.stdout, e.stderr),
                                    );
                                } else {
                                    throw new Error('Unknown package manager');
                                }

                                ctx.outdatedList = outdatedList;
                                task.title = `Found ${color.red(
                                    outdatedList.length,
                                )} packages to update:`;
                                throw new HookFailedError();
                            }

                            throw new Error('Unknown error');
                        }),
            },
        ]);

        tasks
            .run()
            .then(() => process.exit(0))
            .catch(e => {
                if (e.context.outdatedList) {
                    new Table({
                        columns: [
                            { name: 'package', title: 'Package', alignment: 'left' },
                            { name: 'current', title: 'Current', alignment: 'left', color: 'red' },
                            { name: 'wanted', title: 'Wanted', alignment: 'left', color: 'cyan' },
                            { name: 'latest', title: 'Latest', alignment: 'left', color: 'green' },
                        ],
                        rows: e.context.outdatedList,
                    }).printTable();
                }

                if (e instanceof HookFailedError) {
                    if (fail) {
                        process.exit(1);
                    }

                    process.exit(0);
                }

                process.exit(1);
            });
    },
});
