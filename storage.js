const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const DATABASE_FILE = path.join(DATA_DIR, "database.json");

function ensureFile(filePath, fallback) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
}

function readJson(filePath, fallback) {
  ensureFile(filePath, fallback);

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    const backup = `${filePath}.broken-${Date.now()}`;
    fs.copyFileSync(filePath, backup);
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    console.error(`Storage file was corrupted. Backed up to ${backup}`);
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureFile(filePath, {});
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

let settings = readJson(SETTINGS_FILE, {});
let database = readJson(DATABASE_FILE, {});

function getGuildSettings(guildId) {
  return settings[guildId] || null;
}

function saveGuildSettings(guildId, patch) {
  settings[guildId] = {
    ...(settings[guildId] || {}),
    ...patch,
    guildId,
    updatedAt: new Date().toISOString()
  };
  writeJson(SETTINGS_FILE, settings);
  return settings[guildId];
}

function clearGuildSettings(guildId) {
  delete settings[guildId];
  writeJson(SETTINGS_FILE, settings);
}

function reloadSettings() {
  settings = readJson(SETTINGS_FILE, {});
  database = readJson(DATABASE_FILE, {});
}

function getGuildData(guildId) {
  database[guildId] ||= {
    warnings: {},
    cases: [],
    nextCaseId: 1,
    xp: {},
    tickets: {},
    suggestions: [],
    reviews: [],
    events: {},
    analytics: {
      joins: 0,
      leaves: 0,
      messages: 0,
      tickets: 0,
      suggestions: 0,
      reviews: 0,
      punishments: 0,
      channelMessages: {},
      activeUsers: {}
    }
  };
  return database[guildId];
}

function saveGuildData(guildId, data) {
  database[guildId] = data;
  writeJson(DATABASE_FILE, database);
  return data;
}

module.exports = {
  DATA_DIR,
  getGuildSettings,
  saveGuildSettings,
  clearGuildSettings,
  reloadSettings,
  getGuildData,
  saveGuildData
};
