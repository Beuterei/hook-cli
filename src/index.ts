#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';

const main = defineCommand({
    meta: {
        description: 'A small hook cli that can be used with for example husky',
        name: 'hook-cli',
    },
    subCommands: {
        checkCommitMessageIssueKey: async () =>
            await import('./commands/checkCommitMessageIssueKey').then(
                (resolved) => resolved.command,
            ),
        checkCommitMessagePattern: async () =>
            await import('./commands/checkCommitMessagePattern').then(
                (resolved) => resolved.command,
            ),
        checkForFileChanged: async () =>
            await import('./commands/checkForFileChanged').then((resolved) => resolved.command),
        checkForVulnerabilities: async () =>
            await import('./commands/checkForVulnerabilities').then((resolved) => resolved.command),
        checkPackageVersion: async () =>
            await import('./commands/checkPackageVersion').then((resolved) => resolved.command),
        checkPackageVersionInFile: async () =>
            await import('./commands/checkPackageVersionInFile').then(
                (resolved) => resolved.command,
            ),
        updateReminder: async () =>
            await import('./commands/updateReminder').then((resolved) => resolved.command),
    },
});

void runMain(main);
