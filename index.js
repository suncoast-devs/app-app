#!/usr/bin/env node
'use strict'

const _ = require('lodash')
const fs = require('fs-extra')
const chalk = require('chalk')
const commander = require('commander')

const yeoman = require('yeoman-environment')
const env = yeoman.createEnv()
env.register(require.resolve('./generators/app'), 'app')

const STACKS = require('./generators/app/stacks')
const IDE = require('./generators/app/ide')

const packageJson = require('./package.json')

let projectName

// TODO: Is there a way to provide option list programmatically from STACKS?
const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .option('-a, --alpha', STACKS.alpha)
  .option('-b, --beta', STACKS.beta)
  .option('-g, --gamma', STACKS.gamma)
  .option('-c, --delta', STACKS.delta)
  .option('--vscode', IDE.vscode)
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action(name => {
    projectName = name
  })
  .on('--help', () => {
    console.log(`    Only ${chalk.green('<project-directory>')} is required.`)
  })
  .parse(process.argv)

if (typeof projectName === 'undefined') {
  console.error('Please specify the project directory:')
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
  )
  console.log()
  console.log('For example:')
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-cool-app')}`)
  console.log()
  console.log(
    `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
  )
  process.exit(1)
}

const stack = _.findKey(_.pick(program, _.keys(STACKS)))
const ide = _.findKey(_.pick(program, _.keys(IDE)))

const updateNotifier = require('update-notifier')
const pkg = require('./package.json')

updateNotifier({
  pkg,
  updateCheckInterval: 1, // Hourly
  callback: (err, update) => {
    if (err) {
      console.error(err)
    } else {
      if (update.current === update.latest) {
        fs.ensureDirSync(projectName)
        env.run('app', { stack, ide, name: projectName })
      } else {
        console.log(`
    Update available: ${update.current} → ${update.latest}
    Run 'yarn global upgrade create-app-app' to update.`)
      }
    }
  }
}).notify()
