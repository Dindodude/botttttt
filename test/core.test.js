const test = require("node:test");
const assert = require("node:assert/strict");

const {
  BAN_APPEAL_INVITE,
  cleanUserId,
  parseTempBanDuration,
  parseTimeoutDuration
} = require("../index");
const { normalizeGuildData } = require("../storage");

test("ban appeal invite is current", () => {
  assert.equal(BAN_APPEAL_INVITE, "https://discord.gg/WQ4U3ARjue");
});

test("timeout duration accepts minutes, hours, and days", () => {
  assert.equal(parseTimeoutDuration(["30m"]).ms, 30 * 60 * 1000);
  assert.equal(parseTimeoutDuration(["2", "hours"]).ms, 2 * 60 * 60 * 1000);
  assert.equal(parseTimeoutDuration(["3d"]).ms, 3 * 24 * 60 * 60 * 1000);
  assert.equal(parseTimeoutDuration(["29d"]), null);
});

test("tempban duration supports explicit units and legacy day numbers", () => {
  assert.equal(parseTempBanDuration(["30m"]).label, "30 minutes");
  assert.equal(parseTempBanDuration(["12h"]).label, "12 hours");
  assert.equal(parseTempBanDuration(["14d"]).label, "14 days");
  assert.equal(parseTempBanDuration(["2", "days"]).consumed, 2);
  assert.equal(parseTempBanDuration(["14"]).label, "14 days");
  assert.equal(parseTempBanDuration(["366d"]), null);
});

test("user IDs are safely extracted from IDs and mentions", () => {
  assert.equal(cleanUserId("123456789012345678"), "123456789012345678");
  assert.equal(cleanUserId("<@!123456789012345678>"), "123456789012345678");
  assert.equal(cleanUserId("not-a-user"), null);
});

test("legacy guild data gains required structures without losing records", () => {
  const legacy = {
    cases: [{ id: 9, reason: "kept" }],
    tickets: { old: "channel" },
    analytics: { joins: 4 }
  };
  const normalized = normalizeGuildData(legacy);

  assert.strictEqual(normalized, legacy);
  assert.equal(normalized.cases[0].reason, "kept");
  assert.equal(normalized.tickets.old, "channel");
  assert.equal(normalized.analytics.joins, 4);
  assert.equal(normalized.analytics.messages, 0);
  assert.deepEqual(normalized.ticketMeta, {});
  assert.deepEqual(normalized.tempBans, {});
  assert.equal(normalized.nextCaseId, 10);
});
