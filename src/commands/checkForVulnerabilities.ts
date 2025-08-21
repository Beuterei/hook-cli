import { HookFailedException } from '../exceptions/hookFailed.exception';
import { execute, ExecuteError } from '../util/exec.helper';
import { NPMOutputParser } from '../util/npm.helper';
import { Spinner } from '../util/spinner.helper';
import { YarnOutputParser } from '../util/yarn.helper';
import { defineCommand } from 'citty';
import { color } from 'console-log-colors';

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
            critical: auditResult.critical,
            high: auditResult.high,
            info: auditResult.info,
            low: auditResult.low,
            moderate: auditResult.moderate,
        };
    }

    throw new Error('Package manager returned unexpected json');
};

const auditCommandBuilder = (packageManager: string, production: boolean) => {
    let auditCommand = `${packageManager} audit`;

    if (production) {
        if (packageManager === 'yarn') {
            auditCommand += ' --groups dependencies';
        } else if (packageManager === 'npm') {
            auditCommand += ' --only=prod';
        }
    }

    return auditCommand;
};

const totalVulnerabilities = (object: AuditResult) =>
    Object.values(object).reduce((previousValue, currentValue) => previousValue + currentValue);

export const command = defineCommand({
    args: {
        'audit-level': {
            alias: 'l',
            default: 'critical',
            description:
                'The severity of the vulnerabilities what the script will report (info, low, moderate, high, critical)',
            type: 'string',
        },
        'package-manager': {
            alias: 'w',
            default: 'npm',
            description:
                'The package manager you want to use. Keep in mind that both package managers report differently (npm, yarn)',
            type: 'string',
        },
        prod: {
            alias: 'p',
            default: false,
            description: 'If true only run audit for prod dependencies and skip dev ones',
            type: 'boolean',
        },
        'warn-only': {
            alias: 'n',
            default: false,
            description: 'If true only prints warning messages and do not exit with not zero code',
            type: 'boolean',
        },
    },
    meta: {
        description: 'Runs a package audit and collects the results',
        name: 'checkForVulnerabilities',
    },
    run: async ({
        args: {
            'audit-level': auditLevel,
            'package-manager': packageManager,
            prod,
            'warn-only': warnOnly,
        },
    }) => {
        const spinner = new Spinner();
        spinner.start(`Checking for vulnerabilities with ${color.cyan(packageManager + ' audit')}`);

        try {
            await execute(`${auditCommandBuilder(packageManager, prod)} --json`)
                .then(() =>
                    spinner.done(
                        `No package vulnerabilities with level ${auditLevel} or higher found`,
                    ),
                )

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
                                (element) => element.type === 'auditSummary',
                            );
                            if (auditSummary) {
                                const vulnerabilities = (
                                    auditSummary.data as { vulnerabilities: unknown }
                                ).vulnerabilities;

                                auditResult = filterAuditResult(vulnerabilities);
                            } else {
                                spinner.fail('Yarn returned unexpected json');
                                throw new Error('Yarn returned unexpected json');
                            }
                        } else {
                            spinner.fail('Unknown package manager');
                            throw new Error('Unknown package manager');
                        }

                        let levelMet: boolean;
                        switch (auditLevel) {
                            case 'critical':
                                levelMet = auditResult.critical > 0;
                                break;
                            case 'high':
                                levelMet = auditResult.high > 0 || auditResult.critical > 0;
                                break;
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
                            default:
                                levelMet = false;
                        }

                        const auditCount = totalVulnerabilities(auditResult);

                        if (levelMet) {
                            spinner.failWithNoFail(
                                warnOnly,
                                `Found ${color.red(auditCount)} level ${
                                    warnOnly ? color.yellowBG(auditLevel) : color.bgRed(auditLevel)
                                } or higher vulnerabilities. Run '${color.cyan(
                                    `${auditCommandBuilder(packageManager, prod)}`,
                                )}' for more information`,
                            );

                            throw new HookFailedException();
                        }

                        spinner.doneWithWarning(
                            `Found ${color.cyan(
                                auditCount,
                            )} vulnerabilities of lower level then ${color.cyan(auditLevel)}`,
                        );

                        return; // We found some but we dont care because the level is not right
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
