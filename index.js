#!/usr/bin/env node
'use strict'

const meow = require('meow')
const _ = require('lodash')

const yeoman = require('yeoman-environment')
const env = yeoman.createEnv()
env.register(require.resolve('./generators/app'), 'app')

const STACKS = require('./generators/app/stacks')
const IDE = require('./generators/app/ide')

const cli = meow(`
Usage
  $ yarn create app-app <stack> <ide>

Stacks
  ${_.map(STACKS, (v, k) => [_.padEnd(`-${k[0]}, --${k}`, 14), v].join('  ')).join('\n  ')}

Ide
  --vscode        Add some basic tasks in Visual Studio Code

Examples
  $ yarn create app-app --alpha hello-world
`, {
  alias: _.keys(STACKS).reduce((o, s) => { o[s[0]] = s; return o }, {}),
  boolean: _.keys(STACKS)
})

const stack = _.findKey(_.pick(cli.flags, _.keys(STACKS)))
const ide = _.findKey(_.pick(cli.flags, _.keys(IDE)))

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
        env.run('app', { stack, ide })
      } else {
        console.log(`
    Update available: ${update.current} → ${update.latest}
    Run 'yarn global upgrade create-app-app' to update.`)
      }
    }
  }
}).notify()
