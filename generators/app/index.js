'use strict'

var yeoman = require('yeoman-generator')
var chalk = require('chalk')
var yosay = require('yosay')

class AppApp extends yeoman.Base {

  prompting () {
    this.log(
      yosay(`The amazing ${chalk.red('App App')}!`)
    )

    var prompts = [{
      type: 'input',
      name: 'name',
      message: 'What\'s your project\'s name?',
      default: this.appname
    }, {
      type: 'list',
      name: 'sassFlavor',
      message: 'Which flavor of sass do you prefer?',
      choices: ['sass', 'scss']
    }]

    return this.prompt(prompts).then((props) => {
      this.props = props
    })
  }

  get writing () {
    return {
      webpack () {
        this.fs.copy(
          this.templatePath('webpack.config.js'),
          this.destinationPath('webpack.config.js')
        )
      },

      packageJSON () {
        this.fs.copy(
          this.templatePath('package.json'),
          this.destinationPath('package.json')
        )
      },

      dotfiles () {
        this.fs.copy(
          this.templatePath('dot/.*'),
          this.destinationRoot()
        )
      },

      styles () {
        this.fs.copy(
          this.templatePath(`*.${this.props.sassFlavor}`),
          this.destinationPath('src/styles')
        )
      },

      scripts () {
        this.fs.copy(
          this.templatePath('index.js'),
          this.destinationPath('src/index.js')
        )

        this.fs.copyTpl(
          this.templatePath('App.js'),
          this.destinationPath('src/components/App.js'), {
            sassFlavor: this.props.sassFlavor
          }
        )
      },

      html () {
        this.fs.copyTpl(
          this.templatePath('index.tpl.html'),
          this.destinationPath('src/index.html'), {
            title: this.props.name
          }
        )
      },

      readme () {
        this.fs.copyTpl(
          this.templatePath('README.md'),
          this.destinationPath(), {
            title: this.props.name
          }
        )
      }
    }
  }

  install () {
    const devDependencies = [
      'babel-core',
      'babel-eslint',
      'babel-loader',
      'babel-preset-es2015',
      'babel-preset-react',
      'babel-preset-stage-0',
      'css-loader',
      'eslint',
      'eslint-config-standard',
      'eslint-config-standard-react',
      'eslint-plugin-promise',
      'eslint-plugin-react',
      'eslint-plugin-standard',
      'file-loader',
      'html-webpack-plugin',
      'node-sass',
      'sass-loader',
      'style-loader',
      'webpack',
      'webpack-dashboard',
      'webpack-dev-server'
    ]

    const dependencies = [
      'react',
      'react-dom'
    ]

    this.log('Installing dependencies...')
    this.npmInstall(devDependencies, { 'saveDev': true })
    this.npmInstall(dependencies, { 'save': true })
  }
}

module.exports = AppApp
