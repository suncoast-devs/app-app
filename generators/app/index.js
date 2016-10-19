'use strict'

const yeoman = require('yeoman-generator')
const emptyDir = require('empty-dir')
const chalk = require('chalk')

class AppApp extends yeoman.Base {

  constructor (args, options) {
    super(args, options)
    this.argument('stack', { type: String, required: false })
  }

  prompting () {
    this.props = {
      stylelint: true,
      htmlhint: true,
      eslint: true,
      react: true,
      webpack: true
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
      default: this.appname,
      when: (props) => !props.empty
    }]

    if (this.stack) {
      this.log(chalk.yellow.bold(`Using ${this.stack.toUpperCase()} stack.`))
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
        this.props.styleExt = 'sass'
        break
      case 'delta':
        this.props.styleExt = 'sass'
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
      }
    })
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
        const pkg = {
          private: true,
          scripts: {
            deploy: 'surge ./public'
          }
        }

        if (this.props.webpack) {
          pkg.scripts.build = 'rm -rf public && NODE_ENV=production webpack --optimize-minimize --progress --profile --colors'
          pkg.scripts.start = 'webpack-dev-server -d --history-api-fallback --open --hot --inline --port 3000'
        } else {
          pkg.scripts.start = `browser-sync start --server 'public' --files 'public'`
        }

        this.fs.writeJSON('package.json', pkg)
      },

      babelRC () {
        if (this.props.babel) {
          const config = {
            presets: ['es2015', 'stage-0']
          }

          if (this.props.react) {
            config.presets.push('react')
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

      gitIgnore () {
        this.fs.copy(
          this.templatePath('gitignore'),
          this.destinationPath('.gitignore')
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
          this.fs.copy(
            this.templatePath('react/index.js'),
            this.destinationPath('src/index.js')
          )

          this.fs.copyTpl(
            this.templatePath('react/App.js'),
            this.destinationPath('src/components/App.js'),
            this.props
          )
        } else if (this.props.eslint) {
          this.fs.copy(
            this.templatePath('index.js'),
            this.destinationPath(this.props.webpack ? 'src/index.js' : 'public/main.js')
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
      }
    }
  }

  install () {
    const devDependencies = [
      'browser-sync'
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
        'webpack',
        'webpack-dev-server',
        'webpack-merge',
        'webpack-validator',
        'html-webpack-plugin',
        'file-loader',
        'css-loader',
        'style-loader',
        'postcss-loader',
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
        'eslint-config-standard-react'
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
    this.npmInstall(devDependencies, { 'saveDev': true })
    this.npmInstall(dependencies, { 'save': true })
  }
}

module.exports = AppApp
