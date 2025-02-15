# X‑Fidelity Plugins Monorepo Example

This repository is a monorepo example demonstrating how to extend the [x‑fidelity](https://github.com/x-fidelity) framework with custom plugins. It is organized using Yarn workspaces, where each package implements a plugin that integrates seamlessly into the x‑fidelity ecosystem.

## Repository Structure

- **packages/api-validator**  
  *Purpose:* Validates repository files by extracting version information using a regex and then verifying it through an external API.  
  *Key Components:*  
  - **Operator:** `regexExtract`  
  - **Fact:** `externalApiCall`

- **packages/security-scanner**  
  *Purpose:* Scans files for sensitive data (e.g., API keys, passwords, private keys) and ensures that such content is not present.  
  *Key Components:*  
  - **Operator:** `securityRuleCheck`  
  - **Fact:** `sensitiveDataScan`

- **packages/performance-check**  
  *Purpose:* Measures API response times to verify that performance thresholds are met.  
  *Key Components:*  
  - **Operator:** `thresholdCheck`  
  - **Fact:** `responseTime`

Additionally, the **demoConfig** folder provides sample rule definitions (for example, in `apiValidator-iterative-rule.json`, `security-scan-iterative-rule.json`, and `performance-check-global-rule.json`) that show how to combine these plugins within an x‑fidelity configuration. The `demoConfig/node-fullstack.json` file further demonstrates how to integrate multiple plugins for full‐stack validation.

## How It Works

Each plugin is built to comply with the x‑fidelity framework:
- **Structure:** Every plugin exports an object with `name`, `version`, `facts`, `operators`, and an `onError` handler.
- **Logic:**  
  - *Facts* compute or retrieve data (for example, extracting a value from file content or measuring response time).  
  - *Operators* act upon the fact results (for example, checking that an extracted value exists or validating that response times are within thresholds).
- **Error Handling:** Plugins implement a standardized `onError` function that categorizes and logs errors consistently using x‑fidelity’s logger.

## Getting Started

### Installation
Make sure you have Yarn installed, then run:
```bash
yarn install
```

### Build
To compile all packages:
```bash
yarn build
```

### Test
Run the tests for all plugins:
```bash
yarn test
```

### Lint
To run linting on the code:
```bash
yarn lint
```

## Extending x‑Fidelity

This monorepo serves as a template for developing new plugins:
- **Create a New Plugin:** Add a new package under `packages/` following the established structure (including a `tsconfig.json` and appropriate test files).
- **Define Facts & Operators:** Implement your logic inside your plugin to extract data or perform validations, ensuring you also provide an `onError` function.
- **Update Configurations:** Add your new facts and operators to a demo configuration (similar to those in `demoConfig/`) to see them in action.

For more details on plugin development, refer to the [x‑fidelity documentation](https://github.com/x-fidelity).

## Conclusion

This repository illustrates a modular, plugin-based approach to extending x‑fidelity. It provides a solid starting point for developing custom plugins that enhance repository validation and monitoring workflows in your projects.
