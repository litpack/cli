# Litpack Project Generator

Welcome to the **Litpack Project Generator**! This CLI tool allows you to quickly scaffold new Lit.js projects using your preferred package manager.

## Installation

You can easily create a new Litpack project using either of the following commands:

### Using npm

```bash
npm create litpack@latest <project-name>
```

### Using npx

```bash
npx create-litpack@latest <project-name>
```

Replace `<project-name>` with the desired name for your project.

## Usage

1. **Run the Command**:

   To create a new project, simply execute the command with your project name. If you don't specify a project name, you'll be prompted to enter one.

2. **Select a Package Manager**:

   During the setup process, you will be prompted to choose your preferred package manager from the following options:

   - npm
   - yarn
   - pnpm
   - bun

3. **Project Initialization**:

   The tool will create a new directory for your project, clone the necessary repository, and update the `package.json` file with your project name.

## Commands

Once your project is created, you can navigate into your project folder and run:

- **Clean the build directory**:

  ```bash
  <package-manager> run clean
  ```

- **Build the project**:

  ```bash
  <package-manager> run build
  ```

- **Start the development server**:

  ```bash
  <package-manager> start
  ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
