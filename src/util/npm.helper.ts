interface NPMErrorObject {
    message: string;
}

const isNPMError = (object: unknown): object is NPMErrorObject =>
    typeof object === 'object' && Object.prototype.hasOwnProperty.call(object, 'message');

/**
 * Parse a npm --json command output.
 * Throws error if it encounters invalid json or a error message from npm
 * @example <caption>Execute command</caption>
 * const result = NPMOutputParser(await execute('npm outdated --json').stdout);
 */
export const NPMOutputParser = (stdout: string): Object => {
    let outputObject = {};

    try {
        outputObject = JSON.parse(stdout);
    } catch {
        throw new Error('Unable to parse npm json response');
    }

    if (isNPMError(outputObject)) {
        throw new Error(outputObject.message);
    }

    return outputObject;
};
