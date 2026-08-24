#!/usr/bin/env node
// Readeck API 封装（article-triage 技能用）
// 用法:
//   node readeck.mjs find <url>                        # 按 URL 查重，输出匹配书签 JSON
//   node readeck.mjs add <url> --title T --labels "a,b" # 创建书签（异步），输出 202 信息
//   node readeck.mjs note <id> "备注内容"               # 更新备注（存摘要+评分+理由）
//   node readeck.mjs delete <id>                       # 删除书签
//   node readeck.mjs list --label 标签 [--since 7d]     # 按标签/时间列书签（校准用）
// 凭据: 环境变量 READECK_URL / READECK_TOKEN，或 ~/.hermes/.env

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(os.homedir(), ".hermes", ".env");
  try {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim();
      if (k && v && !(k in env)) env[k] = v;
    }
  } catch {}
  return env;
}

const env = loadEnv();
const BASE = (env.READECK_URL || "").replace(/\/$/, "");
const TOKEN = env.READECK_TOKEN || "";

if (!BASE) {
  console.error("缺少 READECK_URL（~/.hermes/.env 或环境变量）");
  process.exit(1);
}
if (!TOKEN) {
  console.error("缺少 READECK_TOKEN（~/.hermes/.env 或环境变量）");
  process.exit(1);
}

const [, , cmd, ...rest] = process.argv;
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

function parseArgs(args) {
  const out = { positionals: [], flags: {} };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const k = args[i].slice(2);
      out.flags[k] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
    } else {
      out.positionals.push(args[i]);
    }
  }
  return out;
}

function parseResponse(text, status) {
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (status >= 400 && status !== 202 && status !== 204) {
    console.error(`API ${status}: ${String(text).slice(0, 300)}`);
    process.exit(1);
  }
  return { status, data };
}

async function api(path, opts = {}) {
  const url = `${BASE}${path}`;
  const method = opts.method || "GET";
  // 1) 优先原生 fetch
  try {
    const res = await fetch(url, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
    const text = await res.text();
    return parseResponse(text, res.status);
  } catch {
    // 2) fetch 失败（受限环境）→ 回退 curl
    const args = ["-s", "-w", "\n%{http_code}", "-X", method, "-H", `Authorization: Bearer ${TOKEN}`];
    if (opts.body) { args.push("-H", "Content-Type: application/json", "-d", opts.body); }
    args.push(url);
    try {
      const out = execFileSync("curl", args, { encoding: "utf8" });
      const m = out.trim().match(/^(.*)\n(\d{3})$/s);
      const text = m ? m[1] : out;
      const status = m ? Number(m[2]) : 0;
      return parseResponse(text, status || 200);
    } catch (e) {
      console.error("API 请求失败（fetch 与 curl 均不可用）:", e.message);
      process.exit(1);
    }
  }
}

async function main() {
  const a = parseArgs(rest);
  switch (cmd) {
    case "find": {
      const url = a.positionals[0];
      if (!url) { console.error("用法: find <url>"); process.exit(1); }
      const { data } = await api(`/api/bookmarks?url=${encodeURIComponent(url)}`);
      console.log(JSON.stringify(data ?? [], null, 2));
      break;
    }
    case "add": {
      const url = a.positionals[0];
      if (!url) { console.error("用法: add <url> --title T --labels a,b"); process.exit(1); }
      const body = { url };
      if (a.flags.title) body.title = a.flags.title;
      if (a.flags.labels) body.labels = String(a.flags.labels).split(",").map((s) => s.trim()).filter(Boolean);
      const { status, data } = await api("/api/bookmarks", { method: "POST", body: JSON.stringify(body) });
      // 可选 --note：POST 后轮询找到书签，PATCH 写入备注（一步完成，省一次调用）
      if (a.flags.note) {
        for (let i = 0; i < 6; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const found = await api(`/api/bookmarks?url=${encodeURIComponent(url)}`);
          const list = Array.isArray(found.data) ? found.data : [];
          if (list.length > 0) {
            await api(`/api/bookmarks/${list[0].id}`, { method: "PATCH", body: JSON.stringify({ note: String(a.flags.note) }) });
            console.log(`HTTP ${status}: added + note written (id=${list[0].id})`);
            process.exit(0);
          }
        }
        console.log("HTTP 202: submitted, but note write timed out — 可稍后用 note 命令补写");
        process.exit(0);
      }
      console.log(`HTTP ${status}: ${data?.message || JSON.stringify(data)}`);
      break;
    }
    case "note": {
      const id = a.positionals[0];
      const note = a.positionals.slice(1).join(" ") || a.flags.text;
      if (!id || !note) { console.error("用法: note <id> <备注内容>"); process.exit(1); }
      const { status } = await api(`/api/bookmarks/${id}`, { method: "PATCH", body: JSON.stringify({ note }) });
      console.log(`HTTP ${status}: note updated`);
      break;
    }
    case "delete": {
      const id = a.positionals[0];
      if (!id) { console.error("用法: delete <id>"); process.exit(1); }
      const { status } = await api(`/api/bookmarks/${id}`, { method: "DELETE" });
      console.log(`HTTP ${status}: deleted`);
      break;
    }
    case "list": {
      const label = a.flags.label;
      const since = a.flags.since;
      let url = "/api/bookmarks?limit=50";
      if (since) url += `&since=${encodeURIComponent(since)}`;
      let { data } = await api(url);
      if (label) data = (data || []).filter((b) => (b.labels || []).includes(label));
      console.log(JSON.stringify(data ?? [], null, 2));
      break;
    }
    default:
      console.error("未知命令:", cmd, "（支持 find/add/note/delete/list）");
      process.exit(1);
  }
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
