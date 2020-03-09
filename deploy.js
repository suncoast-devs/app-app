const path = require('path')
const localPackageJSONPath = path.join(process.cwd(), 'package.json')
const inquirer = require('inquirer')
const commandExistsSync = require('command-exists').sync
const yaml = require('yaml')
const fs = require('fs')
const packageJson = require(localPackageJSONPath)
const spawn = require('cross-spawn')
const _ = require('lodash')
const chalk = require('chalk')
const axios = require('axios')
const gitRemoteOriginUrl = require('git-remote-origin-url')
const os = require('os')

const deploy = async () => {
  const props = {
    haveNetlify: commandExistsSync('netlify'),
    haveGitHubPages: commandExistsSync('gh-pages'),
    haveSurge: commandExistsSync('surge'),
    appName: packageJson.name.toLowerCase(),
    userName: (process.env.USER || process.env.UserName)
      .replace(/[^a-zA-Z0-9+]/g, '-')
      .toLowerCase()
  }

  // If we have the hub tool
  if (commandExistsSync('hub')) {
    const data = yaml.parse(
      fs.readFileSync(os.homedir() + '/.config/hub', 'utf8')
    )

    // Get the github account for the user
    props.githubAccount = data['github.com']
      .map(entry => entry.user)
      .filter(Boolean)[0]

    // Get the oauth token that hub uses
    props.githubAuth = data['github.com']
      .map(entry => entry.oauth_token)
      .filter(Boolean)[0]
  }

  const deployToolChoices = [
    props.haveNetlify && { name: 'Netlify', value: 'netlify' },
    props.haveGitHubPages &&
      props.githubAccount && { name: 'GitHub Pages', value: 'gh-pages' },
    props.haveSurge && { name: 'Surge', value: 'surge' },
    { name: 'None', value: 'none' }
  ].filter(Boolean)

  const prompts = [
    {
      type: 'list',
      name: 'deployTool',
      message: 'Which deployment tool?',
      default: 'netlify',
      choices: deployToolChoices
    }
  ]

  // Define spawnCommandSync so we can use
  // it below to run external commands
  const spawnCommandSync = (command, args, opt) => {
    opt = opt || {}
    return spawn.sync(command, args, _.defaults(opt, { stdio: 'inherit' }))
  }

  const answers = await inquirer.prompt(prompts)

  // Get the deployment URL based on the deploy tool
  switch (answers.deployTool) {
    case 'surge':
      packageJson.homepage = `https://${props.appName}-${props.userName}.surge.sh`
      break
    case 'gh-pages':
      packageJson.homepage = `https://${props.githubAccount.toLowerCase()}.github.io/${
        props.appName
      }`
      break
    case 'netlify':
      packageJson.homepage = `https://${props.appName}-${props.userName}.netlify.com`
      break
  }

  const homepageAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'homepage',
      message: 'Deploy URL:',
      default: packageJson.homepage
    }
  ])

  packageJson.homepage = homepageAnswers.homepage

  // If we don't have a scripts section, create one
  if (!packageJson.scripts) {
    packageJson.scripts = {}
  }

  // Configure a postdeploy to show where we deployed this site
  if (packageJson.homepage) {
    packageJson.scripts.postdeploy = `echo 'Your site was deployed to ${packageJson.homepage}'`
  }

  // Set a default deploy command
  packageJson.scripts.deploy = `echo 'You have no deployment tool configured'`

  // If we have a build script, the deployment directory is 'build'
  // otherwise we will just publish the public directory
  const deployDir = packageJson.scripts.build ? 'build' : 'public'

  // Configure a deployment script based on the deployment tool
  switch (answers.deployTool) {
    case 'gh-pages':
      packageJson.scripts.deploy = `gh-pages -d ${deployDir}`
      break
    case 'netlify':
      // Use the netlify command to create a new site
      const createResult = spawnCommandSync('netlify', [
        'sites:create',
        '--name',
        `${props.appName}-${props.userName}`
      ])

      // If this failed, warn the user and exit
      if (createResult.status !== 0) {
        console.log(
          chalk.red(
            'Could not configure netlify, please see output for instructions'
          )
        )
        return
      }

      // Use the netlify command to link the site
      const linkResult = spawnCommandSync('netlify', [
        'link',
        '--name',
        `${props.appName}-${props.userName}`
      ])

      // If this failed, warn the user and exit
      if (linkResult.status !== 0) {
        console.log(
          chalk.red(
            'Could not configure netlify, please see output for instructions'
          )
        )
        return
      }

      // Set the deployment command
      packageJson.scripts.deploy = `netlify deploy --prod --dir=${deployDir}`
      break
    case 'surge':
      packageJson.scripts.deploy = `surge ${deployDir} ${packageJson.homepage}`
      break
  }

  // If we have a github auth token we can set the hostname
  if (props.githubAuth) {
    try {
      // Get the remote URL so we can determine the remote repo name
      const origin = await gitRemoteOriginUrl()
      const repo = origin.replace(/.*github.com\//, '').replace(/.git/, '')

      // Use the github API to change the homepage for this repo
      axios
        .patch(
          `https://api.github.com/repos/${repo}`,
          { homepage: packageJson.homepage },
          { headers: { Authorization: `token ${props.githubAuth}` } }
        )
        .then(() => {
          console.log(chalk.green('Configured homepage for github project'))
        })
        .catch(error => {
          console.log(chalk.red(`Received ${error} error from github`))
        })
    } catch (error) {
      console.log(
        chalk.red(
          `No github homepage configured, you'll have to do this manually later`
        )
      )
    }
  }

  // Write out a new package.json file
  fs.writeFile(
    localPackageJSONPath,
    JSON.stringify(packageJson, null, 2),
    error => {
      if (error) {
        console.log(chalk.red(error))
      } else {
        console.log(chalk.green(`Now configured to use ${answers.deployTool}.`))
      }
    }
  )
}

deploy()
