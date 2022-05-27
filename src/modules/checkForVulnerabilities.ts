import { color } from 'console-log-colors';
import Listr from 'listr';

import { registerCommandModule } from '../util/commandModule.helper';
import { execute, ExecuteError } from '../util/exec.helper';

interface AuditResult {
    info: number;
    low: number;
    moderate: number;
    high: number;
    critical: number;
}

interface YarnObject {
    type: string;
    data: unknown;
}

const isAuditResult = (obj: any): obj is AuditResult =>
    Object.prototype.hasOwnProperty.call(obj, 'info') &&
    typeof obj.info === 'number' &&
    Object.prototype.hasOwnProperty.call(obj, 'low') &&
    typeof obj.low === 'number' &&
    Object.prototype.hasOwnProperty.call(obj, 'moderate') &&
    typeof obj.moderate === 'number' &&
    Object.prototype.hasOwnProperty.call(obj, 'high') &&
    typeof obj.high === 'number' &&
    Object.prototype.hasOwnProperty.call(obj, 'critical') &&
    typeof obj.critical === 'number';

const isYarnObject = (obj: any): obj is YarnObject =>
    Object.prototype.hasOwnProperty.call(obj, 'type') &&
    typeof obj.type === 'string' &&
    Object.prototype.hasOwnProperty.call(obj, 'data');

const NPMJsonParser = (stdout: string): AuditResult => {
    const outputObj = JSON.parse(stdout);

    if (Object.prototype.hasOwnProperty.call(outputObj, 'message')) {
        throw new Error(outputObj.message);
    }

    const auditResult = outputObj.metadata.vulnerabilities;
    if (isAuditResult(auditResult)) {
        return auditResult;
    }

    throw new Error('Unable to parse npm json response');
};

const YarnJsonParser = (stdout: string, stderr: string): AuditResult => {
    const rawOutputArr = stdout.split(/\r?\n/);
    const rawErrorArr = stderr.split(/\r?\n/);

    // filter empty elements for new line at the end
    const outputObj = JSON.parse(`[${rawOutputArr.filter(el => el).join()}]`) as Array<unknown>;
    const errorObj = JSON.parse(`[${rawErrorArr.filter(el => el).join()}]`) as Array<unknown>;

    const error = errorObj.find(el => isYarnObject(el) && el.type === 'error') as YarnObject;
    if (error) {
        throw new Error(typeof error.data === 'string' ? error.data : 'Unknown error');
    }

    const result = outputObj.find(
        el => isYarnObject(el) && el.type === 'auditSummary',
    ) as YarnObject;
    if (result) {
        const auditResult = (result.data as { vulnerabilities: unknown }).vulnerabilities;
        if (isAuditResult(auditResult)) {
            return auditResult;
        }
    }

    throw new Error('Unable to parse yarn json response');
};

const auditCommandBuilder = (packageManager: string, prod: boolean) => {
    let command = `${packageManager} audit`;

    if (prod) {
        if (packageManager === 'yarn') {
            command += ' --groups dependencies';
        } else if (packageManager === 'npm') {
            command += ' --only=prod';
        }
    }

    return command;
};

const totalVulnerabilities = (obj: AuditResult) =>
    obj.info + obj.low + obj.moderate + obj.high + obj.critical; // be specific because the obj could have other stuff in it

export = registerCommandModule({
    command: 'checkForVulnerabilities',
    describe: 'Runs a package audit and collects the results',
    builder: {
        'package-manager': {
            alias: 'm',
            choices: ['npm', 'yarn'],
            description: 'The package manager you want to use',
            default: 'npm',
        },
        'audit-level': {
            alias: 'l',
            choices: ['info', 'low', 'moderate', 'high', 'critical'],
            description: 'The severity of the vulnerabilities what the script will report',
            default: 'critical',
        },
        'no-fail': {
            alias: 'n',
            type: 'boolean',
            description: 'If true only prints warning messages and do not exit with not zero code',
            default: false,
        },
        prod: {
            alias: 'p',
            type: 'boolean',
            description: 'If true only run audit for prod dependencies and skip dev ones',
            default: false,
        },
    },
    handler: async argv => {
        const {
            'audit-level': auditLevel,
            'no-fail': noFail,
            'package-manager': packageManager,
            prod,
        } = argv;
        const tasks = new Listr([
            {
                title: `Check for vulnerabilities with '${color.cyan(`${packageManager} audit`)}'`,
                task: (_ctx, task) =>
                    execute(`${auditCommandBuilder(packageManager, prod)} --json`)
                        .then(
                            () =>
                                (task.title = `No package vulnerabilities with level ${auditLevel} or higher found`),
                        )
                        .catch((e: unknown) => {
                            if (e instanceof ExecuteError) {
                                let auditResult: AuditResult;
                                if (packageManager === 'npm') {
                                    auditResult = NPMJsonParser(e.stdout);
                                } else if (packageManager === 'yarn') {
                                    auditResult = YarnJsonParser(e.stdout, e.stderr);
                                } else {
                                    throw new Error('Unknown package manager');
                                }

                                let levelMet = false;
                                switch (auditLevel) {
                                    case 'info':
                                        levelMet =
                                            auditResult.info > 0 ||
                                            auditResult.low > 0 ||
                                            auditResult.moderate > 0 ||
                                            auditResult.high > 0 ||
                                            auditResult.critical > 0;
                                        break;
                                    case 'low':
                                        levelMet =
                                            auditResult.low > 0 ||
                                            auditResult.moderate > 0 ||
                                            auditResult.high > 0 ||
                                            auditResult.critical > 0;
                                        break;
                                    case 'moderate':
                                        levelMet =
                                            auditResult.moderate > 0 ||
                                            auditResult.high > 0 ||
                                            auditResult.critical > 0;
                                        break;
                                    case 'high':
                                        levelMet = auditResult.high > 0 || auditResult.critical > 0;
                                        break;
                                    case 'critical':
                                        levelMet = auditResult.critical > 0;
                                        break;
                                }

                                if (levelMet) {
                                    task.title = `Found ${color.red(
                                        totalVulnerabilities(auditResult),
                                    )} level ${color.bgRed(
                                        auditLevel,
                                    )} or higher vulnerabilities. Run '${color.cyan(
                                        `${auditCommandBuilder(packageManager, prod)}`,
                                    )}' for more information`;
                                    throw new Error();
                                }

                                task.title = `Found ${color.cyan(
                                    totalVulnerabilities(auditResult),
                                )} vulnerabilities of lower level then ${color.cyan(auditLevel)}`;
                                return Promise.resolve(); // We found some but we dont care because the level is not right
                            }

                            throw new Error('Unknown error');
                        }),
            },
        ]);

        tasks
            .run()
            .then(() => process.exit(0))
            .catch(() => {
                if (noFail) {
                    process.exit(0);
                }

                process.exit(1);
            });
    },
});
