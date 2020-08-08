#!/usr/bin/env node
'use strict'

const _ = require('lodash')
const chalk = require('chalk')
const commander = require('commander')
const camelCase = require('camelcase')
const decamelize = require('decamelize')

const yeoman = require('yeoman-environment')
const env = yeoman.createEnv()
env.register(require.resolve('./generators/app'), 'app')

const STACKS = require('./generators/app/stacks')

const packageJson = require('./package.json')

let projectName

let command = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('project-directory')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((_,projectDirectory) => {
    projectName = projectDirectory && projectDirectory[0]
  })
  .option('--deploy', 'Configure Deployment')
  .on('--help', () => {
    console.log(`    Only ${chalk.green('<project-directory>')} is required.`)
  })

// Generate a list of stacks dynamically from the STACKS JSON
Object.entries(STACKS).forEach(stack => {
  const [stackName, stackDetails] = stack

  command = command.option(
    `--${stackName}`,
    stackDetails.title
  )
})

const program = command.parse(process.argv)

if (program.deploy) {
  require('./deploy')
  return
}

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

const stackOption = _.findKey(_.pick(program, _.keys(STACKS).map(stack => camelCase(stack))))
const stack = stackOption ? decamelize(stackOption, '-') : undefined

const updateNotifier = require('update-notifier')
const pkg = require('./package.json')

updateNotifier({ pkg }).notify()

env.run('app', { stack, name: projectName })
