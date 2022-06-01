import { exec } from 'child_process';

interface ExecuteResolve {
    code: number;
    stdout: string;
    stderr: string;
}

export class ExecuteError extends Error {
    constructor(readonly code: number | null, readonly stdout: string, readonly stderr: string) {
        super();
    }
}

/**
 * Execute a command and collects the results
 * @example <caption>Execute command</caption>
 * const result = await execute('echo HelloWorld');
 * console.log(result.stdout)
 */
export const execute = (command: string): Promise<ExecuteResolve> =>
    new Promise((resolve, rejects) => {
        let stdout = '';
        let stderr = '';

        const execution = exec(command);
        execution.stdout?.on('data', data => (stdout += data));
        execution.stderr?.on('data', data => (stderr += data));
        execution.on('exit', code =>
            code === 0
                ? resolve({ code, stdout, stderr })
                : rejects(new ExecuteError(code, stdout, stderr)),
        );
    });
