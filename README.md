# App App!

## Usage

```bash
yarn create app-app APP_NAME [<flags>]
```

To generate your new project:

```bash
yarn create app-app cool-project-name
cd cool-project-name

atom .
yarn start
```

For the `alpha` stack, you might want to install `tidy-html5`, and the [Tidy Linter](https://atom.io/packages/linter-tidy) for Atom:

```bash
brew install tidy-html5
```

#### ALPHA

* BrowserSync via `yarn start`
* Deployment via `yarn deploy` to [Surge.sh](https://surge.sh)
* Linting in Atom with `stylelint` and `htmlhint`

#### BETA

* Everything in the `alpha` stack
* JavaScript (ES2015)
* Linting in Atom with `eslint` using JS Standard

#### GAMMA

* Everything in the `beta` stack
* webpack based build (`yarn build`) with babel (still using BrowerSync)

#### DELTA

* Everything in the `gamma` stack
* React
* Configure webpack and hot module reloading

### TODO

* [x] Alpha stack
* [x] Beta stack
* [x] Gamma stack
* [x] Delta stack
* [x] Vendor entry point and chunking
* [ ] CLI lint and warnings before deploy

## License

MIT &copy; [Jason L Perry](https://github.com/ambethia)
