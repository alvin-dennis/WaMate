# Wamate

**Wamate** is a Node.js CLI tool to add participants to WhatsApp groups automatically using [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js). It can add numbers directly or send invite links if direct addition fails. Numbers can be provided via command-line arguments or a CSV file.

---

## Features

- Add participants to a WhatsApp group in **chunks** with a configurable delay.
- Automatically send **invite links** if a participant cannot be added directly.
- Supports reading numbers from a **CSV file**.
- Logs results to `results.csv` with status (`added`, `invite sent`, or `failed`).
- Generates QR code for easy WhatsApp authentication.

---

## Installation ( For contribution and development)

1. Clone the repository:

```bash
git clone https://github.com/alvin-dennis/WaMate.git
cd wamate
```

2. Install dependencies:

```bash
bun install
```

3. Make the CLI executable:

```bash
npm link
```

1. Run the CLI:

```bash
wamate
```

---

## For using WaMate

### Installation

Using npm:

```bash
npm i -g wamate
```

Using bun:

```bash
bun i -g wamate
```

### Authentication

1. On the first run, Wamate will display a QR code in the terminal.

2. Scan the QR code using your WhatsApp mobile app.

3. Once authenticated, Wamate will be ready to add participants.

> [!NOTE]
> You must be an admin of the group to add participants directly. If a number cannot be added, Wamate sends an invite link instead. Avoid adding your own number; the bot cannot add itself. Make sure WhatsApp is logged in on your phone when scanning the QR code.

---

### Usage

You can run WaMate in two ways:

1. CLI mode (provide all required options in one command):

```bash
wamate -g <groupIdOrInvite> -n <number1> <number2> ... -f <path/to/file.csv> -d <delayMs> -c <chunkSize>
```

2. Interactive mode (default):

```bash
wamate
```

This will launch step-by-step prompts for groupID or Invite code, numbers, file, delay, and chunk size.

| Option                       | Description                                                         |
| ---------------------------- | ------------------------------------------------------------------- |
| `-g, --group <idOrInvite>`   | WhatsApp group ID or invite code (required)                         |
| `-n, --numbers <numbers...>` | List of phone numbers to add (optional)                             |
| `-f, --file <path>`          | CSV file containing numbers (optional)                              |
| `-d, --delay <ms>`           | Delay in milliseconds between adding participants (default: `2000`) |
| `-c, --chunk <size>`         | Number of participants to add at a time (default: `5`)              |

> [!NOTE]
> The CSV file should have a column named "numbers" with phone numbers.

### Examples

#### Using CLI

- Add a single number via CLI:

```bash
wamate -g <groupIdOrInvite> -n  971500000001
```

- Add multiple numbers via CLI:

```bash
wamate -g <groupIdOrInvite> -n  1836243775 18732562552 9846541885
```

- Add numbers from a CSV file:

```bash
wamate -g <groupIdOrInvite> -f numbers.csv 
```

#### Using Interactive mode (enabled by default)

- Interactive mode (manual numbers):

```json
wamate
? Enter WhatsApp group ID or invite: 1234567890@g.us
? How do you want to add participants? Enter numbers manually
? Enter numbers (space-separated): 919876543210 917654321098
? Enter delay in ms between chunks (default 2000): 2000
? Enter chunk size (default 5): 5

```

- Interactive mode (CSV file):

```json
wamate
? Enter WhatsApp group ID or invite: 1234567890@g.us
? How do you want to add participants? Upload from CSV file
? Enter CSV file path: ./members.csv
? Enter delay in ms between chunks (default 2000): 2000
? Enter chunk size (default 5): 5

```

---

## ⚠️ Disclaimer

This is an **unofficial** project using `whatsapp-web.js`.

- It is **not affiliated** with WhatsApp or Meta.
- Use it only for **personal and educational purposes**.
- Improper use could result in **account bans or restrictions** by WhatsApp.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🙋 Support & Contribute

- Found a bug? [Open an issue](https://github.com/alvin-dennis/WaMate/issues)
- Want to improve this tool? [Make a pull request](https://github.com/alvin-dennis/WaMate/pulls)
- Read our [Contribution Guidelines](./CONTRIBUTING.md) before contributing
- Created by [Alvin Dennis](https://alvindennis.tech) — feel free to connect!

---
