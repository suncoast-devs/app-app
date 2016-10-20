# App App!

## Installation

First, install [Yeoman](http://yeoman.io) and `generator-app-app` using [npm](https://www.npmjs.com/).

```bash
npm install -g yo generator-app-app
```

Optionally, install `tidy-html5`, and the [Tidy Linter](https://atom.io/packages/linter-tidy) for Atom:

```bash
brew install tidy-html5
```

Then generate your new project:

```bash
take cool-project-name
yo app-app

npm start
```

## Pre-defined stacks

**This is a work in progress, not all stacks functional.**

Optionally, you can specify a stack name, like: `alpha`, `beta`, `gamma`, etc. to skip the prompts.

```bash
yo app-app delta
```

### `alpha`

- BrowserSync via `npm start`
- Deployment via `npm run deploy` to [Surge.sh](https://surge.sh)
- Linting in Atom with `stylelint` and `htmlhint`

### `beta`

- Everything in the `alpha` stack
- JavaScript (ES2015)
- Linting in Atom with `eslint` using JS Standard

### `gamma`

- Everything in the `beta` stack
- webpack based build (`npm run build`) with babel (still using BrowerSync)

### `delta`

- Everything in the `gamma` stack
- React
- Configure webpack with CSS modules and hot module reloading

### `epsilon`

- Everything in the `delta` stack
- MobX & React Router

### `zeta`

- Everything in the `delta` stack
- Redux & React Router

## License

MIT &copy; [Jason L Perry](https://github.com/ambethia)
