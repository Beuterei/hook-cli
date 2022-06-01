export interface YarnObject {
    type: string;
    data: unknown;
}

const isYarnObject = (obj: any): obj is YarnObject =>
    Object.prototype.hasOwnProperty.call(obj, 'type') &&
    typeof obj.type === 'string' &&
    Object.prototype.hasOwnProperty.call(obj, 'data');

/**
 * Parse a yarn --json command output (One object per line).
 * Throws error if it encounters invalid json or a error data type from yarn
 * @example <caption>Execute command</caption>
 * const commandOut = await execute('yarn outdated --json');
 * const result = YarnOutputParser(commandOut.stdout, commandOut.stderr);
 */
export const YarnOutputParser = (stdout: string, stderr: string): YarnObject[] => {
    const rawOutputArr = stdout.split(/\r?\n/);
    const rawErrorArr = stderr.split(/\r?\n/);

    let outputObj = [];
    let errorObj = [];

    try {
        // filter empty elements for new line at the end
        outputObj = JSON.parse(`[${rawOutputArr.filter(el => el).join()}]`) as Array<Object>;
        errorObj = JSON.parse(`[${rawErrorArr.filter(el => el).join()}]`) as Array<Object>;
    } catch (e) {
        throw new Error('Unable to parse yarn json response');
    }

    const error = errorObj.find(el => isYarnObject(el) && el.type === 'error') as YarnObject;
    if (error) {
        throw new Error(typeof error.data === 'string' ? error.data : 'Unknown error');
    }

    return outputObj.filter(el => isYarnObject(el)) as YarnObject[];
};
