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
    <a href="https://github.com/beuluis/hook-cli/issues">Report Bug</a>
    ·
    <a href="https://github.com/beuluis/hook-cli/issues">Request Feature</a>
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

#### updateReminder

Prints a list of packages that have updates.

| Option                    | Description                                                                                      | Type          | default |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------- | ------- |
| `-m`, `--package-manager` | The package manager you want to use. Keep in mind that both package managers report differently. | `yarn`, `npm` | `npm`   |
| `-n`, `--no-fail`         | If true only prints warning messages and do not exit with not zero code.                         | `boolean`     | `true`  |

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

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- TODO -->

## TODOs:

-   [ ] Add command to check version between `package.json` and `package-lock.json`
-   [ ] Add command to check engine
-   [ ] Add command to check types
-   [ ] Add command to check peerDependencies

<!-- CONTACT -->

## Contact

Luis Beu - me@luisbeu.de

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/beuluis/hook-cli.svg?style=flat-square
[contributors-url]: https://github.com/beuluis/hook-cli/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/beuluis/hook-cli.svg?style=flat-square
[forks-url]: https://github.com/beuluis/hook-cli/network/members
[stars-shield]: https://img.shields.io/github/stars/beuluis/hook-cli.svg?style=flat-square
[stars-url]: https://github.com/beuluis/hook-cli/stargazers
[issues-shield]: https://img.shields.io/github/issues/beuluis/hook-cli.svg?style=flat-square
[issues-url]: https://github.com/beuluis/hook-cli/issues
[license-shield]: https://img.shields.io/github/license/beuluis/hook-cli.svg?style=flat-square
