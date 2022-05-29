interface NPMErrorObj {
    message: string;
}

const isNPMError = (obj: unknown): obj is NPMErrorObj =>
    typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, 'message');

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
