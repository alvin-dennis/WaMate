#!/usr/bin/env node

import { WamateManager, readNumbers } from "../src/index.js";
import { Command } from "commander";
import chalk from "chalk";

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
    const manager = new WamateManager("default");
    await manager.init();

    let groupId = options.group;

    if (!groupId.endsWith("@g.us")) {
      console.log(chalk.yellow(`ℹ️ Resolving invite code: ${groupId}`));
      try {
        const info = await manager.client.getInviteInfo(groupId);
        console.log(chalk.green(`✅ Found group: ${info.subject}`));
        groupId = info.id._serialized; 
        console.log(chalk.blue(`📌 Using Group ID: ${groupId}`));
      } catch (err) {
        console.error(
          chalk.red("❌ Invalid invite code or unable to fetch group info")
        );
        process.exit(1);
      }
    }

    let group;
    try {
      group = await manager.client.getChatById(groupId);
    } catch {
      console.error(chalk.red(`❌ Cannot find group: ${groupId}`));
      process.exit(1);
    }

    let numbers = [];

    if (options.numbers) {
      numbers.push(...options.numbers);
    }

    if (options.file) {
      const csvNumbers = await readNumbers(options.file);
      numbers.push(...csvNumbers);
    }
    numbers = numbers
      .map((num) => num.replace(/\D/g, "")) 
      .filter((num) => num.length >= 8); 
    if (numbers.length === 0) {
      console.error(chalk.red("❌ No valid numbers provided"));
      process.exit(1);
    }

    console.log(
      chalk.blue(`ℹ️ Adding ${numbers.length} numbers to group ${groupId}`)
    );

    await manager.addParticipants(groupId, numbers, {
      delayMs: Number(options.delay),
      chunkSize: Number(options.chunk),
    });

    console.log(chalk.green("✅ All done!"));
  } catch (err) {
    console.error(chalk.red("❌ Error during processing:"), err);
  }
})();