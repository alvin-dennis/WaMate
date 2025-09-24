#!/usr/bin/env node

import { WamateManager, readNumbers } from "../src/functions.js";
import { Command } from "commander";
import ora from "ora";
import { renderTitle } from "../src/title.js";
import { log } from "../src/logger.js";
import { input, select } from "@inquirer/prompts";
import chalk from "chalk";

const program = new Command();

function renderBanner() {
  renderTitle();
  log.info("──────────────────────────────────────────");
  log.info(chalk.cyan("✨ WhatsApp Bulk Adder CLI"));
  log.info("──────────────────────────────────────────\n");
}

program
  .name("wamate")
  .requiredOption(
    "-g, --group <idOrInvite>",
    "WhatsApp group ID or invite code"
  )
  .option("-n, --numbers <numbers...>", "List of phone numbers")
  .option("-f, --file <path>", "CSV file with numbers")
  .option("-d, --delay <ms>", "Delay between adds", 2000)
  .option("-c, --chunk <size>", "Chunk size for adding participants", 5)
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
  log.info("📖 Interactive mode enabled...\n");

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
    log.info("🚀 Launching WaMate CLI...\n");

    const manager = new WamateManager("default");
    await manager.init();

    let groupId = options.group;
    if (!groupId.endsWith("@g.us")) {
      const spinner = ora(`Resolving invite code: ${groupId}`).start();
      try {
        const info = await manager.client.getInviteInfo(groupId);
        groupId = info.id._serialized;
        spinner.succeed(`✅ Found group: ${info.subject} (${groupId})`);
      } catch {
        spinner.fail("❌ Invalid invite code or unable to fetch group info");
        process.exit(1);
      }
    }

    const spinnerGroup = ora(`Fetching group info: ${groupId}`).start();
    let group;
    try {
      group = await manager.client.getChatById(groupId);
      spinnerGroup.succeed(`✅ Group loaded: ${group.name}`);
    } catch {
      spinnerGroup.fail(`❌ Cannot find group: ${groupId}`);
      process.exit(1);
    }

    log.info("\n📋 Preparing numbers...");
    let numbers = [];

    if (options.numbers && options.numbers.length > 0)
      numbers.push(...options.numbers);

    if (options.file) {
      const spinnerFile = ora(`Reading CSV file: ${options.file}`).start();
      try {
        const csvNumbers = await readNumbers(options.file);
        numbers.push(...csvNumbers);
        spinnerFile.succeed(`✅ CSV loaded (${csvNumbers.length} numbers)`);
      } catch (err) {
        spinnerFile.fail(`❌ Failed to read CSV: ${err.message}`);
        process.exit(1);
      }
    }

    numbers = numbers
      .map((num) => (num ? String(num).replace(/\D/g, "") : ""))
      .filter((num) => num.length >= 8);

    if (numbers.length === 0) {
      log.error("❌ No valid numbers provided");
      process.exit(1);
    }

    log.info(`\nℹ️ Total numbers to add: ${numbers.length}`);

    const spinnerAdd = ora("Adding participants...").start();
    await manager.addParticipants(groupId, numbers, {
      delayMs: Number(options.delay),
      chunkSize: Number(options.chunk),
    });
    spinnerAdd.succeed("✅ All participants processed");

    log.info("\n🎉 WaMate CLI finished successfully!");
    log.info("──────────────────────────────────────────");
    log.success(`✔ Group: ${group.name}`);
    log.success(`✔ Added: ${numbers.length} participants`);
    log.success(`✔ Delay: ${options.delay}ms | Chunk size: ${options.chunk}`);
    log.info("──────────────────────────────────────────\n");

    log.info("👋 Thank you for using WaMate! See you next time.\n");
    process.exit(0);
  } catch (err) {
    renderBanner();
    log.error("❌ Error during processing:", err);
    log.info("👋 Thank you for using WaMate! See you next time.\n");
    process.exit(1);
  }
})();
