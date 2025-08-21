import { checkPackageVersionInFile } from './checkPackageVersionInFile';
import { defineCommand } from 'citty';

export const command = defineCommand({
    args: {
        'warn-only': {
            alias: 'w',
            default: false,
            description: 'If true only prints warning messages and do not exit with not zero code',
            type: 'boolean',
        },
    },
    meta: {
        description:
            'Check if the version field is the same for package.json and package-lock.json',
        name: 'checkPackageVersion',
    },
    run: async ({ args: { 'warn-only': warnOnly } }) => {
        await checkPackageVersionInFile({
            filePath: 'package-lock.json',
            jsonPath: "packages[''].version",
            warnOnly,
        });
    },
});
