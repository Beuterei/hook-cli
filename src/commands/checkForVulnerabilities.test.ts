// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/exec.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/spinner.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/npm.mock';
// eslint-disable-next-line import/no-unassigned-import
import '../../__mocks__/yarn.mock';
import { execute, ExecuteError } from '../util/exec.helper';
import { NPMOutputParser } from '../util/npm.helper';
import { YarnOutputParser } from '../util/yarn.helper';
import { command } from './checkForVulnerabilities';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { mockedFn } from 'vitest-mock-extended';

const executeMock = mockedFn(execute);
const npmOutputParserMock = mockedFn(NPMOutputParser);
const yarnOutputParserMock = mockedFn(YarnOutputParser);

const createContext = (args: Record<string, unknown>) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    cmd: command,
    rawArgs: [],
});

describe('checkForVulnerabilities command', () => {
    let exitSpy: MockInstance;

    beforeEach(() => {
        vi.resetAllMocks();
        exitSpy = vi
            .spyOn(process, 'exit')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .mockImplementation((() => {}) as any);
    });

    type PM = 'npm' | 'yarn';

    const buildParsers = (pm: PM, vulnerabilities: Partial<Record<string, number>>) => {
        const full: Record<string, number> = {
            critical: 0,
            high: 0,
            info: 0,
            low: 0,
            moderate: 0,
            ...vulnerabilities,
        };

        if (pm === 'npm') {
            npmOutputParserMock.mockReturnValue({ metadata: { vulnerabilities: full } });
        } else {
            yarnOutputParserMock.mockReturnValue([
                { data: { vulnerabilities: full }, type: 'auditSummary' },
            ]);
        }
    };

    it.each([
        {
            auditLevel: 'critical',
            expectedExit: 0,
            pm: 'npm',
            reject: false,
            title: 'no vulnerabilities - exit 0',
            vulnerabilities: {},
            warnOnly: false,
        },
        {
            auditLevel: 'critical',
            expectedExit: 1,
            pm: 'npm',
            reject: true,
            title: 'critical vulnerabilities, audit-level=critical ➜ exit 1',
            vulnerabilities: { critical: 1 },
            warnOnly: false,
        },
        {
            auditLevel: 'critical',
            expectedExit: 0,
            pm: 'npm',
            reject: true,
            title: 'critical vulnerabilities, audit-level=critical, no-fail=true ➜ exit 0',
            vulnerabilities: { critical: 1 },
            warnOnly: true,
        },
        {
            auditLevel: 'critical',
            expectedExit: 0,
            pm: 'npm',
            reject: true,
            title: 'low vulnerabilities below audit-level=critical ➜ exit 0',
            vulnerabilities: { low: 2 },
            warnOnly: false,
        },
        {
            auditLevel: 'critical',
            expectedExit: 1,
            pm: 'yarn',
            reject: true,
            title: 'yarn audit with critical vulnerabilities ➜ exit 1',
            vulnerabilities: { critical: 1 },
            warnOnly: false,
        },
    ])('$title', async ({ auditLevel, expectedExit, pm, reject, vulnerabilities, warnOnly }) => {
        buildParsers(pm as PM, vulnerabilities);
        if (reject) {
            executeMock.mockRejectedValue(
                new ExecuteError(1, `${pm} audit output`, `${pm} audit stderr`),
            );
        } else {
            executeMock.mockResolvedValue({ code: 0, stderr: '', stdout: '' });
        }

        await command.run?.(
            createContext({
                'audit-level': auditLevel,
                'package-manager': pm,
                prod: false,
                'warn-only': warnOnly,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(expectedExit);
    });

    it.each([
        { auditLevel: 'high', expectExit: 1, vulnerabilities: { high: 1 } },
        { auditLevel: 'high', expectExit: 1, vulnerabilities: { critical: 1 } },
        {
            auditLevel: 'moderate',
            expectExit: 1,
            vulnerabilities: { moderate: 1 },
        },
        {
            auditLevel: 'moderate',
            expectExit: 1,
            vulnerabilities: { critical: 1 },
        },
        { auditLevel: 'low', expectExit: 1, vulnerabilities: { critical: 1 } },
        {
            auditLevel: 'info',
            expectExit: 1,
            vulnerabilities: { moderate: 1 },
        },
        {
            auditLevel: 'info',
            expectExit: 1,
            vulnerabilities: { high: 1 },
        },
        {
            auditLevel: 'info',
            expectExit: 1,
            vulnerabilities: { critical: 1 },
        },
    ])('handles audit-level %s correctly', async ({ auditLevel, expectExit, vulnerabilities }) => {
        buildParsers('npm', vulnerabilities);
        executeMock.mockRejectedValue(new ExecuteError(1, 'npm audit output', ''));

        await command.run?.(
            createContext({
                'audit-level': auditLevel,
                'package-manager': 'npm',
                prod: false,
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(expectExit);
    });

    it('exits with 1 when npm vulnerabilities JSON is in unexpected format', async () => {
        npmOutputParserMock.mockReturnValue({ metadata: { vulnerabilities: { foo: 1 } } });
        executeMock.mockRejectedValue(new ExecuteError(1, 'npm audit output', ''));

        await command.run?.(
            createContext({
                'audit-level': 'critical',
                'package-manager': 'npm',
                prod: false,
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('uses yarn production flags when prod=true', async () => {
        executeMock.mockResolvedValue({ code: 0, stderr: '', stdout: '' });

        await command.run?.(
            createContext({
                'audit-level': 'critical',
                'package-manager': 'yarn',
                prod: true,
                'warn-only': false,
            }),
        );

        expect(executeMock).toHaveBeenCalledWith('yarn audit --groups dependencies --json');
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('uses npm production flags when prod=true', async () => {
        executeMock.mockResolvedValue({ code: 0, stderr: '', stdout: '' });

        await command.run?.(
            createContext({
                'audit-level': 'critical',
                'package-manager': 'npm',
                prod: true,
                'warn-only': false,
            }),
        );

        expect(executeMock).toHaveBeenCalledWith('npm audit --only=prod --json');
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('handles unknown audit level default branch', async () => {
        buildParsers('npm', { high: 1 });
        executeMock.mockRejectedValue(new ExecuteError(1, 'npm audit', ''));

        await command.run?.(
            createContext({
                'audit-level': 'unknown',
                'package-manager': 'npm',
                prod: false,
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('exits with 1 when an unknown error occurs', async () => {
        executeMock.mockRejectedValue(new Error('Something went wrong'));

        await command.run?.(
            createContext({
                'audit-level': 'critical',
                'package-manager': 'npm',
                prod: false,
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('exits with 1 on unexpected parser format', async () => {
        yarnOutputParserMock.mockReturnValue([{ data: {}, type: 'invalidType' }]);
        executeMock.mockRejectedValue(new ExecuteError(1, 'yarn audit output', 'yarn stderr'));

        await command.run?.(
            createContext({
                'audit-level': 'critical',
                'package-manager': 'yarn',
                prod: false,
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('exits with 1 when unknown package manager is used', async () => {
        executeMock.mockRejectedValue(new ExecuteError(1, '', ''));

        await command.run?.(
            createContext({
                'audit-level': 'critical',
                'package-manager': 'pnpm',
                prod: false,
                'warn-only': false,
            }),
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});
