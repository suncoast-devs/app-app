'use strict'

const Generator = require('yeoman-generator')
const emptyDir = require('empty-dir')
const chalk = require('chalk')
const _ = require('lodash')
const STACKS = require('./stacks')

class AppApp extends Generator {
  constructor (args, options) {
    super(args, options)
    this.argument('stack', { type: String, required: false })
    this.argument('ide', { type: String, required: false })
    this.destinationRoot(this.options.name)
    this.appname = this.determineAppname()
  }

  async prompting () {
    this.props = {
      stylelint: true,
      styleExt: 'css',
      eslint: true,
      react: true,
      webpack: true,
      vsCode: false
    }

    let prompts = [
      {
        type: 'confirm',
        name: 'empty',
        message: `This directory (${chalk.blue(
          this.destinationRoot()
        )}) is ${chalk.red.bold('not')} empty. Should we bail?`,
        default: true,
        when: () => !emptyDir.sync(this.destinationRoot())
      },
      {
        type: 'input',
        name: 'title',
        message: `What's your project's title?`,
        default: _.startCase(this.appname),
        when: props => !props.empty
      },
      {
        type: 'confirm',
        name: 'repo',
        message: 'Create GitHub repository?',
        default: true,
        when: props => !props.empty
      }
    ]

    if (this.options.stack) {
      if (STACKS.hasOwnProperty(this.options.stack)) {
        this.log(
          `Using ${chalk.yellow.bold(this.options.stack.toUpperCase())}: ${
            STACKS[this.options.stack]
          }`
        )
      } else {
        this.log(
          chalk.red.bold(
            `Unknown stack (${
              this.options.stack
            }). Supported stacks are: ${Object.keys(STACKS).join(', ')}`
          )
        )
      }
    } else {
      await this.prompt({
        type: 'list',
        name: 'stack',
        message: 'Which stack?',
        default: 'delta',
        choices: [
          ..._.map(STACKS, (name, value) => ({ name, value })),
          { name: "None, I'll choose my own options.", value: null }
        ]
      }).then(props => {
        this.options.stack = props.stack
      })
    }

    switch (this.options.ide) {
      case 'vscode':
        this.props.vsCode = true
        break
      default:
        this.props.vsCode = false
        break
    }

    switch (this.options.stack) {
      case 'alpha':
        this.props.eslint = false
        this.props.react = false
        this.props.webpack = false
        break
      case 'beta':
        this.props.react = false
        this.props.webpack = false
        break
      case 'gamma':
        this.props.react = false
        this.props.styleExt = 'scss'
        break
      case 'delta':
        this.props.styleExt = 'scss'
        break
      default:
        prompts.push(
          {
            type: 'confirm',
            name: 'webpack',
            message: 'Use webpack workflow?',
            default: true,
            when: props => !props.empty
          },
          {
            type: 'list',
            name: 'styleExt',
            message: 'Which flavor of CSS do you prefer?',
            default: 'sass',
            choices: [
              { name: 'SASS', value: 'sass' },
              { name: 'SCSS', value: 'scss' },
              { name: 'None, just plain CSS, thanks.', value: 'css' }
            ],
            when: props => !props.empty && props.webpack
          },
          {
            type: 'confirm',
            name: 'react',
            message: 'Use React?',
            default: true,
            when: props => !props.empty && props.webpack
          }
        )
        break
    }

    return this.prompt(prompts).then(props => {
      if (props.empty) {
        this.log(`Whew... ${chalk.green('that was a close one.')} Bye!`)
        process.exit(0)
      } else {
        Object.assign(this.props, props)
        this.props.babel = this.props.webpack
        this.props.sass = ['scss', 'sass'].includes(this.props.styleExt)
        this.props.website = `http://${this.domainName}`
      }
    })
  }

  get username () {
    return (process.env.USER || process.env.UserName).replace(
      /[^a-zA-Z0-9+]/g,
      '-'
    )
  }

  get domainName () {
    return `${_.kebabCase(this.appname)}.${
      this.username
    }.surge.sh`.toLowerCase()
  }

  get writing () {
    return {
      webpack () {
        if (this.props.webpack) {
          this.fs.copyTpl(
            this.templatePath('webpack.config.js'),
            this.destinationPath('webpack.config.js'),
            this.props
          )
        }
      },

      packageJSON () {
        const deployCmd = `surge ./public --domain ${this.domainName}`
        const pkg = {
          private: true,
          scripts: {
            deploy: deployCmd
          }
        }

        if (this.props.webpack) {
          pkg.scripts.start = 'webpack-dev-server'
          pkg.scripts.prebuild =
            'rm -f public/index.html public/app-*.js public/vendor-*.js public/screen-*.css'
          pkg.scripts.build = 'NODE_ENV=production webpack --progress'
          pkg.scripts.postbuild = 'cp public/index.html public/200.html'
          pkg.scripts.predeploy = 'yarn build'
        } else {
          pkg.scripts.start = `browser-sync start --server 'public' --files 'public'`
        }

        this.fs.writeJSON('package.json', pkg)
      },

      babelRC () {
        if (this.props.babel) {
          const config = {
            presets: [['es2015', { modules: false }], 'stage-0'],
            rules: [],
            plugins: []
          }

          if (this.props.react) {
            config.presets.push('react')
            config.plugins.push('react-hot-loader/babel')
            config.rules.push({ 'react/prop-types': 0 })
          }

          this.fs.writeJSON(this.destinationPath('.babelrc'), config)
        }
      },

      esLintRC () {
        if (this.props.eslint) {
          const config = {
            extends: ['standard'],
            rules: {}
          }

          if (this.props.babel) {
            config.parser = 'babel-eslint'
          }

          if (this.props.react) {
            config.extends.push('standard-react')
            config.rules['react/prop-types'] = 0
          }

          this.fs.writeJSON(this.destinationPath('.eslintrc'), config)
        }
      },

      styleLintRC () {
        if (this.props.stylelint) {
          const config = {
            extends: 'stylelint-config-standard',
            rules: {
              'declaration-empty-line-before': 'never'
            }
          }
          this.fs.writeJSON(this.destinationPath('.stylelintrc'), config)
        }
      },

      gitIgnore () {
        this.fs.copyTpl(
          this.templatePath('gitignore'),
          this.destinationPath('.gitignore'),
          this.props
        )
      },

      styles () {
        if (this.props.webpack) {
          this.fs.copyTpl(
            this.templatePath(`*.${this.props.styleExt}`),
            this.destinationPath('src/styles'),
            this.props
          )
        } else {
          this.fs.copy(
            this.templatePath('screen.css'),
            this.destinationPath('public/screen.css')
          )
        }
      },

      scripts () {
        if (this.props.react) {
          this.fs.copyTpl(
            this.templatePath('react/index.js'),
            this.destinationPath('src/index.js'),
            this.props
          )

          this.fs.copy(
            this.templatePath('react/App.js'),
            this.destinationPath('src/components/App.js')
          )
        } else if (this.props.eslint) {
          this.fs.copyTpl(
            this.templatePath('index.js'),
            this.destinationPath(
              this.props.webpack ? 'src/index.js' : 'public/main.js'
            ),
            this.props
          )
        }
      },

      html () {
        this.fs.copyTpl(
          this.templatePath(
            this.props.webpack ? 'index.webpack.html' : 'index.simple.html'
          ),
          this.destinationPath(
            this.props.webpack ? 'src/index.html' : 'public/index.html'
          ),
          this.props
        )
      },

      favIcon () {
        this.fs.copy(
          this.templatePath('favicon.ico'),
          this.destinationPath('public/favicon.ico')
        )
      },

      readme () {
        this.fs.copyTpl(
          this.templatePath('README.md'),
          this.destinationPath('README.md'),
          this.props
        )
      },

      vsCode () {
        if (this.props.vsCode) {
          this.fs.copyTpl(
            this.templatePath('vscode/tasks.json'),
            this.destinationPath('.vscode/tasks.json'),
            this.props
          )
        }
      }
    }
  }

  install () {
    const devDependencies = [
      'browser-sync',
      'stylelint',
      'stylelint-config-standard',
      'surge'
    ]

    if (this.props.eslint) {
      devDependencies.push(
        'eslint',
        'eslint-config-standard',
        'eslint-plugin-promise',
        'eslint-plugin-import',
        'eslint-plugin-node',
        'eslint-plugin-standard'
      )
    }

    if (this.props.babel) {
      devDependencies.push(
        'babel-core',
        'babel-eslint',
        'babel-loader',
        'babel-polyfill',
        'babel-preset-es2015',
        'babel-preset-stage-0'
      )
    }

    if (this.props.webpack) {
      devDependencies.push(
        'webpack',
        'webpack-dev-server',
        'webpack-merge',
        'browser-sync-webpack-plugin',
        'extract-text-webpack-plugin',
        'html-webpack-plugin',
        'file-loader',
        'css-loader',
        'style-loader',
        'postcss-loader',
        'raw-loader',
        'autoprefixer'
      )

      if (this.props.sass) {
        devDependencies.push('node-sass', 'sass-loader')
      }
    }

    if (this.props.react) {
      devDependencies.push(
        'babel-preset-react',
        'eslint-plugin-react',
        'eslint-config-standard-react'
      )
    }

    const dependencies = []

    if (this.props.webpack) {
      dependencies.push('whatwg-fetch')
    }

    if (this.props.react) {
      dependencies.push(
        'react',
        'react-dom',
        'redbox-react',
        'react-hot-loader@next'
      )
    }

    this.log('Installing dependencies...')

    this.yarnInstall(devDependencies, { dev: true })
    this.yarnInstall(dependencies)
  }

  end () {
    if (this.props.repo) {
      this.spawnCommandSync('git', ['init'])
      this.spawnCommandSync('git', ['add', '--all'])
      this.spawnCommandSync('git', ['commit', '--message', '"Hello, App App!"'])
      this.spawnCommandSync('hub', [
        'create',
        '-h',
        this.props.website,
        _.kebabCase(this.appname)
      ])
      this.spawnCommandSync('git', [
        'push',
        '--set-upstream',
        'origin',
        'master'
      ])
    }
  }
}

module.exports = AppApp
