import gradient from "gradient-string";

export const TITLE_TEXT = `

██╗    ██╗ █████╗ ███╗   ███╗ █████╗ ████████╗███████╗
██║    ██║██╔══██╗████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║ █╗ ██║███████║██╔████╔██║███████║   ██║   █████╗  
██║███╗██║██╔══██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  
╚███╔███╔╝██║  ██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
 ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
 `;

const whatsappTheme = {
  primaryGreen: "#25D366",
  darkGreen: "#128C7E",
  white: "#FFFFFF",
};

export const renderTitle = () => {
  const terminalWidth = process.stdout.columns || 80;
  const titleLines = TITLE_TEXT.split("\n");
  const titleWidth = Math.max(...titleLines.map((line) => line.length));

  if (terminalWidth < titleWidth) {
    const simplifiedTitle = `
    ╔══════════════════╗
    ║      WAMATE      ║
    ╚══════════════════╝
    `;
    console.log(
      gradient(Object.values(whatsappTheme)).multiline(simplifiedTitle)
    );
  } else {
    console.log(gradient(Object.values(whatsappTheme)).multiline(TITLE_TEXT));
  }
};
