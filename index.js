const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");
const express = require("express");
const pino = require("pino");
const { PORT } = require("./config");
const { handleMessage } = require("./msg");
const { setPair } = require("./pair");

const app = express();
app.use(express.static("public"));

let sock;

/* PAIR CODE API */
app.get("/pair", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.json({ code: "INVALID" });

  try {
    const code = await sock.requestPairingCode(number);
    setPair(number, code);
    res.json({ code });
  } catch {
    res.json({ code: "ERROR" });
  }
});

app.listen(PORT, () => console.log("🌐 Server running:", PORT));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;
    await handleMessage(sock, msg);
  });
}

startBot();