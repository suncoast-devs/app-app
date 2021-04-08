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
      useYarn: false,
    }

    if (commandExistsSync('hub')) {
      try {
        const hubApiResponseString = require('child_process')
          .spawnSync('hub', ['api', 'user'])
          .stdout.toString()
          .replace(/\n/, '')

        this.props.uniqueUserName = JSON.parse(
          hubApiResponseString || '{}'
        ).login
      } catch {
        // Nothing to do, this.props.uniqueUserName will remain empty
      }
    }

    if (!this.props.uniqueUserName || this.props.uniqueUserName.length === 0) {
      this.props.uniqueUserName = _.kebabCase(this.processUserName)
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
        when: (props) => !props.empty,
      },
      {
        type: 'confirm',
        name: 'repo',
        message: 'Create GitHub repository?',
        default: !getRepoInfo().sha,
        when: (props) => !props.empty,
      },
    ]

    if (this.options.stack) {
      if (STACKS.hasOwnProperty(this.options.stack)) {
        this.log(
          `Using ${chalk.yellow.bold(
            STACKS[this.options.stack].title.replace(/ +/, ' ').toUpperCase()
          )}`
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
        choices: Object.entries(STACKS).map(([name, details]) => ({
          name: details.title,
          value: name,
        })),
      }).then((props) => {
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

    const results = this.prompt(prompts).then((props) => {
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

  get packageManagerRun() {
    return this.props.useYarn ? 'yarn' : 'npm run'
  }

  get writing() {
    return {
      all() {
        const processInstallFiles = (files) => {
          Object.entries(files).forEach((entry) => {
            const [source, dest] = entry

            const data = fs.readFileSync(this.templatePath(source))
            const stat = fs.lstatSync(this.templatePath(source))

            isBinaryFile(data, stat.size).then((isBinary) => {
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

    if (dependencies.length > 0) {
      this.log(
        `Installing runtime dependencies... ${chalk.cyan(
          dependencies.join(', ')
        )}`
      )
      dependencies.forEach((dependency) => {
        installMethod(dependency)
      })
    }

    this.log(
      `Installing development dependencies... ${chalk.cyan(
        devDependencies.join(', ')
      )}`
    )
    devDependencies.forEach((dependency) => {
      installMethod(dependency, devInstallOptions)
    })
  }

  end() {
    const projectPath = path.basename(this.destinationRoot())

    if (this.props.repo) {
      this.spawnCommandSync('git', ['init'])
      this.spawnCommandSync('git', ['add', '--all'])
      this.spawnCommandSync('git', ['commit', '--message', '"Hello, App App!"'])

      if (commandExistsSync('sdg')) {
        this.spawnCommandSync('sdg', ['hubCreate', this.appname])
        this.spawnCommandSync('git', ['push'])
      } else {
        console.log()
        console.log()
        console.log(
          'WARNING: The `sdg` helper tool was not found so no github repository created'
        )
        console.log()
        console.log(
          `To fix this, install the sdg helper tool, then \`cd ${projectPath}\`, then \`sdg create\``
        )
        console.log()
        console.log()
      }
    }

    console.log()
    console.log(`Success! Created "${_.startCase(this.appname)}"`)
    console.log()
    console.log()
    console.log('We suggest that you begin by typing:')
    console.log()
    console.log(`  cd ${projectPath}`)
    console.log('  code .')
    console.log(`  ${this.props.useYarn ? 'yarn' : 'npm'} start`)
    console.log()
    console.log()
  }
}

module.exports = AppApp
