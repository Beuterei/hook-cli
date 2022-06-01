interface NPMErrorObj {
    message: string;
}

const isNPMError = (obj: unknown): obj is NPMErrorObj =>
    typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, 'message');

/**
 * Parse a npm --json command output.
 * Throws error if it encounters invalid json or a error message from npm
 * @example <caption>Execute command</caption>
 * const result = NPMOutputParser(await execute('npm outdated --json').stdout);
 */
export const NPMOutputParser = (stdout: string): Object => {
    let outputObj = {};

    try {
        outputObj = JSON.parse(stdout);
    } catch (e) {
        throw new Error('Unable to parse npm json response');
    }

    if (isNPMError(outputObj)) {
        throw new Error(outputObj.message);
    }

    return outputObj;
};
