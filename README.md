[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <img src="https://yargs.js.org/images/yargs-logo.png" alt="Logo" height="60">

  <h3 align="center">hook-cli</h3>

  <p align="center">
    A small hook cli
    <br />
    <br />
    ·
    <a href="https://github.com/Beuterei/hook-cli/issues">Report Bug</a>
    ·
    <a href="https://github.com/Beuterei/hook-cli/issues">Request Feature</a>
    ·
  </p>
</p>

<!-- ABOUT THE PROJECT -->

## About The Project

A small hook cli that can be used with for example [husky](https://typicode.github.io/husky/#/).

### Disclaimer

I know that most of this stuff is already solved by some awesome tools. So this is really just a CLI playground for me.

### Installation

```bash
npm i -D @beuluis/hook-cli
```

### Usage

Run commands. For example using the hooks in `.husky`.

    ```bash
    npx hook-cli [command] [...]
    ```

### Commands

-   [checkCommitMessageIssueKey](#checkcommitmessageissuekey)
-   [checkCommitMessagePattern](#checkcommitmessagepattern)
-   [checkForFileChanged](#checkforfilechanged)
-   [checkForVulnerabilities](#checkforvulnerabilities)
-   [checkPackageVersion](#checkpackageversion)
-   [checkPackageVersionInFile](#checkpackageversioninfile)
-   [updateReminder](#updatereminder)

#### checkCommitMessageIssueKey

Check the pattern of a commit message

| Option            | Description                                                              | Type      | default |
| ----------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-p`, `--prefix`  | Prefix of the issue key.                                                 | `string`  | ``      |
| `-m`, `--message` | Get message from command line instead of file.                           | `string`  | ``      |
| `-n`, `--no-fail` | If true only prints warning messages and do not exit with not zero code. | `boolean` | `false` |

##### Example usage

```bash
npx hook-cli checkCommitMessageIssueKey "$1" -p "HelloWorld"
```

```bash
npx hook-cli checkCommitMessageIssueKey .git/COMMIT_EDITMSG -p "KEY"
```

```bash
npx hook-cli checkCommitMessageIssueKey -m "KEY-12 message" -p "KEY"
```

```bash
npx hook-cli checkCommitMessageIssueKey -m "KEY-12 message" -p "KEY" -n
```

#### checkCommitMessagePattern

Check the pattern of a commit message

| Option            | Description                                                              | Type      | default |
| ----------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-p`, `--pattern` | Regex pattern to check the message against.                              | `string`  | ``      |
| `-m`, `--message` | Get message from command line instead of file.                           | `string`  | ``      |
| `-n`, `--no-fail` | If true only prints warning messages and do not exit with not zero code. | `boolean` | `false` |

##### Example usage

```bash
npx hook-cli checkCommitMessagePattern "$1" -p "HelloWorld"
```

```bash
npx hook-cli checkCommitMessagePattern .git/COMMIT_EDITMSG -p "HelloWorld"
```

```bash
npx hook-cli checkCommitMessagePattern -m "I say HelloWorld" -p "HelloWorld"
```

```bash
npx hook-cli checkCommitMessagePattern -m "I say HelloWorld" -p "HelloWorld" -n
```

#### checkForFileChanged

Check if a staged file like a changelog was changed locale or remote compared to another branch

| Option            | Description                                                              | Type      | default |
| ----------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-b`, `--branch`  | Branch to compare to.                                                    | `string`  | `main`  |
| `-n`, `--no-fail` | If true only prints warning messages and do not exit with not zero code. | `boolean` | `true`  |

##### Example usage

```bash
npx hook-cli checkForFileChanged CHANGELOG.md
```

```bash
npx hook-cli checkForFileChanged CHANGELOG.md -b trunk
```

```bash
npx hook-cli checkForFileChanged CHANGELOG.md -n
```

```bash
npx hook-cli checkForFileChanged CHANGELOG.md -b trunk -n
```

#### checkForVulnerabilities

Runs a package audit and collects the results.

| Option                    | Description                                                                                      | Type                                          | default    |
| ------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | ---------- |
| `-m`, `--package-manager` | The package manager you want to use. Keep in mind that both package managers report differently. | `yarn`, `npm`                                 | `npm`      |
| `-l`, `--audit-level`     | The severity of the vulnerabilities what the script will report.                                 | `info`, `low`, `moderate`, `high`, `critical` | `critical` |
| `-p`, `--prod`            | If true only run audit for prod dependencies and skip dev ones.                                  | `boolean`                                     | `false`    |
| `-n`, `--no-fail`         | If true only prints warning messages and do not exit with not zero code.                         | `boolean`                                     | `false`    |

##### Example usage

```bash
npx hook-cli checkForVulnerabilities
```

```bash
npx hook-cli checkForVulnerabilities --package-manager yarn
```

```bash
npx hook-cli checkForVulnerabilities --audit-level low
```

```bash
npx hook-cli checkForVulnerabilities --no-fail
```

```bash
npx hook-clicheckForVulnerabilities --prod
```

```bash
npx hook-cli checkForVulnerabilities -l high -m yarn -n -p
```

#### checkPackageVersion

Check if the version field is the same for package.json and package-lock.json

| Option            | Description                                                              | Type      | default |
| ----------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-n`, `--no-fail` | If true only prints warning messages and do not exit with not zero code. | `boolean` | `false` |

##### Example usage

```bash
npx hook-cli checkPackageVersion
```

#### checkPackageVersionInFile

Check if the version field is the same for package.json and file

| Option              | Description                                                              | Type      | default |
| ------------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-p`, `--json-path` | Path in json file to check                                               | `string`  | ``      |
| `-n`, `--no-fail`   | If true only prints warning messages and do not exit with not zero code. | `boolean` | `false` |

##### Example usage

```bash
npx hook-cli checkPackageVersionInFile hello.json -p 'path.version'
```

```bash
npx hook-cli checkPackageVersionInFile hello.json -p 'path.version' -n
```

#### updateReminder

Prints a list of packages that have updates.

| Option                    | Description                                                                                      | Type          | default |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------- | ------- |
| `-m`, `--package-manager` | The package manager you want to use. Keep in mind that both package managers report differently. | `yarn`, `npm` | `npm`   |
| `-n`, `--no-fail`         | If true only prints warning messages and do not exit with not zero code.                         | `boolean`     | `false` |

##### Example usage

```bash
npx hook-cli updateReminder
```

```bash
npx hook-cli updateReminder -m yarn
```

```bash
npx hook-cli updateReminder -n
```

```bash
npx hook-cli updateReminder -m yarn -n
```

<!-- REGISTER NEW COMMAND -->

## Register new command

1. Create new command module at `src/modules`.

```bash
touch src/modules/helloWorld.ts
```

2. Use the register helper to register a module and export it. See the Jsdoc for more usage information.

```typescript
import { registerCommandModule } from '../util/commandModule.helper';

export = registerCommandModule()({
    command: 'helloWorld',
    describe: 'HelloWorld',
    handler: () => console.log('HelloWorld'),
});
```

<!-- USEFUL -->

## Useful

-   Print help page for command

```bash
npx hook-cli [command] --help
```

-   Test command during development (Exit codes get not correctly forwarded).

```bash
npm run hook-cli -- [command]
```

-   Test command during development with correct exi code.

```bash
npx ts-node src/index.ts [command]
```

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/Beuterei/hook-cli.svg?style=flat-square
[contributors-url]: https://github.com/Beuterei/hook-cli/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Beuterei/hook-cli.svg?style=flat-square
[forks-url]: https://github.com/Beuterei/hook-cli/network/members
[stars-shield]: https://img.shields.io/github/stars/Beuterei/hook-cli.svg?style=flat-square
[stars-url]: https://github.com/Beuterei/hook-cli/stargazers
[issues-shield]: https://img.shields.io/github/issues/Beuterei/hook-cli.svg?style=flat-square
[issues-url]: https://github.com/Beuterei/hook-cli/issues
[license-shield]: https://img.shields.io/github/license/Beuterei/hook-cli.svg?style=flat-square
