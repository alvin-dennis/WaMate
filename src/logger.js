import chalk from "chalk";

export const log = {
  success: (msg) => console.log(chalk.green(`• ${msg}`)),
  info: (msg) => console.log(chalk.blue(`• ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`• ${msg}`)),
  error: (msg) => console.log(chalk.red(`• ${msg}`)),
  header: (msg) => {
    console.log(
      `\n${chalk.bold.white(msg)}\n${chalk.gray("─".repeat(msg.length))}\n`
    );
  },
};

