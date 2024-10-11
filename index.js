#!/usr/bin/env node

import { promises as fs } from "fs";
import { mkdtemp } from 'fs/promises';
import path from "path";
import { execSync } from "child_process";
import readline from "readline";
import chalk from "chalk";
import ora from "ora";
import ProgressBar from "progress";
import { tmpdir } from 'os';
import { join } from 'path';

let projectName = process.argv[2];
const repoUrl = "https://github.com/litpack/create";

(async () => {
  console.log(
    chalk.blue("🌟 Welcome to the Litpack Project Generator! Let's get started...")
  );

  if (!projectName) {
    projectName = await promptForProjectName();
  }

  projectName = await checkFolderExists(projectName);

  const packageManager = await promptPackageManager();

  const targetDir = path.join(process.cwd(), projectName);

  try {
    const spinner = ora(`Creating project "${projectName}"...`).start();
    await fs.mkdir(targetDir, { recursive: true });

    const bar = new ProgressBar("⏳ Cloning repository [:bar] :percent", {
      total: 100,
      width: 30,
      complete: "=",
      incomplete: " ",
    });

    const interval = setInterval(() => {
      bar.tick(10);
      if (bar.complete) {
        clearInterval(interval);
      }
    }, 500);

    await cloneRepo(repoUrl, targetDir, bar);
    spinner.succeed("Repository cloned successfully! 🎉");

    const updateSpinner = ora("Updating project files...").start();
    await updatePackageJson(targetDir, projectName);
    updateSpinner.succeed("Project files updated successfully!");

    projectCreated(packageManager);
  } catch (err) {
    console.error(
      chalk.red(`❌ Error creating project directory: ${err.message}`)
    );
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
      rl.question(chalk.green("📛 Please provide a project name: "), (name) => {
        name = name.trim();
        if (name) {
          rl.close();
          resolve(name);
        } else {
          console.log(chalk.red("⚠️ Project name cannot be empty. Try again."));
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
    if (err.code !== "ENOENT") {
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

    rl.question(
      chalk.green("🔄 Please provide a new project name: "),
      (newName) => {
        rl.close();
        resolve(newName.trim());
      }
    );
  });
}

async function promptPackageManager() {
  console.log(chalk.magenta("💡 Choosing a package manager..."));
  const packageManagers = ["npm", "yarn", "pnpm", "bun"];
  const choice = await promptForChoice(packageManagers);
  console.log(chalk.cyan(`🚀 You selected: ${choice}`));
  return choice;
}

async function promptForChoice(choices) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const displayChoices = () => {
      console.log(chalk.green("Please choose a package manager:"));
      choices.forEach((choice, index) => {
        console.log(chalk.blue(`${index + 1}. ${choice}`));
      });
      rl.question(chalk.green("Select a number: "), (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < choices.length) {
          rl.close();
          resolve(choices[index]);
        } else {
          console.log(chalk.red("⚠️ Invalid choice. Try again."));
          displayChoices();
        }
      });
    };

    displayChoices();
  });
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
      execSync(`git clone ${repoUrl} ${targetDir}`, { stdio: "inherit" });
      execSync(`git -C ${targetDir} checkout stable`, { stdio: "inherit" });
    } catch (err) {
      clearInterval(interval);
      reject(err);
    }
  });
}

async function updatePackageJson(targetDir, projectName) {
  const packageJsonPath = path.join(targetDir, "package.json");

  try {
    const packageJson = await fs.readFile(packageJsonPath, "utf-8");
    const updatedPackageJson = packageJson.replace(
      /"name":\s*"(.*?)"/,
      `"name": "${projectName}"`
    );
    await fs.writeFile(packageJsonPath, updatedPackageJson, "utf-8");
    console.log(
      chalk.green(`🔧 Updated package.json with project name: ${projectName}`)
    );
  } catch (err) {
    console.error(
      chalk.red(`❌ Failed to update package.json: ${err.message}`)
    );
    process.exit(1);
  }
}

function projectCreated(packageManager) {
  console.log(
    chalk.greenBright(`🎉 Project "${projectName}" created successfully!`)
  );

  try {
    execSync(`${packageManager} --version`, { stdio: "ignore" });
    console.log(chalk.blue(`✅ ${packageManager} is installed.`));
  } catch {
    console.log(
      chalk.red(`❌ ${packageManager} is not installed. Please install it.`)
    );
    console.log(chalk.yellow(`You can install ${packageManager} using:`));
    if (packageManager === "pnpm") {
      console.log("📦 npm install -g pnpm");
    } else if (packageManager === "yarn") {
      console.log("📦 npm install -g yarn");
    } else if (packageManager === "bun") {
      console.log("📦 npm install -g bun");
    }
  }

  console.log(
    chalk.greenBright(`\n🚀 To get started, navigate into your project folder:`)
  );
  console.log(chalk.cyan(`📁 cd ${projectName}`));
  console.log(chalk.greenBright(`Then, install the dependencies with:`));
  console.log(chalk.magenta(`🔗 ${packageManager} install`));

  console.log(
    chalk.greenBright(`\n🛠️ You can run the following lifecycle scripts:`)
  );
  console.log(
    chalk.blue(`1. 🧹 Clean the build directory: ${packageManager} run clean`)
  );
  console.log(
    chalk.blue(`2. 🏗️ Build the project: ${packageManager} run build`)
  );
  console.log(
    chalk.blue(`3. 🚦 Start the development server: ${packageManager} start`)
  );
}
