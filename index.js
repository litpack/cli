#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

let projectName = process.argv[2];
const repoUrl = 'https://github.com/litpack/create';

(async () => {
  if (!projectName) {
    projectName = await promptForProjectName();
  }

  projectName = await checkFolderExists(projectName);

  const packageManager = await promptPackageManager();

  const isInquirerInstalled = await checkInquirerInstalled();
  if (!isInquirerInstalled) {
    console.log('inquirer is not installed. Installing it...');
    await installInquirer(packageManager);
  }

  const targetDir = path.join(process.cwd(), projectName);

  try {
    await fs.mkdir(targetDir, { recursive: true });
    await cloneRepo(repoUrl, targetDir);
    await updatePackageJson(targetDir, projectName);
    projectCreated(packageManager);
  } catch (err) {
    console.error(`Error creating project directory: ${err}`);
    process.exit(1);
  }
})();

async function promptForProjectName() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Please provide a project name: ', (name) => {
      rl.close();
      resolve(name.trim());
    });
  });
}

async function checkFolderExists(name) {
  const targetDir = path.join(process.cwd(), name);

  try {
    const stats = await fs.stat(targetDir);
    if (stats.isDirectory()) {
      console.log(`The folder "${name}" already exists.`);
      return await promptForNewProjectName();
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error checking directory: ${err}`);
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

    rl.question('Please provide a new project name: ', (newName) => {
      rl.close();
      resolve(newName.trim());
    });
  });
}

async function promptPackageManager() {
  const inquirer = (await import('inquirer')).default;
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Please choose a package manager:',
      choices: ['npm', 'yarn', 'pnpm', 'bun'],
    },
  ]);
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

async function installInquirer(packageManager) {
  try {
    execSync(`${packageManager} install inquirer`, { stdio: 'inherit' });
    console.log('inquirer installed successfully.');
  } catch (err) {
    console.error(`Failed to install inquirer: ${err}`);
    process.exit(1);
  }
}

async function cloneRepo(repoUrl, targetDir) {
  try {
    execSync(`git clone ${repoUrl} ${targetDir}`, { stdio: 'inherit' });
    console.log(`Cloned repository from ${repoUrl} into ${targetDir}`);
  } catch (err) {
    console.error(`Failed to clone repository: ${err}`);
    process.exit(1);
  }
}

async function updatePackageJson(targetDir, projectName) {
  const packageJsonPath = path.join(targetDir, 'package.json');
  
  try {
    const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
    const updatedPackageJson = packageJson.replace(/"name":\s*"(.*?)"/, `"name": "${projectName}"`);
    await fs.writeFile(packageJsonPath, updatedPackageJson, 'utf-8');
    console.log(`Updated package.json with project name: ${projectName}`);
  } catch (err) {
    console.error(`Failed to update package.json: ${err}`);
    process.exit(1);
  }
}

function projectCreated(packageManager) {
  console.log(`🎉 Project ${projectName} created successfully!`);

  try {
    execSync(`${packageManager} --version`, { stdio: 'ignore' });
    console.log(`✅ ${packageManager} is already installed.`);
  } catch {
    console.log(`❌ ${packageManager} is not installed. Please install ${packageManager} to manage dependencies.`);
    console.log(`You can install ${packageManager} using the following command:`);
    if (packageManager === 'pnpm') {
      console.log('📦 npm install -g pnpm');
    } else if (packageManager === 'yarn') {
      console.log('📦 npm install -g yarn');
    } else if (packageManager === 'bun') {
      console.log('📦 npm install -g bun');
    }
  }

  console.log(`\n🚀 To get started, navigate into your project folder:`);
  console.log(`📁 cd ${projectName}`);
  console.log(`Then, install the dependencies with:`);
  console.log(`🔗 ${packageManager} install`);

  console.log(`\n🛠️ You can run the following lifecycle scripts:`);
  console.log(`1. 🧹 Clean the build directory: ${packageManager} run clean`);
  console.log(`2. 🏗️ Build the project: ${packageManager} run build`);
  console.log(`3. 🚦 Start the development server: ${packageManager} start`);
}
