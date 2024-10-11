#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');
const ProgressBar = require('progress');

let projectName = process.argv[2];
const repoUrl = 'https://github.com/litpack/create';

(async () => {
  console.log(chalk.blue('🌟 Welcome to the project generator! Let’s get started...'));

  if (!projectName) {
    projectName = await promptForProjectName();
  }

  projectName = await checkFolderExists(projectName);

  const packageManager = await promptPackageManager();

  const isInquirerInstalled = await checkInquirerInstalled();
  if (!isInquirerInstalled) {
    console.log(chalk.yellow('🤖 inquirer is not installed. Installing it now...'));
    const spinner = ora('Installing inquirer...').start();
    await installInquirer(packageManager, spinner);
  }

  const targetDir = path.join(process.cwd(), projectName);

  try {
    const spinner = ora(`Creating project "${projectName}"...`).start();
    await fs.mkdir(targetDir, { recursive: true });

    const bar = new ProgressBar('⏳ Cloning repository [:bar] :percent', {
      total: 100,
      width: 30,
      complete: '=',
      incomplete: ' ',
    });

    const interval = setInterval(() => {
      bar.tick(10);
      if (bar.complete) {
        clearInterval(interval);
      }
    }, 500);

    await cloneRepo(repoUrl, targetDir, bar);
    spinner.succeed('Repository cloned successfully! 🎉');

    const updateSpinner = ora('Updating project files...').start();
    await updatePackageJson(targetDir, projectName);
    updateSpinner.succeed('Project files updated successfully!');

    projectCreated(packageManager);
  } catch (err) {
    console.error(chalk.red(`❌ Error creating project directory: ${err.message}`));
    process.exit(1);
  }
})();

async function promptForProjectName() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askForName = () => {
      rl.question(chalk.green('📛 Please provide a project name: '), (name) => {
        name = name.trim();
        if (name) {
          rl.close();
          resolve(name);
        } else {
          console.log(chalk.red('⚠️ Project name cannot be empty. Try again.'));
          askForName();
        }
      });
    };

    askForName();
  });
}

async function checkFolderExists(name) {
  const targetDir = path.join(process.cwd(), name);

  try {
    const stats = await fs.stat(targetDir);
    if (stats.isDirectory()) {
      console.log(chalk.yellow(`🚨 The folder "${name}" already exists.`));
      return await promptForNewProjectName();
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(chalk.red(`❌ Error checking directory: ${err.message}`));
      process.exit(1);
    }
  }

  return name;
}

function promptForNewProjectName() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(chalk.green('🔄 Please provide a new project name: '), (newName) => {
      rl.close();
      resolve(newName.trim());
    });
  });
}

async function promptPackageManager() {
  const inquirer = (await import('inquirer')).default;
  console.log(chalk.magenta('💡 Choosing a package manager...'));
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Please choose a package manager:',
      choices: ['npm', 'yarn', 'pnpm', 'bun'],
      default: 'npm',
    },
  ]);
  console.log(chalk.cyan(`🚀 You selected: ${answers.packageManager}`));
  return answers.packageManager;
}

async function checkInquirerInstalled() {
  try {
    require.resolve('inquirer');
    return true;
  } catch {
    return false;
  }
}

async function installInquirer(packageManager, spinner) {
  try {
    execSync(`${packageManager} install inquirer`, { stdio: 'inherit' });
    spinner.succeed('inquirer installed successfully! 🎉');
  } catch (err) {
    spinner.fail(chalk.red(`Failed to install inquirer: ${err.message}`));
    process.exit(1);
  }
}

async function cloneRepo(repoUrl, targetDir, bar) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      bar.tick();
      if (bar.complete) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    try {
      execSync(`git clone ${repoUrl} ${targetDir}`, { stdio: 'inherit' });
    } catch (err) {
      clearInterval(interval);
      reject(err);
    }
  });
}

async function updatePackageJson(targetDir, projectName) {
  const packageJsonPath = path.join(targetDir, 'package.json');

  try {
    const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
    const updatedPackageJson = packageJson.replace(/"name":\s*"(.*?)"/, `"name": "${projectName}"`);
    await fs.writeFile(packageJsonPath, updatedPackageJson, 'utf-8');
    console.log(chalk.green(`🔧 Updated package.json with project name: ${projectName}`));
  } catch (err) {
    console.error(chalk.red(`❌ Failed to update package.json: ${err.message}`));
    process.exit(1);
  }
}

function projectCreated(packageManager) {
  console.log(chalk.greenBright(`🎉 Project "${projectName}" created successfully!`));

  try {
    execSync(`${packageManager} --version`, { stdio: 'ignore' });
    console.log(chalk.blue(`✅ ${packageManager} is installed.`));
  } catch {
    console.log(chalk.red(`❌ ${packageManager} is not installed. Please install it.`));
    console.log(chalk.yellow(`You can install ${packageManager} using:`));
    if (packageManager === 'pnpm') {
      console.log('📦 npm install -g pnpm');
    } else if (packageManager === 'yarn') {
      console.log('📦 npm install -g yarn');
    } else if (packageManager === 'bun') {
      console.log('📦 npm install -g bun');
    }
  }

  console.log(chalk.greenBright(`\n🚀 To get started, navigate into your project folder:`));
  console.log(chalk.cyan(`📁 cd ${projectName}`));
  console.log(chalk.greenBright(`Then, install the dependencies with:`));
  console.log(chalk.magenta(`🔗 ${packageManager} install`));

  console.log(chalk.greenBright(`\n🛠️ You can run the following lifecycle scripts:`));
  console.log(chalk.blue(`1. 🧹 Clean the build directory: ${packageManager} run clean`));
  console.log(chalk.blue(`2. 🏗️ Build the project: ${packageManager} run build`));
  console.log(chalk.blue(`3. 🚦 Start the development server: ${packageManager} start`));
}
