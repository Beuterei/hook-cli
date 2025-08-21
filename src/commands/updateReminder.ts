import { HookFailedException } from '../exceptions/hookFailed.exception';
import { execute, ExecuteError } from '../util/exec.helper';
import { NPMOutputParser } from '../util/npm.helper';
import { Spinner } from '../util/spinner.helper';
import { type YarnObject, YarnOutputParser } from '../util/yarn.helper';
import { defineCommand } from 'citty';
import { color } from 'console-log-colors';
import { Table } from 'console-table-printer';

interface GenericOutdated {
    current: string;
    latest: string;
    package: string;
    wanted: string;
}

interface OutdatedNpm {
    current: string;
    latest: string;
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
                current: element.current,
                latest: element.latest,
                package: key,
                wanted: element.wanted,
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
    const outdatedTable = array.find((element) => element.type === 'table');

    if (!outdatedTable || !isYarnOutdatedTable(outdatedTable.data)) {
        throw new Error('Yarn returned unexpected json');
    }

    const result: GenericOutdated[] = [];

    for (const outdated of outdatedTable.data.body) {
        result.push({
            current: outdated[1],
            latest: outdated[3],
            package: outdated[0],
            wanted: outdated[2],
        });
    }

    return result;
};

export const command = defineCommand({
    // TODO: give more options to define version range
    args: {
        'package-manager': {
            alias: 'm',
            default: 'npm',
            description:
                'The package manager you want to use. Keep in mind that both package managers report differently (npm, yarn)',
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
        description: 'Prints a list of packages that have updates',
        name: 'updateReminder',
    },
    run: async ({ args: { 'package-manager': packageManager, 'warn-only': warnOnly } }) => {
        const spinner = new Spinner();
        spinner.start(`Checking for updates with ${color.cyan(`${packageManager + ' outdated'}`)}`);

        try {
            await execute(`${packageManager} outdated --json`)
                .then(() => spinner.done(`No package updates found`))
                .catch((error: unknown) => {
                    if (error instanceof ExecuteError) {
                        let outdatedList: GenericOutdated[];

                        if (packageManager === 'npm') {
                            outdatedList = transformNpmOutput(NPMOutputParser(error.stdout));
                        } else if (packageManager === 'yarn') {
                            outdatedList = transformYarnOutput(
                                YarnOutputParser(error.stdout, error.stderr),
                            );
                        } else {
                            throw new Error('Unknown package manager');
                        }

                        spinner.failWithNoFail(
                            warnOnly,
                            `Found ${color.red(outdatedList.length)} packages to update:`,
                        );

                        new Table({
                            columns: [
                                { alignment: 'left', name: 'package', title: 'Package' },
                                {
                                    alignment: 'left',
                                    color: 'red',
                                    name: 'current',
                                    title: 'Current',
                                },
                                {
                                    alignment: 'left',
                                    color: 'cyan',
                                    name: 'wanted',
                                    title: 'Wanted',
                                },
                                {
                                    alignment: 'left',
                                    color: 'green',
                                    name: 'latest',
                                    title: 'Latest',
                                },
                            ],
                            rows: outdatedList,
                        }).printTable();

                        throw new HookFailedException();
                    }

                    throw new Error('Unknown error');
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
