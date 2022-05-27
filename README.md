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

1. Add script to `package.json`

    ```json
    {
        "scripts": {
            "hook-cli": "hook-cli"
        }
    }
    ```

2. start using the hooks in `.husky`

    ```bash
    npm run hook-cli -- [command] [...]
    ```

### Commands

#### checkForVulnerabilities

Runs a package audit and collects the results

| Option                    | Description                                                             | Type                                          | default    |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------------------------- | ---------- |
| `-m`, `--package-manager` | The package manager you want to use                                     | `yarn`, `npm`                                 | `npm`      |
| `-l`, `--audit-level`     | The severity of the vulnerabilities what the script will report         | `info`, `low`, `moderate`, `high`, `critical` | `critical` |
| `-n`, `--no-fail`         | If true only prints warning messages and do not exit with not zero code | `boolean`                                     | `false`    |
| `-p`, `--prod`            | If true only run audit for prod dependencies and skip dev ones          | `boolean`                                     | `false`    |

##### Example usage

```bash
npm run hook-cli -- checkForVulnerabilities
```

```bash
npm run hook-cli -- checkForVulnerabilities --package-manager yarn
```

```bash
npm run hook-cli -- checkForVulnerabilities --audit-level low
```

```bash
npm run hook-cli -- checkForVulnerabilities --no-fail
```

```bash
npm run hook-cli -- checkForVulnerabilities --prod
```

```bash
npm run hook-cli -- checkForVulnerabilities -l high -m yarn -n -p
```

<!-- USEFUL -->

## Useful

Print help page for command

```bash
npm run hook-cli -- [command] --help
```

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

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
