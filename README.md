[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">

  <p align="center">
    <img src="assets/cli.gif" alt="hook-cli demo" width="600">
  </p>

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

- [About The Project](#about-the-project)
    - [Disclaimer](#disclaimer)
    - [Installation](#installation)
    - [Usage](#usage)
    - [Commands](#commands)
        - [checkCommitMessageIssueKey](#checkcommitmessageissuekey)
            - [Example usage](#example-usage)
        - [checkCommitMessagePattern](#checkcommitmessagepattern)
            - [Example usage](#example-usage-1)
        - [checkForFileChanged](#checkforfilechanged)
            - [Example usage](#example-usage-2)
        - [checkForVulnerabilities](#checkforvulnerabilities)
            - [Example usage](#example-usage-3)
        - [checkPackageVersion](#checkpackageversion)
            - [Example usage](#example-usage-4)
        - [checkPackageVersionInFile](#checkpackageversioninfile)
            - [Example usage](#example-usage-5)
        - [updateReminder](#updatereminder)
            - [Example usage](#example-usage-6)
- [Useful](#useful)

#### checkCommitMessageIssueKey

Check the pattern of a commit message

| Option              | Description                                                              | Type      | default |
| ------------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-p`, `--prefix`    | Prefix of the issue key.                                                 | `string`  | ``      |
| `-m`, `--message`   | Get message from command line instead of file.                           | `string`  | ``      |
| `-w`, `--warn-only` | If true only prints warning messages and do not exit with not zero code. | `boolean` | `false` |

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
npx hook-cli checkCommitMessageIssueKey -m "KEY-12 message" -p "KEY" -w
```

#### checkCommitMessagePattern

Check the pattern of a commit message

| Option              | Description                                                              | Type      | default |
| ------------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-p`, `--pattern`   | Regex pattern to check the message against.                              | `string`  | ``      |
| `-m`, `--message`   | Get message from command line instead of file.                           | `string`  | ``      |
| `-w`, `--warn-only` | If true only prints warning messages and do not exit with not zero code. | `boolean` | `false` |

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
npx hook-cli checkCommitMessagePattern -m "I say HelloWorld" -p "HelloWorld" -w
```

#### checkForFileChanged

Check if a staged file like a changelog was changed locale or remote compared to another branch

| Option              | Description                                                              | Type      | default |
| ------------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-b`, `--branch`    | Branch to compare to.                                                    | `string`  | `main`  |
| `-w`, `--warn-only` | If true only prints warning messages and do not exit with not zero code. | `boolean` | `false` |

##### Example usage

```bash
npx hook-cli checkForFileChanged CHANGELOG.md
```

```bash
npx hook-cli checkForFileChanged CHANGELOG.md -b trunk
```

```bash
npx hook-cli checkForFileChanged CHANGELOG.md -w
```

```bash
npx hook-cli checkForFileChanged CHANGELOG.md -b trunk -w
```

#### checkForVulnerabilities

Runs a package audit and collects the results.

| Option                    | Description                                                                                      | Type                                          | default    |
| ------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | ---------- |
| `-m`, `--package-manager` | The package manager you want to use. Keep in mind that both package managers report differently. | `yarn`, `npm`                                 | `npm`      |
| `-l`, `--audit-level`     | The severity of the vulnerabilities what the script will report.                                 | `info`, `low`, `moderate`, `high`, `critical` | `critical` |
| `-p`, `--prod`            | If true only run audit for prod dependencies and skip dev ones.                                  | `boolean`                                     | `false`    |
| `-w`, `--warn-only`       | If true only prints warning messages and do not exit with not zero code.                         | `boolean`                                     | `false`    |

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
npx hook-cli checkForVulnerabilities --warn-only
```

```bash
npx hook-cli checkForVulnerabilities --prod
```

```bash
npx hook-cli checkForVulnerabilities -l high -m yarn -w -p
```

#### checkPackageVersion

Check if the version field is the same for package.json and package-lock.json

| Option              | Description                                                              | Type      | default |
| ------------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-w`, `--warn-only` | If true only prints warning messages and do not exit with not zero code. | `boolean` | `false` |

##### Example usage

```bash
npx hook-cli checkPackageVersion
```

#### checkPackageVersionInFile

Check if the version field is the same for package.json and file

| Option              | Description                                                              | Type      | default |
| ------------------- | ------------------------------------------------------------------------ | --------- | ------- |
| `-p`, `--json-path` | Path in json file to check                                               | `string`  | ``      |
| `-w`, `--warn-only` | If true only prints warning messages and do not exit with not zero code. | `boolean` | `false` |

##### Example usage

```bash
npx hook-cli checkPackageVersionInFile hello.json -p 'path.version'
```

```bash
npx hook-cli checkPackageVersionInFile hello.json -p 'path.version' -w
```

#### updateReminder

Prints a list of packages that have updates.

| Option                    | Description                                                                                      | Type          | default |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------- | ------- |
| `-m`, `--package-manager` | The package manager you want to use. Keep in mind that both package managers report differently. | `yarn`, `npm` | `npm`   |
| `-w`, `--warn-only`       | If true only prints warning messages and do not exit with not zero code.                         | `boolean`     | `false` |

##### Example usage

```bash
npx hook-cli updateReminder
```

```bash
npx hook-cli updateReminder -m yarn
```

```bash
npx hook-cli updateReminder -w
```

```bash
npx hook-cli updateReminder -m yarn -w
```

## Useful

- Print help page for command

```bash
npx hook-cli [command] --help
```

- Test command during development (Exit codes get not correctly forwarded).

```bash
npm run hook-cli -- [command]
```

- Test command during development with correct exi code.

```bash
npx tsx src/index.ts [command]
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
