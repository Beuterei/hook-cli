import { color } from 'console-log-colors';
import Listr from 'listr';
import { HookFailedError, registerCommandModule } from '../util/commandModule.helper';
import { execute, ExecuteError } from '../util/exec.helper';
import { NPMOutputParser } from '../util/npm.helper';
import { YarnOutputParser } from '../util/yarn.helper';

interface AuditResult {
    critical: number;
    high: number;
    info: number;
    low: number;
    moderate: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isAuditResult = (object: any): object is AuditResult =>
    Object.prototype.hasOwnProperty.call(object, 'info') &&
    typeof object.info === 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'low') &&
    typeof object.low === 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'moderate') &&
    typeof object.moderate === 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'high') &&
    typeof object.high === 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'critical') &&
    typeof object.critical === 'number';

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

const auditCommandBuilder = (packageManager: string, production: boolean) => {
    let command = `${packageManager} audit`;

    if (production) {
        if (packageManager === 'yarn') {
            command += ' --groups dependencies';
        } else if (packageManager === 'npm') {
            command += ' --only=prod';
        }
    }

    return command;
};

const totalVulnerabilities = (object: AuditResult) => Object.values(object).reduce((a, b) => a + b);

export = registerCommandModule()({
    command: 'checkForVulnerabilities',
    describe: 'Runs a package audit and collects the results',
    builder: {
        'package-manager': {
            alias: 'm',
            choices: ['npm', 'yarn'],
            description:
                'The package manager you want to use. Keep in mind that both package managers report differently',
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
                title: `Check for vulnerabilities with ${color.cyan(`${packageManager} audit`)}`,
                task: async (_context, task) =>
                    await execute(`${auditCommandBuilder(packageManager, prod)} --json`)
                        .then(
                            () =>
                                (task.title = `No package vulnerabilities with level ${auditLevel} or higher found`),
                        )
                        // eslint-disable-next-line complexity
                        .catch(async (error: unknown) => {
                            if (error instanceof ExecuteError) {
                                let auditResult: AuditResult;
                                if (packageManager === 'npm') {
                                    const result = (
                                        NPMOutputParser(error.stdout) as {
                                            metadata: { vulnerabilities: unknown };
                                        }
                                    ).metadata.vulnerabilities;

                                    auditResult = filterAuditResult(result);
                                } else if (packageManager === 'yarn') {
                                    const result = YarnOutputParser(error.stdout, error.stderr);

                                    const auditSummary = result.find(
                                        element => element.type === 'auditSummary',
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

                                let levelMet: boolean;
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
                                    default:
                                        levelMet = false;
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
                                    throw new HookFailedError();
                                }

                                task.title = `Found ${color.cyan(
                                    auditCount,
                                )} vulnerabilities of lower level then ${color.cyan(auditLevel)}`;
                                return; // We found some but we dont care because the level is not right
                            }

                            throw new Error('Unknown error');
                        }),
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
