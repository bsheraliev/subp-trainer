/* ===========================================================================
   СУБП-тренажёр — сборка защиты «демо + лицензия» (как AvSec/AvEng).
   Из мастер-файла questions.src.js (локальный, не публикуется) делает:
     • questions.js    — ПУБЛИЧНЫЙ пробник: все CATEGORIES + вопросы только SAMPLE_CATS
                         (остальные темы пустые → в UI показываются под замком)
     • data.full.enc   — ПУБЛИЧНЫЙ шифр полной базы (AES-256-GCM); без ключа бесполезен
     • .subp-fullkey   — ключ AES (gitignore). Вставить в ОБЩИЙ GAS как SUBP_KEY.
   Полный открытый текст всех вопросов в публичный репозиторий не попадает.
   Запуск:  node build.mjs   (или "C:\Program Files\nodejs\node.exe" build.mjs)
   =========================================================================== */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const SRC = path.join(ROOT, "questions.src.js");

/* --- Пробник: какие категории отдаём публично. Общий блок (основы СУБП для всех)
       + вводный HF. Меняйте набор под нужную «глубину» витрины. --- */
const SAMPLE_CATS = ["general", "hf_model"];

/* --- Ключ полной базы (AES-256). Секрет, стабилен между сборками. --- */
const KEY_FILE = path.join(ROOT, ".subp-fullkey");
let FULL_KEY;
if (process.env.SUBP_KEY) FULL_KEY = Buffer.from(process.env.SUBP_KEY, "base64");
else if (fs.existsSync(KEY_FILE)) FULL_KEY = Buffer.from(fs.readFileSync(KEY_FILE, "utf8").trim(), "base64");
else { FULL_KEY = crypto.randomBytes(32); fs.writeFileSync(KEY_FILE, FULL_KEY.toString("base64"), "utf8"); }

function aesEnc(jsonStr, key) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(Buffer.from(jsonStr, "utf8")), c.final()]);
  return Buffer.concat([iv, ct, c.getAuthTag()]).toString("base64");
}

if (!fs.existsSync(SRC)) { console.error("НЕТ questions.src.js рядом с build.mjs"); process.exit(1); }
const { CATEGORIES, QUESTIONS } = Function(fs.readFileSync(SRC, "utf8") + "\nreturn { CATEGORIES, QUESTIONS };")();
const cats = Object.keys(QUESTIONS);
const total = cats.reduce((n, k) => n + QUESTIONS[k].length, 0);

/* --- Пробник → questions.js: все категории, вопросы только у SAMPLE_CATS (иначе []) --- */
const demoQ = {};
for (const k of cats) demoQ[k] = SAMPLE_CATS.includes(k) ? QUESTIONS[k] : [];
const sampleCount = SAMPLE_CATS.reduce((n, k) => n + (QUESTIONS[k] ? QUESTIONS[k].length : 0), 0);
const js =
`/* СУБП-тренажёр — ПУБЛИЧНЫЙ пробник (${sampleCount} из ${total} вопросов). Полная база — по лицензии организации.
   Контент защищён авторским правом. Мастер для правок — локальный questions.src.js (не публикуется). */
const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 0)};
const QUESTIONS = ${JSON.stringify(demoQ)};
window.CATEGORIES = CATEGORIES; window.QUESTIONS = QUESTIONS;
var SAMPLE_CATS = ${JSON.stringify(SAMPLE_CATS)};
`;
fs.writeFileSync(path.join(ROOT, "questions.js"), js, "utf8");

/* --- Полная база → публичный AES-шифр data.full.enc --- */
const fullEnc = aesEnc(JSON.stringify({ questions: QUESTIONS }), FULL_KEY);
fs.writeFileSync(path.join(ROOT, "data.full.enc"), fullEnc, "utf8");

console.log("✔ questions.js — пробник:", sampleCount, "из", total, "вопр. (темы:", SAMPLE_CATS.join(", ") + ")");
console.log("✔ data.full.enc — полная база", total, "вопр., AES-256-GCM,", Math.round(fullEnc.length / 1024), "КБ");
console.log("✔ Ключ AES (base64) — вставьте в ОБЩИЙ GAS как SUBP_KEY:", FULL_KEY.toString("base64"));
