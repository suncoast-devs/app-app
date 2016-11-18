#!/usr/bin/env node
'use strict'

const meow = require('meow')
const _ = require('lodash')

const updateNotifier = require('update-notifier')
const pkg = require('./package.json')
updateNotifier({pkg}).notify()

const yeoman = require('yeoman-environment')
const env = yeoman.createEnv()
env.register(require.resolve('./generators/app'), 'app')

const STACKS = require('./generators/app/stacks')

const cli = meow(`
Usage
  $ app-app <stack>

Stacks
  ${_.map(STACKS, (v, k) => [_.padEnd(`-${k[0]}, --${k}`, 14), v].join('  ')).join('\n  ')}

Examples
  $ app-app --alpha hello-world
`, {
  alias: _.keys(STACKS).reduce((o, s) => { o[s[0]] = s; return o }, {}),
  boolean: _.keys(STACKS)
})

const stack = _.findKey(_.pick(cli.flags, _.keys(STACKS)))

const cmd = ['app', stack].join(' ')
env.run(cmd)
