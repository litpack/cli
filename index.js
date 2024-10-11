#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";
import readline from "readline";

let projectName = process.argv[2];
const repoUrl = "https://github.com/litpack/create";

(async () => {
  console.log(
    "\x1b[34m🌟 Welcome to the Litpack Project Generator! Let's get started...\x1b[0m"
  );

  if (!projectName) {
    projectName = await promptForProjectName();
  }

  projectName = await checkFolderExists(projectName);

  const packageManager = await promptPackageManager();

  const targetDir = path.join(process.cwd(), projectName);

  try {
    console.log(`Creating project "${projectName}"...`);
    await fs.mkdir(targetDir, { recursive: true });

    console.log("⏳ Cloning repository...");
    await cloneRepo(repoUrl, targetDir);
    console.log("🎉 Repository cloned successfully!");

    console.log("Updating project files...");
    await updatePackageJson(targetDir, projectName);
    console.log("✅ Project files updated successfully!");

    projectCreated(packageManager);
  } catch (err) {
    console.error(
      `\x1b[31m❌ Error creating project directory: ${err.message}\x1b[0m`
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
      rl.question("\x1b[32m📛 Please provide a project name: \x1b[0m", (name) => {
        name = name.trim();
        if (name) {
          rl.close();
          resolve(name);
        } else {
          console.log("\x1b[31m⚠️ Project name cannot be empty. Try again.\x1b[0m");
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
      console.log(`\x1b[33m🚨 The folder "${name}" already exists.\x1b[0m`);
      return await promptForNewProjectName();
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`\x1b[31m❌ Error checking directory: ${err.message}\x1b[0m`);
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
      "\x1b[32m🔄 Please provide a new project name: \x1b[0m",
      (newName) => {
        rl.close();
        resolve(newName.trim());
      }
    );
  });
}

async function promptPackageManager() {
  console.log("\x1b[35m💡 Choosing a package manager...\x1b[0m");
  const packageManagers = ["npm", "yarn", "pnpm", "bun"];
  const choice = await promptForChoice(packageManagers);
  console.log(`\x1b[36m🚀 You selected: ${choice}\x1b[0m`);
  return choice;
}

async function promptForChoice(choices) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const displayChoices = () => {
      console.log("\x1b[32mPlease choose a package manager:\x1b[0m");
      choices.forEach((choice, index) => {
        console.log(`\x1b[34m${index + 1}. ${choice}\x1b[0m`);
      });
      rl.question("\x1b[32mSelect a number: \x1b[0m", (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < choices.length) {
          rl.close();
          resolve(choices[index]);
        } else {
          console.log("\x1b[31m⚠️ Invalid choice. Try again.\x1b[0m");
          displayChoices();
        }
      });
    };

    displayChoices();
  });
}

async function cloneRepo(repoUrl, targetDir) {
  try {
    execSync(`git clone ${repoUrl} ${targetDir}`, { stdio: "inherit" });
    execSync(`git -C ${targetDir} checkout stable`, { stdio: "inherit" });
    
    await fs.rm(path.join(targetDir, '.git'), { recursive: true, force: true });
    
  } catch (err) {
    throw new Error("Failed to clone repository: " + err.message);
  }
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
      `\x1b[32m🔧 Updated package.json with project name: ${projectName}\x1b[0m`
    );
  } catch (err) {
    console.error(
      `\x1b[31m❌ Failed to update package.json: ${err.message}\x1b[0m`
    );
    process.exit(1);
  }
}

function projectCreated(packageManager) {
  console.log(
    `\x1b[32m🎉 Project "${projectName}" created successfully!\x1b[0m`
  );

  try {
    execSync(`${packageManager} --version`, { stdio: "ignore" });
    console.log(`\x1b[34m✅ ${packageManager} is installed.\x1b[0m`);
  } catch {
    console.log(
      `\x1b[31m❌ ${packageManager} is not installed. Please install it.\x1b[0m`
    );
    console.log("\x1b[33mYou can install " + packageManager + " using:\x1b[0m");
    if (packageManager === "pnpm") {
      console.log("📦 npm install -g pnpm");
    } else if (packageManager === "yarn") {
      console.log("📦 npm install -g yarn");
    } else if (packageManager === "bun") {
      console.log("📦 npm install -g bun");
    }
  }

  console.log(
    `\x1b[32m\n🚀 To get started, navigate into your project folder:\x1b[0m`
  );
  console.log(`\x1b[36m📁 cd ${projectName}\x1b[0m`);
  console.log(
    `\x1b[32mThen, install the dependencies with:\x1b[0m`
  );
  console.log(`\x1b[35m🔗 ${packageManager} install\x1b[0m`);

  console.log(
    `\x1b[32m\n🛠️ You can run the following lifecycle scripts:\x1b[0m`
  );
  console.log(
    `\x1b[34m1. 🧹 Clean the build directory: ${packageManager} run clean\x1b[0m`
  );
  console.log(
    `\x1b[34m2. 🏗️ Build the project: ${packageManager} run build\x1b[0m`
  );
  console.log(
    `\x1b[34m3. 🚦 Start the development server: ${packageManager} start\x1b[0m`
  );
}
