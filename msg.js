const fs = require("fs");
const moment = require("moment-timezone");
const {
  PREFIX,
  BOT_NAME,
  OWNER,
  RANKING_FOLDER
} = require("./config");

const rankingCache = {};
const groupsToSave = new Set();

if (!fs.existsSync(RANKING_FOLDER))
  fs.mkdirSync(RANKING_FOLDER, { recursive: true });

function getDayKey() {
  return moment().tz("Asia/Colombo").format("YYYY-MM-DD");
}
function getWeekKey() {
  return moment().tz("Asia/Colombo").format("YYYY-WW");
}

setInterval(() => {
  for (const g of groupsToSave) {
    fs.writeFileSync(
      `${RANKING_FOLDER}/${g}.json`,
      JSON.stringify(rankingCache[g], null, 2)
    );
  }
  groupsToSave.clear();
}, 60000);

async function handleMessage(sock, msg) {
  const body =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    "";

  const isCmd = body.startsWith(PREFIX);
  const command = isCmd ? body.slice(1).split(" ")[0].toLowerCase() : "";
  const args = body.split(" ").slice(1);

  const chatId = msg.key.remoteJid;
  const finalLid = msg.key.participant || chatId;
  const isGroup = chatId.endsWith("@g.us");

  /* ================= RANK LISTENER ================= */
  if (isGroup && !msg.key.fromMe) {
    const file = `${RANKING_FOLDER}/${chatId}.json`;
    if (!rankingCache[chatId]) {
      rankingCache[chatId] = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : {};
    }

    const db = rankingCache[chatId];
    if (!db[finalLid]) {
      db[finalLid] = {
        global: 0,
        daily: { count: 0, dayKey: getDayKey() },
        weekly: { count: 0, weekKey: getWeekKey() }
      };
    }

    const u = db[finalLid];
    u.global++;
    u.daily.dayKey !== getDayKey()
      ? (u.daily = { count: 1, dayKey: getDayKey() })
      : u.daily.count++;
    u.weekly.weekKey !== getWeekKey()
      ? (u.weekly = { count: 1, weekKey: getWeekKey() })
      : u.weekly.count++;

    groupsToSave.add(chatId);
  }

  if (!isCmd) return;

  /* ================= MENU ================= */
  if (command === "menu") {
    return sock.sendMessage(chatId, {
      image: { url: "https://i.imgur.com/Z6XK8Zf.jpg" },
      caption:
        `🤖 *${BOT_NAME}*\n\n` +
        `.ranking\n.daily\n.weekly\n.myrank\n\n👑 Owner: 94778430626`,
      buttons: [
        { buttonId: ".ranking", buttonText: { displayText: "🏆 Ranking" }, type: 1 },
        { buttonId: ".myrank", buttonText: { displayText: "👤 My Rank" }, type: 1 }
      ]
    });
  }
}

module.exports = { handleMessage };