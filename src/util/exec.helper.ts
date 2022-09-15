import { exec } from 'child_process';

interface ExecuteResolve {
    code: number;
    stderr: string;
    stdout: string;
}

export class ExecuteError extends Error {
    public constructor(
        public readonly code: number | null,
        public readonly stdout: string,
        public readonly stderr: string,
    ) {
        super();
    }
}

/**
 * Execute a command and collects the results
 *
 * @example <caption>Execute command</caption>
 * const result = await execute('echo HelloWorld');
 * console.log(result.stdout)
 */
export const execute = async (command: string): Promise<ExecuteResolve> =>
    await new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        const execution = exec(command);
        execution.stdout?.on('data', data => (stdout += data));
        execution.stderr?.on('data', data => (stderr += data));
        execution.on('exit', code =>
            code === 0
                ? resolve({ code, stdout, stderr })
                : reject(new ExecuteError(code, stdout, stderr)),
        );
    });
