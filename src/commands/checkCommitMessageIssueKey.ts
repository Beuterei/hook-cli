import { checkCommitMessagePattern } from './checkCommitMessagePattern';
import { defineCommand } from 'citty';

export const command = defineCommand({
    args: {
        message: {
            alias: 'm',
            description: 'Get message from command line instead of file',
            type: 'string',
        },
        prefix: {
            alias: 'p',
            description: 'Prefix of the issue key',
            type: 'string',
        },
        'warn-only': {
            alias: 'w',
            default: false,
            description: 'If true only prints warning messages and do not exit with not zero code',
            type: 'boolean',
        },
    },
    meta: {
        description: 'Check the commit message for a issue key',
        name: 'checkCommitMessageIssueKey [commitMsgPath]',
    },
    run: async ({
        args: {
            _: [commitMessagePath],
            message,
            prefix,
            'warn-only': warnOnly,
        },
    }) => {
        const ticketRegex = `^(${prefix ? prefix : '[A-Z]+'}-[0-9]{1,10})( ?/ ?(${
            prefix ? prefix : '[A-Z]+'
        }-[0-9]{1,10}))*? (?!/).*`;

        await checkCommitMessagePattern({
            commitMessagePath,
            message,
            pattern: ticketRegex,
            warnOnly,
        });
    },
});
