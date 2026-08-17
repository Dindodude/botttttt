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
    // Some Windows editors add a UTF-8 byte-order marker. JSON.parse does not
    // accept it, so remove it before parsing instead of resetting valid data.
    const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(content);
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

function createAnalytics() {
  return {
    joins: 0,
    leaves: 0,
    messages: 0,
    tickets: 0,
    suggestions: 0,
    reviews: 0,
    punishments: 0,
    channelMessages: {},
    activeUsers: {}
  };
}

function createGuildData() {
  return {
    warnings: {},
    cases: [],
    nextCaseId: 1,
    xp: {},
    donations: {},
    tickets: {},
    ticketMeta: {},
    suggestions: [],
    reviews: [],
    events: {},
    giveaways: {},
    tempBans: {},
    punishments: {},
    autoMod: {},
    autoModRecent: {},
    staffStats: {},
    staffApplications: {},
    staffAppConfig: {},
    staffLogPoints: {},
    staffLogVotes: {},
    analytics: createAnalytics()
  };
}

function objectOr(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function arrayOr(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeGuildData(value) {
  const source = objectOr(value);
  const defaults = createGuildData();
  const normalized = { ...defaults, ...source };

  for (const key of [
    "warnings",
    "xp",
    "donations",
    "tickets",
    "ticketMeta",
    "events",
    "giveaways",
    "tempBans",
    "punishments",
    "autoMod",
    "autoModRecent",
    "staffStats",
    "staffApplications",
    "staffAppConfig",
    "staffLogPoints",
    "staffLogVotes"
  ]) {
    normalized[key] = objectOr(source[key]);
  }

  normalized.cases = arrayOr(source.cases);
  normalized.suggestions = arrayOr(source.suggestions);
  normalized.reviews = arrayOr(source.reviews);
  normalized.donations = Object.fromEntries(
    Object.entries(objectOr(source.donations)).flatMap(([userId, record]) => {
      const sourceRecord = objectOr(record, { total: record });
      const totalValue = String(sourceRecord.total ?? "").replace(/[,_\s]/g, "");
      const total = Math.max(0, Math.floor(Number(totalValue) || 0));
      if (!total) return [];
      return [[userId, {
        total,
        userTag: String(sourceRecord.userTag || userId),
        updatedAt: Number(sourceRecord.updatedAt) || Date.now()
      }]];
    })
  );
  normalized.nextCaseId = Number.isSafeInteger(source.nextCaseId) && source.nextCaseId > 0
    ? source.nextCaseId
    : Math.max(0, ...normalized.cases.map((entry) => Number(entry?.id) || 0)) + 1;

  const analytics = objectOr(source.analytics);
  normalized.analytics = {
    ...createAnalytics(),
    ...analytics,
    channelMessages: objectOr(analytics.channelMessages),
    activeUsers: objectOr(analytics.activeUsers)
  };

  for (const key of ["joins", "leaves", "messages", "tickets", "suggestions", "reviews", "punishments"]) {
    normalized.analytics[key] = Number.isFinite(Number(normalized.analytics[key]))
      ? Number(normalized.analytics[key])
      : 0;
  }

  // Keep the existing object reference. Some command helpers update the same
  // guild record during one action (for example ticket stats while closing).
  Object.assign(source, normalized);
  return source;
}

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
  database[guildId] = normalizeGuildData(database[guildId]);
  return database[guildId];
}

function saveGuildData(guildId, data) {
  database[guildId] = normalizeGuildData(data);
  writeJson(DATABASE_FILE, database);
  return database[guildId];
}

module.exports = {
  DATA_DIR,
  getGuildSettings,
  saveGuildSettings,
  clearGuildSettings,
  reloadSettings,
  getGuildData,
  saveGuildData,
  normalizeGuildData
};
