'use strict'

const Generator = require('yeoman-generator')
const emptyDir = require('empty-dir')
const chalk = require('chalk')
const _ = require('lodash')
const STACKS = require('./stacks')
const getRepoInfo = require('git-repo-info')

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
      eslint: true,
      vsCode: true
    }

    let prompts = [
      {
        type: 'confirm',
        name: 'empty',
        message: `This directory (${chalk.blue(this.destinationRoot())}) is ${chalk.red.bold(
          'not'
        )} empty. Should we bail?`,
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
        default: !getRepoInfo().sha,
        when: props => !props.empty
      }
    ]

    if (this.options.stack) {
      if (STACKS.hasOwnProperty(this.options.stack)) {
        this.log(`Using ${chalk.yellow.bold(this.options.stack.toUpperCase())}: ${STACKS[this.options.stack]}`)
      } else {
        this.log(
          chalk.red.bold(
            `Unknown stack (${this.options.stack}). Supported stacks are: ${Object.keys(STACKS).join(', ')}`
          )
        )
      }
    } else {
      await this.prompt({
        type: 'list',
        name: 'stack',
        message: 'Which stack?',
        default: 'alpha',
        choices: [
          ..._.map(STACKS, (name, value) => ({ name, value }))
          // { name: "None, I'll choose my own options.", value: null }
        ]
      }).then(props => {
        this.options.stack = props.stack
      })
    }

    switch (this.options.ide) {
      case 'noVSCode':
        this.props.vsCode = false
        break
      default:
        this.props.vsCode = true
        break
    }

    switch (this.options.stack) {
      case 'alpha':
        this.props.eslint = false
        break
      case 'beta':
        break
      default:
        break
    }

    return this.prompt(prompts).then(props => {
      if (props.empty) {
        this.log(`Whew... ${chalk.green('that was a close one.')} Bye!`)
        process.exit(0)
      } else {
        Object.assign(this.props, props)
        this.props.website = `http://${this.domainName}`
      }
    })
  }

  get username () {
    return (process.env.USER || process.env.UserName).replace(/[^a-zA-Z0-9+]/g, '-')
  }

  get domainName () {
    return `${this.username}.github.io/${_.kebabCase(this.appname)}/`.toLowerCase()
  }

  get writing () {
    return {
      packageJSON () {
        const deployCmd = `gh-pages -d public && echo 'Your site was deployed to ${this.domainName}'`
        const pkg = {
          private: true,
          scripts: {
            deploy: deployCmd
          }
        }

        pkg.scripts.start = `browser-sync start --server "public" --files "public"`

        this.fs.writeJSON('package.json', pkg)
      },

      esLintRC () {
        if (this.props.eslint) {
          const config = {
            extends: ['standard'],
            rules: {}
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
        this.fs.copyTpl(this.templatePath('gitignore'), this.destinationPath('.gitignore'), this.props)
      },

      styles () {
        this.fs.copy(this.templatePath('screen.css'), this.destinationPath('public/screen.css'))
      },

      scripts () {
        if (this.props.eslint) {
          this.fs.copyTpl(this.templatePath('index.js'), this.destinationPath('public/main.js'), this.props)
        }
      },

      html () {
        this.fs.copyTpl(this.templatePath('index.html'), this.destinationPath('public/index.html'), this.props)
      },

      favIcon () {
        this.fs.copy(this.templatePath('favicon.ico'), this.destinationPath('public/favicon.ico'))
      },

      readme () {
        this.fs.copyTpl(this.templatePath('README.md'), this.destinationPath('README.md'), this.props)
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
    const devDependencies = ['browser-sync', 'stylelint', 'stylelint-config-standard', 'gh-pages']

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

    const dependencies = []

    this.log('Installing dependencies...')

    this.npmInstall(devDependencies, { dev: true })
    this.npmInstall(dependencies)
  }

  end () {
    if (this.props.repo) {
      this.spawnCommandSync('git', ['init'])
      this.spawnCommandSync('git', ['add', '--all'])
      this.spawnCommandSync('git', ['commit', '--message', '"Hello, App App!"'])
      this.spawnCommandSync('hub', ['create', '-h', this.props.website, _.kebabCase(this.appname)])
      this.spawnCommandSync('git', ['push', '--set-upstream', 'origin', 'master'])
    }

    console.log()
    console.log(`Success! Created "${_.startCase(this.appname)}"`)
    console.log()
    console.log()
    console.log('We suggest that you begin by typing:')
    console.log()
    console.log(chalk.cyan('  cd'), path.basename(this.destinationRoot()))
    console.log(`  ${chalk.cyan(`npm start`)}`)
    console.log()
    console.log()
  }
}

module.exports = AppApp
