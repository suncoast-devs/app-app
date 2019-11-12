'use strict'

const Generator = require('yeoman-generator')
const emptyDir = require('empty-dir')
const chalk = require('chalk')
const _ = require('lodash')
const STACKS = require('./stacks')
const getRepoInfo = require('git-repo-info')
const path = require('path')
const fs = require('fs')
const commandExistsSync = require('command-exists').sync
const isBinaryFile = require('isbinaryfile').isBinaryFile

class AppApp extends Generator {
  constructor(args, options) {
    super(args, options)

    this.props = {
      useYarn: commandExistsSync('yarn'),
    }

    if (commandExistsSync('hub')) {
      this.props.uniqueUserName = require('child_process')
        .spawnSync('hub', ['config', '--get', 'github.user'])
        .stdout.toString()
        .replace(/\n/, '')
        .replace(/ /, '')
    }

    if (!this.props.uniqueUserName || this.props.uniqueUserName.length === 0) {
      this.props.uniqueUserName = this.processUserName
    }

    this.argument('stack', { type: String, required: false })
    this.destinationRoot(_.kebabCase(this.options.name))
    this.appname = this.determineAppname()
  }

  async prompting() {
    let prompts = [
      {
        type: 'confirm',
        name: 'empty',
        message: `This directory (${chalk.blue(
          this.destinationRoot()
        )}) is ${chalk.red.bold('not')} empty. Should we bail?`,
        default: true,
        when: () => !emptyDir.sync(this.destinationRoot()),
      },
      {
        type: 'input',
        name: 'title',
        message: `What's your project's title?`,
        default: _.startCase(this.appname),
        when: props => !props.empty,
      },
      {
        type: 'confirm',
        name: 'repo',
        message: 'Create GitHub repository?',
        default: !getRepoInfo().sha,
        when: props => !props.empty,
      },
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
        default: 'alpha',
        choices: [..._.map(STACKS, (name, value) => ({ name, value }))],
      }).then(props => {
        this.options.stack = props.stack
      })
    }

    this.sourceRoot(this.templatePath(this.options.stack))

    this.stackCommonConfig = JSON.parse(
      fs.readFileSync(this.templatePath(`../../config/common.json`))
    )
    this.stackConfig = JSON.parse(
      fs.readFileSync(
        this.templatePath(`../../config/${this.options.stack}.json`)
      )
    )

    const results = this.prompt(prompts).then(props => {
      if (props.empty) {
        this.log(`Whew... ${chalk.green('that was a close one.')} Bye!`)
        process.exit(0)
      } else {
        Object.assign(this.props, props)
      }
    })

    this.appname = _.kebabCase(this.appname)
    return results
  }

  get processUserName() {
    return (process.env.USER || process.env.UserName).replace(
      /[^a-zA-Z0-9+]/g,
      '-'
    )
  }

  get username() {
    return this.props ? this.props.uniqueUserName : this.processUserName
  }

  get hostName() {
    return `${this.appname}-${this.username}`
  }

  get packageAppName() {
    return `${_.kebabCase(this.appname)}`
  }

  get writing() {
    return {
      all() {
        const processInstallFiles = files => {
          Object.entries(files).forEach(entry => {
            const [source, dest] = entry

            const data = fs.readFileSync(this.templatePath(source))
            const stat = fs.lstatSync(this.templatePath(source))

            isBinaryFile(data, stat.size).then(isBinary => {
              if (isBinary) {
                this.fs.copy(
                  this.templatePath(source),
                  this.destinationPath(dest)
                )
              } else {
                this.fs.copyTpl(
                  this.templatePath(source),
                  this.destinationPath(dest),
                  this
                )
              }
            })
          })
        }

        processInstallFiles(this.stackCommonConfig.installFiles)
        processInstallFiles(this.stackConfig.installFiles)
      },
    }
  }

  install() {
    const installMethod = this.props.useYarn
      ? this.yarnInstall.bind(this)
      : this.npmInstall.bind(this)
    const devInstallOptions = this.props.useYarn
      ? { dev: true }
      : { 'save-dev': true }

    const devDependencies = this.stackConfig.devDependencies || []
    const dependencies = this.stackConfig.dependencies || []

    this.log(
      `Installing development dependencies... ${chalk.cyan(
        devDependencies.join(', ')
      )}`
    )
    installMethod(devDependencies, devInstallOptions)

    if (dependencies.length > 0) {
      this.log(
        `Installing runtime dependencies... ${chalk.cyan(
          dependencies.join(', ')
        )}`
      )
      installMethod(dependencies)
    }
  }

  end() {
    if (this.props.repo) {
      this.spawnCommandSync('git', ['init'])
      this.spawnCommandSync('git', ['add', '--all'])
      this.spawnCommandSync('git', ['commit', '--message', '"Hello, App App!"'])
      this.spawnCommandSync('hub', ['create', '-h', '', this.appname])
      this.spawnCommandSync('git', [
        'push',
        '--set-upstream',
        'origin',
        'master',
      ])
    }

    console.log()
    console.log(`Success! Created "${_.startCase(this.appname)}"`)
    console.log()
    console.log()
    console.log('We suggest that you begin by typing:')
    console.log()
    console.log(chalk.cyan('  cd'), path.basename(this.destinationRoot()))
    console.log(chalk.cyan(' code .'))
    console.log(
      `  ${chalk.cyan(`${this.props.useYarn ? 'yarn' : 'npm'} start`)}`
    )
    console.log()
    console.log()
  }
}

module.exports = AppApp
