'use strict'

const yeoman = require('yeoman-generator')
const emptyDir = require('empty-dir')
const chalk = require('chalk')
const _ = require('lodash')
const STACKS = require('./stacks')

class AppApp extends yeoman.Base {

  constructor (args, options) {
    super(args, options)
    this.argument('stack', { type: String, required: false })
    this.argument('ide', { type: String, required: false })
  }

  prompting () {
    this.props = {
      stylelint: true,
      styleExt: 'css',
      eslint: true,
      react: true,
      webpack: true,
      vsCode: false
    }

    let prompts = [{
      type: 'confirm',
      name: 'empty',
      message: `This directory (${chalk.blue(this.destinationRoot())}) is ${chalk.red.bold('not')} empty. Should we bail?`,
      default: true,
      when: () => !emptyDir.sync(this.destinationRoot())
    }, {
      type: 'input',
      name: 'title',
      message: `What's your project's title?`,
      default: _.startCase(this.appname),
      when: (props) => !props.empty
    }, {
      type: 'confirm',
      name: 'repo',
      message: 'Create GitHub repository?',
      default: true,
      when: (props) => !props.empty
    }, {
      type: 'confirm',
      name: 'yarn',
      message: 'Use Yarn for dependencies?',
      default: true,
      when: (props) => !props.empty
    }]

    if (this.stack) {
      if (STACKS.hasOwnProperty(this.stack)) {
        this.log(`Using ${chalk.yellow.bold(this.stack.toUpperCase())}: ${STACKS[this.stack]}`)
      } else {
        this.log(chalk.red.bold(`Unknown stack (${this.stack}). Supported stacks are: ${Object.keys(STACKS).join(', ')}`))
      }
    }

    switch (this.ide) {
      case 'vscode':
        this.props.vsCode = true
        break
      default:
        this.props.vsCode = false
        break
    }

    switch (this.stack) {
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
        prompts.push({
          type: 'confirm',
          name: 'webpack',
          message: 'Use webpack workflow?',
          default: true,
          when: (props) => !props.empty
        }, {
          type: 'list',
          name: 'styleExt',
          message: 'Which flavor of CSS do you prefer?',
          default: 'sass',
          choices: [
            { name: 'SASS', value: 'sass' },
            { name: 'SCSS', value: 'scss' },
            { name: 'None, just plain CSS, thanks.', value: 'css' }
          ],
          when: (props) => !props.empty && props.webpack
        }, {
          type: 'confirm',
          name: 'react',
          message: 'Use React?',
          default: true,
          when: (props) => !props.empty && props.webpack
        })
        break
    }

    return this.prompt(prompts).then((props) => {
      if (props.empty) {
        this.log(`Whew... ${chalk.green('that was a close one.')} Bye!`)
        process.exit(0)
      } else {
        Object.assign(this.props, props)
        this.props.babel = this.props.webpack
        this.props.sass = ['scss', 'sass'].includes(this.props.styleExt)
        this.props.website = `http://${this.domainName()}`
      }
    })
  }

  get username () {
    (process.env.USER || process.env.UserName).replace(/[^a-zA-Z0-9+]/g, '-')
  }

  get domainName () {
    return `${_.kebabCase(this.appname)}.${this.username}.surge.sh`.toLowerCase
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
            deploy: this.props.webpack ? `npm run build && ${deployCmd}` : deployCmd
          }
        }

        if (this.props.webpack) {
          pkg.scripts.start = 'webpack-dev-server'
          pkg.scripts.build = 'rm -rf public && NODE_ENV=production webpack --optimize-minimize --progress --profile --colors'
        } else {
          pkg.scripts.start = `browser-sync start --server \"public\" --files \"public\"`
        }

        this.fs.writeJSON('package.json', pkg)
      },

      babelRC () {
        if (this.props.babel) {
          const config = {
            presets: ['es2015', 'stage-0'],
            plugins: []
          }

          if (this.props.react) {
            config.presets.push('react')
            config.plugins.push('react-hot-loader/babel')
          }

          this.fs.writeJSON(this.destinationPath('.babelrc'), config)
        }
      },

      esLintRC () {
        if (this.props.eslint) {
          const config = {
            extends: ['standard'],
            rules: {
              strict: 0
            }
          }

          if (this.props.babel) {
            config.parser = 'babel-eslint'
          }

          if (this.props.react) {
            config.extends.push('standard-react')
          }

          this.fs.writeJSON(this.destinationPath('.eslintrc'), config)
        }
      },

      styleLintRC () {
        if (this.props.stylelint) {
          const config = {
            extends: 'stylelint-config-standard'
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
          this.fs.copy(
            this.templatePath(`*.${this.props.styleExt}`),
            this.destinationPath('src/styles')
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
            this.destinationPath(this.props.webpack ? 'src/index.js' : 'public/main.js'),
            this.props
          )
        }
      },

      html () {
        this.fs.copyTpl(
          this.templatePath(this.props.webpack ? 'index.webpack.html' : 'index.simple.html'),
          this.destinationPath(this.props.webpack ? 'src/index.html' : 'public/index.html'),
          this.props
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
        'eslint-plugin-standard'
      )
    }

    if (this.props.babel) {
      devDependencies.push(
        'babel-core',
        'babel-eslint',
        'babel-loader',
        'babel-preset-es2015',
        'babel-preset-stage-0'
      )
    }

    if (this.props.webpack) {
      devDependencies.push(
        'webpack@^1',
        'webpack-dev-server@^1',
        'webpack-merge',
        'webpack-validator',
        'browser-sync-webpack-plugin',
        'html-webpack-plugin',
        'file-loader',
        'css-loader',
        'style-loader',
        'postcss-loader',
        'raw-loader',
        'autoprefixer'
      )

      if (this.props.sass) {
        devDependencies.push(
          'node-sass',
          'sass-loader'
        )
      }
    }

    if (this.props.react) {
      devDependencies.push(
        'babel-preset-react',
        'eslint-plugin-react',
        'eslint-config-standard-react',
        'react-hot-loader@next'
      )
    }

    const dependencies = []

    if (this.props.webpack) {
      dependencies.push(
        'whatwg-fetch'
      )
    }

    if (this.props.react) {
      dependencies.push(
        'react',
        'react-dom'
      )
    }

    this.log('Installing dependencies...')

    if (this.props.yarn) {
      // TODO: Refactor when yarn suppport for Yeoman drops
      if (dependencies.length > 0) this.spawnCommandSync('yarn', ['add', ...dependencies])
      if (devDependencies.length > 0) this.spawnCommandSync('yarn', ['add', ...devDependencies, '--dev'])
    } else {
      this.npmInstall(devDependencies, { 'saveDev': true })
      this.npmInstall(dependencies, { 'save': true })
    }
  }

  end () {
    if (this.props.repo) {
      this.spawnCommandSync('git', ['init'])
      this.spawnCommandSync('git', ['add', '--all'])
      this.spawnCommandSync('git', ['commit', '--message', '"Hello, App App!"'])
      this.spawnCommandSync('hub', ['create', '-h', this.props.website, _.kebabCase(this.appname)])
      this.spawnCommandSync('git', ['push', '--set-upstream', 'origin', 'master'])
    }
  }
}

module.exports = AppApp
