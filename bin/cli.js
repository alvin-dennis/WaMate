#!/usr/bin/env node

import { WamateManager, readNumbers } from "../src/functions.js";
import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { renderTitle } from "../src/title.js";
import { log } from "../src/logger.js";
import { input, select } from "@inquirer/prompts";

const program = new Command();

function renderBanner() {
  renderTitle();
  console.log(chalk.gray("──────────────────────────────────────────"));
  console.log(chalk.cyan("✨ WhatsApp Bulk Adder CLI"));
  console.log(chalk.gray("──────────────────────────────────────────\n"));
}

program
  .name("wamate")
  .requiredOption(
    "-g, --group <idOrInvite>",
    "WhatsApp group ID or invite code"
  )
  .option("-n, --numbers <numbers...>", "List of phone numbers")
  .option("-f, --file <path>", "CSV file with numbers")
  .option("-d, --delay <ms>", "Delay between adds (default: 2000)", 2000)
  .option(
    "-c, --chunk <size>",
    "Chunk size for adding participants (default: 5)",
    5
  )
  .showHelpAfterError(true);

program.configureOutput({
  outputError: (str) => {
    renderBanner();
    log.error(`❌ ${str}\n`);
    program.outputHelp();
    process.exit(1);
  },
});

async function askInteractive() {
  renderBanner();

  const group = await input({
    message: "Enter WhatsApp Group ID or Invite Code:",
    validate: (val) => val.trim() !== "" || "Group ID/Invite is required",
  });

  const method = await select({
    message: "How do you want to add participants?",
    choices: [
      { name: "Enter numbers manually", value: "manual" },
      { name: "Upload from CSV file", value: "csv" },
    ],
  });

  let numbers = [];
  let file = null;

  if (method === "manual") {
    const nums = await input({
      message: "Enter phone numbers (space separated):",
      validate: (val) => val.trim() !== "" || "At least one number is required",
    });
    numbers = nums.split(/\s+/);
  } else {
    file = await input({
      message: "Enter CSV file path:",
      validate: (val) => val.trim() !== "" || "File path is required",
    });
  }

  const delay = await input({
    message: "Delay between adds (ms, default 2000):",
    default: "2000",
  });

  const chunk = await input({
    message: "Chunk size (default 5):",
    default: "5",
  });

  return { group, numbers, file, delay, chunk };
}

(async () => {
  try {
    let options;

    if (process.argv.length <= 2) {
      options = await askInteractive();
    } else {
      program.parse(process.argv);
      options = program.opts();
    }

    renderBanner();
    console.log(chalk.cyan("🚀 Launching WaMate CLI...\n"));

    const manager = new WamateManager("default");
    await manager.init();

    let groupId = options.group;
    if (!groupId.endsWith("@g.us")) {
      const spinner = ora(
        chalk.yellow(`Resolving invite code: ${groupId}`)
      ).start();
      try {
        const info = await manager.client.getInviteInfo(groupId);
        groupId = info.id._serialized;
        spinner.succeed(
          chalk.green(`✅ Found group: ${info.subject} (${groupId})`)
        );
      } catch {
        spinner.fail(
          chalk.red("❌ Invalid invite code or unable to fetch group info")
        );
        process.exit(1);
      }
    }

    const spinnerGroup = ora(
      chalk.yellow(`Fetching group info: ${groupId}`)
    ).start();
    let group;
    try {
      group = await manager.client.getChatById(groupId);
      spinnerGroup.succeed(chalk.green(`✅ Group loaded: ${group.name}`));
    } catch {
      spinnerGroup.fail(chalk.red(`❌ Cannot find group: ${groupId}`));
      process.exit(1);
    }

    console.log(chalk.cyan("\n📋 Preparing numbers..."));
    let numbers = [];

    if (options.numbers && options.numbers.length > 0)
      numbers.push(...options.numbers);

    if (options.file) {
      const spinnerFile = ora(
        chalk.yellow(`Reading CSV file: ${options.file}`)
      ).start();
      try {
        const csvNumbers = await readNumbers(options.file);
        numbers.push(...csvNumbers);
        spinnerFile.succeed(
          chalk.green(`✅ CSV loaded (${csvNumbers.length} numbers)`)
        );
      } catch (err) {
        spinnerFile.fail(chalk.red(`❌ Failed to read CSV: ${err.message}`));
        process.exit(1);
      }
    }

    numbers = numbers
      .map((num) => (num ? String(num).replace(/\D/g, "") : ""))
      .filter((num) => num.length >= 8);

    if (numbers.length === 0) {
      log.error(chalk.red("❌ No valid numbers provided"));
      process.exit(1);
    }

    console.log(
      chalk.cyan(`\nℹ️ Total numbers to add: ${chalk.bold(numbers.length)}`)
    );

    const spinnerAdd = ora(chalk.yellow("Adding participants...")).start();
    await manager.addParticipants(groupId, numbers, {
      delayMs: Number(options.delay),
      chunkSize: Number(options.chunk),
    });
    spinnerAdd.succeed(chalk.green("✅ All participants processed"));

    console.log(chalk.bold.cyan("\n🎉 WaMate CLI finished successfully!"));
    console.log(chalk.gray("──────────────────────────────────────────"));
    log.info(`${chalk.green("✔")} Group: ${chalk.bold(group.name)}`);
    log.info(
      `${chalk.green("✔")} Added: ${chalk.bold(numbers.length)} participants`
    );
    log.info(
      `${chalk.green("✔")} Delay: ${options.delay}ms | Chunk size: ${
        options.chunk
      }`
    );
    console.log(chalk.gray("──────────────────────────────────────────\n"));
     console.log(
       chalk.greenBright("👋 Thank you for using WaMate! See you next time.\n")
     );
    process.exit(0);
  } catch (err) {
    renderBanner();
    console.log(
      chalk.greenBright("👋 Thank you for using WaMate! See you next time.\n")
    );
    process.exit(1);
  }
})();
