#!/usr/bin/env node

import { WamateManager, readNumbers } from "../src/functions.js";
import { Command } from "commander";
import ora from "ora";
import { log } from "../src/logger.js";
import { renderTitle } from "../src/title.js";

const program = new Command();

program
  .name("wamate")
  .description("Add participants to a WhatsApp group")
  .requiredOption(
    "-g, --group <idOrInvite>",
    "WhatsApp group ID or invite code"
  )
  .option("-n, --numbers <numbers...>", "List of phone numbers")
  .option("-f, --file <path>", "CSV file with numbers")
  .option("-d, --delay <ms>", "Delay between adds", 2000)
  .option("-c, --chunk <size>", "Chunk size for adding participants", 5);

if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);
const options = program.opts();

(async () => {
  try {
    renderTitle();
    log.info("🚀 Starting WaMate CLI...");
    const manager = new WamateManager("default");
    await manager.init();

    let groupId = options.group;

    if (!groupId.endsWith("@g.us")) {
      const spinner = ora(`Resolving invite code: ${groupId}`).start();
      try {
        const info = await manager.client.getInviteInfo(groupId);
        groupId = info.id._serialized;
        spinner.succeed(`✅ Found group: ${info.subject} (${groupId})`);
      } catch (err) {
        spinner.fail(`❌ Invalid invite code or unable to fetch group info`);
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

    log.info("📋 Preparing numbers...");
    let numbers = [];

    if (options.numbers) numbers.push(...options.numbers);
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

    log.info(`ℹ️ Adding ${numbers.length} numbers to group...`);
    const spinnerAdd = ora("Adding participants...").start();
    await manager.addParticipants(groupId, numbers, {
      delayMs: Number(options.delay),
      chunkSize: Number(options.chunk),
    });
    spinnerAdd.succeed("✅ All participants processed");

    log.success("🎉 WaMate CLI finished successfully!");
    process.exit(0);
  } catch (err) {
    log.error("❌ Error during processing:", err);
    process.exit(1);
  }
})();
