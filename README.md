# App App!

## Installation

`npm i -g app-app`

Install `tidy-html5`, and the [Tidy Linter](https://atom.io/packages/linter-tidy) for Atom:

```bash
brew install tidy-html5
```

## Usage

```bash
app-app <flags> [<project-name>...]
```

Then generate your new project:

```bash
app-app cool-project-name

cd cool-project-name
npm start
```

## Pre-defined stacks

**This is a work in progress, not all stacks functional.**

Optionally, you can specify a stack name, like: `alpha`, `beta`, `gamma`, etc. to skip the prompts.

```bash
app-app --delta hello-react
```

#### `--alpha`, `-a`

- BrowserSync via `npm start`
- Deployment via `npm run deploy` to [Surge.sh](https://surge.sh)
- Linting in Atom with `stylelint` and `htmlhint`

#### `--beta`, `-b`

- Everything in the `alpha` stack
- JavaScript (ES2015)
- Linting in Atom with `eslint` using JS Standard

#### `--gamma`, `-g`

- Everything in the `beta` stack
- webpack based build (`npm run build`) with babel (still using BrowerSync)

#### `--delta`, `-d`

- Everything in the `gamma` stack
- React
- Configure webpack with CSS modules and hot module reloading

#### `--epsilon`, `-e`

- Everything in the `delta` stack
- MobX & React Router

#### `--zeta`, `-z`

- Everything in the `delta` stack
- Redux & React Router

### TODO

- [x] Alpha stack
- [x] Beta stack
- [x] Gamma stack
- [x] Delta stack
- [ ] Epsilon stack
- [ ] Zeta stack
- [ ] Vendor entry point and chunking
- [ ] CLI lint and warnings before deploy

## License

MIT &copy; [Jason L Perry](https://github.com/ambethia)
