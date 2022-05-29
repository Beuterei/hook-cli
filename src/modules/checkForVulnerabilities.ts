import { color } from 'console-log-colors';
import Listr from 'listr';

import { registerCommandModule } from '../util/commandModule.helper';
import { execute, ExecuteError } from '../util/exec.helper';
import { NPMOutputParser } from '../util/npm.helper';
import { YarnOutputParser } from '../util/yarn.helper';

interface AuditResult {
    info: number;
    low: number;
    moderate: number;
    high: number;
    critical: number;
}

const filterAuditResult = (auditResult: unknown): AuditResult => {
    if (isAuditResult(auditResult)) {
        return {
            info: auditResult.info,
            low: auditResult.low,
            moderate: auditResult.moderate,
            high: auditResult.high,
            critical: auditResult.critical,
        };
    }

    throw new Error('Package manager returned unexpected json');
};

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

const totalVulnerabilities = (obj: AuditResult) => Object.values(obj).reduce((a, b) => a + b);

export = registerCommandModule({
    command: 'checkForVulnerabilities',
    describe: 'Runs a package audit and collects the results',
    builder: {
        'package-manager': {
            alias: 'm',
            choices: ['npm', 'yarn'],
            description: 'The package manager you want to use. Keep in mind that both package managers report differently',
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
                                    const result = (
                                        NPMOutputParser(e.stdout) as {
                                            metadata: { vulnerabilities: unknown };
                                        }
                                    ).metadata.vulnerabilities;

                                    auditResult = filterAuditResult(result);
                                } else if (packageManager === 'yarn') {
                                    const result = YarnOutputParser(e.stdout, e.stderr);

                                    const auditSummary = result.find(
                                        el => el.type === 'auditSummary',
                                    );
                                    if (auditSummary) {
                                        const vulnerabilities = (
                                            auditSummary.data as { vulnerabilities: unknown }
                                        ).vulnerabilities;

                                        auditResult = filterAuditResult(vulnerabilities);
                                    } else {
                                        throw new Error('Yarn returned unexpected json');
                                    }
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

                                const auditCount = totalVulnerabilities(auditResult);

                                if (levelMet) {
                                    task.title = `Found ${color.red(
                                        auditCount,
                                    )} level ${color.bgRed(
                                        auditLevel,
                                    )} or higher vulnerabilities. Run '${color.cyan(
                                        `${auditCommandBuilder(packageManager, prod)}`,
                                    )}' for more information`;
                                    throw new Error();
                                }

                                task.title = `Found ${color.cyan(
                                    auditCount,
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
