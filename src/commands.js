import chalk from "chalk";
import { log } from "./logger.js";

export const displayCommands = () => {
  log.info(
    `${chalk.bold.white("COMMANDS")}
${chalk.gray("─".repeat(50))}
${chalk.cyan.bold("wamate")} ${chalk.yellow("add")}       ${chalk.white(
      "Add participants to a WhatsApp group (CLI numbers only)"
    )}
${chalk.cyan.bold("wamate")} ${chalk.yellow("csv")}       ${chalk.white(
      "Add participants from a CSV file (CSV only)"
    )}
${chalk.cyan.bold("wamate")} ${chalk.yellow("help")}      ${chalk.white(
      "Show this help menu"
    )}
${chalk.cyan.bold("wamate")} ${chalk.yellow("exit")}      ${chalk.white(
      "Exit the CLI"
    )}
${chalk.cyan.bold("wamate")} ${chalk.yellow("restart")}   ${chalk.white(
      "Restart the CLI"
    )}
${chalk.gray("─".repeat(50))}`
  );
};
