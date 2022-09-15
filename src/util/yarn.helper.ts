export interface YarnObject {
    data: unknown;
    type: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isYarnObject = (object: any): object is YarnObject =>
    Object.prototype.hasOwnProperty.call(object, 'type') &&
    typeof object.type === 'string' &&
    Object.prototype.hasOwnProperty.call(object, 'data');

/**
 * Parse a yarn --json command output (One object per line).
 * Throws error if it encounters invalid json or a error data type from yarn
 *
 * @example <caption>Execute command</caption>
 * const commandOut = await execute('yarn outdated --json');
 * const result = YarnOutputParser(commandOut.stdout, commandOut.stderr);
 */
export const YarnOutputParser = (stdout: string, stderr: string): YarnObject[] => {
    const rawOutputArray = stdout.split(/\r?\n/u);
    const rawErrorArray = stderr.split(/\r?\n/u);

    let outputObject = [];
    let errorObject = [];

    try {
        // filter empty elements for new line at the end
        outputObject = JSON.parse(`[${rawOutputArray.filter(Boolean).join(',')}]`) as Object[];
        errorObject = JSON.parse(`[${rawErrorArray.filter(Boolean).join(',')}]`) as Object[];
    } catch {
        throw new Error('Unable to parse yarn json response');
    }

    const error = errorObject.find(
        element => isYarnObject(element) && element.type === 'error',
    ) as YarnObject;
    if (error) {
        throw new Error(typeof error.data === 'string' ? error.data : 'Unknown error');
    }

    return outputObject.filter(element => isYarnObject(element)) as YarnObject[];
};
