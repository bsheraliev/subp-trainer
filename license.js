/* ===========================================================================
   СУБП-тренажёр — клиентский слой лицензии (грузится МЕЖДУ questions.js и app.js).
   Аноним видит пробник (SAMPLE_CATS). По коду организации ОБЩИЙ бэкенд (app=subp)
   отдаёт ключ AES → берём публичный data.full.enc и расшифровываем полную базу
   вопросов; сливаем в window.QUESTIONS; кэш → офлайн, TTL.
   Ключа в статических файлах нет — он приходит с сервера после проверки лицензии.
   =========================================================================== */
(function () {
  var LIC_KEY = "subp_license_v1";
  var GAS_URL = "https://script.google.com/macros/s/AKfycbzzPC5DZm_c36DIjrT5yaxhlEgheqq8U-KO_fgNhskpJ27h6a5j-9mfaqR9xIbHsLnIYw/exec";
  var ENC_URL = "./data.full.enc";
  var APP = "subp";

  function b64ToBytes(b64) { var s = atob(b64), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }

  function decryptFull(encB64, keyB64) {
    var raw = b64ToBytes(encB64), key = b64ToBytes(keyB64);
    var iv = raw.slice(0, 12), body = raw.slice(12);
    return crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["decrypt"])
      .then(function (ck) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, ck, body); })
      .then(function (buf) { return JSON.parse(new TextDecoder().decode(new Uint8Array(buf))); });
  }

  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function loadCache() { try { return JSON.parse(localStorage.getItem(LIC_KEY) || "null"); } catch (e) { return null; } }
  function saveCache(o) { try { localStorage.setItem(LIC_KEY, JSON.stringify(o)); } catch (e) {} }
  function clearCache() { try { localStorage.removeItem(LIC_KEY); } catch (e) {} }

  var full = false, org = "", expires = "";

  /* Слить полную базу вопросов в window.QUESTIONS (по категориям) */
  function applyFull(questions) {
    if (!window.QUESTIONS || !questions) return;
    for (var k in questions) { if (Array.isArray(questions[k]) && questions[k].length) window.QUESTIONS[k] = questions[k]; }
    full = true;
  }

  /* При старте (СИНХРОННО): валидный кэш хранит уже открытую базу → сразу сливаем. */
  (function initFromCache() {
    var c = loadCache();
    if (!c || !c.questions) return;
    if (c.expires && todayStr() > c.expires) { clearCache(); return; }
    applyFull(c.questions); org = c.org || ""; expires = c.expires || "";
  })();

  function unlock(code) {
    code = String(code || "").trim();
    if (!code) return Promise.resolve({ ok: false, error: "empty" });
    var meta;
    return fetch(GAS_URL + "?action=unlock&app=" + APP + "&code=" + encodeURIComponent(code))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw { soft: true, error: (res && res.error) || "invalid", expires: res && res.expires };
        meta = res;
        return fetch(ENC_URL).then(function (r) { return r.text(); });
      })
      .then(function (encB64) { return decryptFull(encB64, meta.key); })
      .then(function (obj) {
        applyFull(obj.questions);
        org = meta.org || ""; expires = meta.expires || "";
        saveCache({ code: code, org: org, expires: expires, questions: obj.questions });
        var cnt = 0; for (var k in obj.questions) cnt += obj.questions[k].length;
        return { ok: true, org: org, expires: expires, count: cnt };
      })
      .catch(function (e) {
        if (e && e.soft) return { ok: false, error: e.error, expires: e.expires };
        return { ok: false, error: "network" };
      });
  }

  function deactivate() { clearCache(); full = false; org = ""; expires = ""; }

  var SAMPLE = (typeof window.SAMPLE_CATS !== "undefined") ? window.SAMPLE_CATS : [];
  window.SUBPLic = {
    isFull: function () { return full; },
    org: function () { return org; },
    expires: function () { return expires; },
    /* категория заблокирована, если мы в демо и её нет в пробнике
       (псевдо-разделы «Все вопросы»/«Экзамен» — __all/__exam — не блокируем) */
    locked: function (cat) { return !full && String(cat).charAt(0) !== "_" && SAMPLE.indexOf(cat) === -1; },
    unlock: unlock,
    deactivate: deactivate
  };
})();
