import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import qr from "qrcode-terminal";
import { log } from "../logger.js";

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readNumbers(file) {
  const numbers = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (row) => numbers.push(row.numbers))
      .on("end", () => resolve(numbers))
      .on("error", (err) => reject(err));
  });
}

export class BulkAddManager {
  constructor(clientId = "default") {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId }),
      puppeteer: { headless: true },
    });
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.client.on("qr", (qrCode) => {
        log.info("📲 Scan this QR with WhatsApp:");
        qr.generate(qrCode, { small: true });
      });

      this.client.on("ready", () => {
        log.success("✅ WhatsApp client ready!");
        resolve();
      });

      this.client.on("auth_failure", (msg) => {
        log.error("❌ Auth failed:", msg);
        reject(new Error("Auth failed"));
      });

      this.client.initialize();
    });
  }

  async addParticipants(
    groupIdOrInvite,
    numbers,
    options = { delayMs: 2000, chunkSize: 5 }
  ) {
    let groupId = groupIdOrInvite;
    let groupName = null;

    if (!groupId.endsWith("@g.us")) {
      try {
        const info = await this.client.getInviteInfo(groupId);
        groupId = info.id._serialized;
        groupName = info.subject;
        log.success(`✅ Resolved group: ${groupName} (${groupId})`);
      } catch (err) {
        log.error(`❌ Failed to resolve invite: ${err.message}`);
        return;
      }
    }

    const results = [];
    const delayMs = options.delayMs || 2000;
    const chunkSize = options.chunkSize || 5;

    for (let i = 0; i < numbers.length; i += chunkSize) {
      const chunk = numbers.slice(i, i + chunkSize);

      for (const number of chunk) {
        const contactId = number.includes("@c.us") ? number : `${number}@c.us`;

        try {
          await this.client.addParticipants(groupId, [contactId]);
          log.success(`✅ Added ${number}`);
          results.push({ number, status: "added" });
        } catch (err) {
          log.error(`❌ Could not add ${number}: ${err.message}`);

          try {
            const invite = await this.client.getInviteCode(groupId);
            await this.client.sendMessage(
              contactId,
              `Join our WhatsApp group: https://chat.whatsapp.com/${invite}`
            );
            log.info(`🔗 Invite link sent to ${number}`);
            results.push({ number, status: "invite sent" });
          } catch (inviteErr) {
            log.error(
              `❌ Failed to send invite to ${number}: ${inviteErr.message}`
            );
            results.push({ number, status: "failed" });
          }
        }

        await delay(delayMs);
      }

      log.info(`📦 Chunk processed: ${i + 1}-${i + chunk.length}`);
      await delay(delayMs * 2);
    }

    await this.logResults(results);
  }

  async addParticipantsFromCSV(groupIdOrInvite, csvFile, options) {
    const numbers = await readNumbers(csvFile);
    await this.addParticipants(groupIdOrInvite, numbers, options);
  }

  async addParticipantsFromArray(numbers, groupIdOrInvite, options) {
    await this.addParticipants(groupIdOrInvite, numbers, options);
  }

  async logResults(results) {
    const csvWriter = createObjectCsvWriter({
      path: "results.csv",
      header: [
        { id: "number", title: "Number" },
        { id: "status", title: "Status" },
      ],
    });

    await csvWriter.writeRecords(results);
    log.success(`✅ Results logged to results.csv`);
  }
}
