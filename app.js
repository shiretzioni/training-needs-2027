/* צורכי הדרכה 2027 – לוגיקת השאלון. התוכן עצמו נמצא ב-questions.js */
(function () {
  "use strict";

  const S = window.SURVEY;
  const C = window.CONFIG || {};
  const DRAFT_KEY = "tna2027-draft-" + S.version;

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null) n.append(kid);
    return n;
  };

  // labels that start with a digit (time slots) read left-to-right
  const ltrIfNum = (t) => (/^\d/.test(t) ? "ltr" : null);

  /* ---------- state ---------- */
  function emptyAnswers() {
    const a = {};
    for (const step of S.steps) {
      if (step.type === "tokens") a[step.id] = {};
      else if (step.type === "pick") a[step.id] = [];
      else if (step.type === "swipe") a[step.id] = {};
      else if (step.type === "multi") a[step.id] = Object.fromEntries(step.groups.map((g) => [g.id, []]));
      else if (step.type === "text") a[step.id] = {};
    }
    return a;
  }

  let state = { name: "", dept: "", step: 0, answers: emptyAnswers() };

  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      state = Object.assign(state, d, { answers: Object.assign(emptyAnswers(), d.answers || {}) });
    } catch (e) { /* ignore */ }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
  }

  /* ---------- screens ---------- */
  function show(name) {
    document.querySelectorAll(".screen").forEach((s) => { s.hidden = s.dataset.screen !== name; });
    window.scrollTo({ top: 0, behavior: "smooth" });
    const h = document.querySelector(`[data-screen="${name}"] h1, [data-screen="${name}"] h2`);
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  /* ---------- intro ---------- */
  $("#meta-minutes").textContent = S.minutes;
  $("#meta-steps").textContent = S.steps.length;
  $("#btn-start").addEventListener("click", () => { fillDetails(); show("details"); });

  /* ---------- details ---------- */
  function fillDetails() {
    $("#f-name").value = state.name;
    $("#f-dept").value = state.dept;
  }
  $("#details-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.name = $("#f-name").value.trim();
    state.dept = $("#f-dept").value.trim();
    const err = $("#details-error");
    const missing = [];
    if (!state.name) missing.push("שם");
    if (!state.dept) missing.push("מחלקה");
    if (missing.length) {
      err.textContent = "חסר: " + missing.join(", ");
      err.hidden = false;
      return;
    }
    err.hidden = true;
    saveDraft();
    state.step = Math.min(state.step, S.steps.length - 1);
    renderStep();
    show("diag");
  });

  /* ---------- diagnosis ---------- */
  const host = $("#step-host");
  const stepErr = $("#step-error");

  function renderHud() {
    const track = $("#hud-track");
    track.style.setProperty("--n", S.steps.length);
    track.replaceChildren(...S.steps.map((s, i) =>
      el("li", { class: i < state.step ? "done" : i === state.step ? "current" : "", "aria-current": i === state.step ? "step" : null },
        el("span", { class: "hud-bar" }, el("i")),
        el("span", { class: "hud-label", text: s.label })
      )
    ));
  }

  function stepHead(step) {
    return el("div", { class: "step-head" },
      el("span", { class: "step-count mono", text: `שלב ${state.step + 1} מתוך ${S.steps.length} · ${step.label}` }),
      el("h2", { class: "screen-title", text: step.title }),
      step.prompt ? el("p", { class: "lead", text: step.prompt }) : null
    );
  }

  const renderers = {
    tokens(step, ans) {
      const used = Object.values(ans).reduce((a, b) => a + b, 0);
      const left = step.max - used;
      const meter = el("div", { class: "energy", role: "status", "aria-live": "polite" },
        el("div", { class: "energy-cells", "aria-hidden": "true" },
          Array.from({ length: step.max }, (_, i) => el("span", { class: i < used ? "used" : "" }))),
        el("span", { class: "energy-text", text: left === 0 ? "כל הנקודות חולקו" : `נשארו ${left} מתוך ${step.max}` })
      );
      const cards = el("div", { class: "cards" }, step.items.map((it) => {
        const v = ans[it.id] || 0;
        const change = (d) => {
          const next = v + d;
          if (next < 0 || next > step.cap || (d > 0 && left <= 0)) return;
          if (next === 0) delete ans[it.id]; else ans[it.id] = next;
          saveDraft(); renderStep(`[data-item="${it.id}"] .step-btn.${d > 0 ? "plus" : "minus"}`);
        };
        return el("div", { class: "card" + (v ? " active" : ""), "data-item": it.id },
          el("span", { class: "card-label", text: it.label }),
          el("div", { class: "stepper" },
            el("button", { type: "button", class: "step-btn minus", "aria-label": `הפחתת נקודה מ${it.label}`, disabled: v === 0, onclick: () => change(-1), text: "−" }),
            el("span", { class: "pips", "aria-label": `${v} נקודות` }, Array.from({ length: step.cap }, (_, i) => el("span", { class: i < v ? "on" : "" }))),
            el("button", { type: "button", class: "step-btn plus", "aria-label": `הוספת נקודה ל${it.label}`, disabled: v >= step.cap || left <= 0, onclick: () => change(1), text: "+" })
          )
        );
      }));
      return [meter, cards];
    },

    pick(step, ans) {
      const full = ans.length >= step.max;
      const counter = el("p", { class: "fine mono", role: "status", text: `נבחרו ${ans.length} מתוך ${step.max}` });
      const cards = el("div", { class: "cards" }, step.items.map((it) => {
        const on = ans.includes(it.id);
        return el("button", {
          type: "button", class: "card" + (!on && full ? " dim" : ""), "aria-pressed": String(on), "data-item": it.id,
          onclick: () => {
            if (on) ans.splice(ans.indexOf(it.id), 1);
            else if (!full) ans.push(it.id);
            else return;
            saveDraft(); renderStep(`[data-item="${it.id}"]`);
          }
        }, el("span", { class: "card-label", text: it.label }));
      }));
      return [counter, cards];
    },

    swipe(step, ans) {
      const opts = [["yes", "זה אני"], ["some", "קצת"], ["no", "לא ממש"]];
      return el("div", { class: "swipes" }, step.items.map((it) =>
        el("div", { class: "swipe" },
          el("p", { class: "swipe-text", id: "sw-" + it.id, text: it.text }),
          el("div", { class: "swipe-opts", role: "radiogroup", "aria-labelledby": "sw-" + it.id },
            opts.map(([v, label]) => el("button", {
              type: "button", class: "swipe-opt", role: "radio", "data-v": v, "data-item": it.id + "-" + v,
              "aria-checked": String(ans[it.id] === v), text: label,
              onclick: () => { ans[it.id] = v; saveDraft(); renderStep(`[data-item="${it.id}-${v}"]`); }
            }))
          )
        )
      ));
    },

    multi(step, ans) {
      return step.groups.map((g) => {
        const sel = ans[g.id];
        const full = g.max > 0 && sel.length >= g.max;
        return el("div", { class: "group" },
          el("h3", { class: "group-title", text: g.title }),
          el("div", { class: "chips" }, g.items.map((it) => {
            const on = sel.includes(it.id);
            return el("button", {
              type: "button", class: "chip", "aria-pressed": String(on), "data-item": it.id,
              disabled: !on && full,
              onclick: () => {
                if (on) sel.splice(sel.indexOf(it.id), 1); else if (!full) sel.push(it.id);
                saveDraft(); renderStep(`[data-item="${it.id}"]`);
              }
            }, el("bdi", { dir: ltrIfNum(it.label), text: it.label }));
          }))
        );
      });
    },

    text(step, ans) {
      return step.fields.map((f) => el("div", { class: "field" },
        el("label", { for: "tx-" + f.id, text: f.label }),
        (() => {
          const t = el("textarea", { id: "tx-" + f.id, placeholder: f.placeholder || "", maxlength: "1000" });
          t.value = ans[f.id] || "";
          t.addEventListener("input", () => { ans[f.id] = t.value; saveDraft(); });
          return t;
        })()
      ));
    }
  };

  function validate(step, ans) {
    if (step.type === "tokens") {
      const used = Object.values(ans).reduce((a, b) => a + b, 0);
      if (used < step.max) return `נשארו עוד ${step.max - used} נקודות לחלק`;
    }
    if (step.type === "pick" && ans.length === 0) return "בחרו לפחות קלף אחד";
    if (step.type === "swipe") {
      const left = step.items.filter((it) => !ans[it.id]).length;
      if (left) return `נשארו ${left} משפטים בלי תשובה`;
    }
    if (step.type === "multi") {
      const g = step.groups.find((g) => ans[g.id].length === 0);
      if (g) return `בחרו לפחות אפשרות אחת ב"${g.title.replace(/\s*\(.*\)$/, "")}"`;
    }
    return "";
  }

  // refocus: selector of the control to keep focus on after re-render
  function renderStep(refocus) {
    const step = S.steps[state.step];
    const ans = state.answers[step.id];
    renderHud();
    host.replaceChildren(stepHead(step), ...[].concat(renderers[step.type](step, ans)));
    stepErr.hidden = true;
    $("#btn-next").textContent = state.step === S.steps.length - 1 ? "לסיכום שלי" : "יאללה ממשיכים";
    if (refocus) {
      const f = host.querySelector(refocus);
      if (f && !f.disabled) f.focus({ preventScroll: true });
    }
  }

  $("#btn-next").addEventListener("click", () => {
    const step = S.steps[state.step];
    const msg = validate(step, state.answers[step.id]);
    if (msg) { stepErr.textContent = msg; stepErr.hidden = false; return; }
    if (state.step < S.steps.length - 1) {
      state.step++; saveDraft(); renderStep(); show("diag");
    } else {
      renderSummary(); show("summary");
    }
  });
  $("#btn-back").addEventListener("click", () => {
    if (state.step === 0) { fillDetails(); show("details"); return; }
    state.step--; saveDraft(); renderStep(); show("diag");
  });

  /* ---------- analysis ---------- */
  const themeLabel = Object.fromEntries(S.themes.map((t) => [t.id, t.label]));

  function analyze() {
    const w = S.weights;
    const scores = Object.fromEntries(S.themes.map((t) => [t.id, 0]));
    const add = (th, n) => { if (th && th in scores) scores[th] += n; };
    for (const step of S.steps) {
      const ans = state.answers[step.id];
      if (step.type === "tokens") step.items.forEach((it) => add(it.theme, (ans[it.id] || 0) * w.tokens));
      if (step.type === "pick") step.items.forEach((it) => { if (ans.includes(it.id)) add(it.theme, w.pick); });
      if (step.type === "swipe") step.items.forEach((it) => {
        const v = ans[it.id];
        const n = v === "yes" ? w.swipeYes : v === "some" ? w.swipeSome : 0;
        (it.themes || [it.theme]).forEach((th) => add(th, n));
      });
    }
    const focus = S.themes.map((t) => t.id).filter((id) => scores[id] > 0)
      .sort((a, b) => scores[b] - scores[a]).slice(0, 3);
    return { scores, focus };
  }

  // readable lines for the summary screen, the downloaded file and the stored record
  function summaryRows() {
    const rows = [];
    for (const step of S.steps) {
      const ans = state.answers[step.id];
      if (step.type === "tokens") {
        const items = step.items.filter((it) => ans[it.id]).sort((a, b) => ans[b.id] - ans[a.id]);
        rows.push({ k: step.label, tags: items.map((it) => ({ t: it.label, n: ans[it.id] })) });
      } else if (step.type === "pick") {
        rows.push({ k: step.label, tags: step.items.filter((it) => ans.includes(it.id)).map((it) => ({ t: it.label })) });
      } else if (step.type === "swipe") {
        const yes = step.items.filter((it) => ans[it.id] === "yes").map((it) => ({ t: it.text }));
        const some = step.items.filter((it) => ans[it.id] === "some").map((it) => ({ t: it.text }));
        rows.push({ k: "זה אני", list: yes });
        if (some.length) rows.push({ k: "קצת אני", list: some });
      } else if (step.type === "multi") {
        step.groups.forEach((g) => rows.push({
          k: g.title.replace(/\s*\(.*\)$/, ""),
          tags: g.items.filter((it) => ans[g.id].includes(it.id)).map((it) => ({ t: it.label }))
        }));
      } else if (step.type === "text") {
        step.fields.forEach((f) => { if ((ans[f.id] || "").trim()) rows.push({ k: f.label, text: ans[f.id].trim() }); });
      }
    }
    return rows;
  }

  function radarSvg(scores, focus) {
    const NS = "http://www.w3.org/2000/svg";
    // wide viewBox leaves room for long Hebrew labels on the side axes
    const W = 540, H = 320, cx = W / 2, cy = H / 2 + 4, R = 105;
    const n = S.themes.length;
    const max = Math.max(1, ...Object.values(scores));
    const pt = (i, r) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "מכ\"ם צרכים: " + S.themes.map((t) => `${t.label} ${Math.round((scores[t.id] / max) * 100)}%`).join(", "));
    const mk = (tag, attrs) => {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      svg.append(e); return e;
    };
    [0.25, 0.5, 0.75, 1].forEach((f) => mk("polygon", { class: "r-grid", points: S.themes.map((_, i) => pt(i, R * f).join(",")).join(" ") }));
    S.themes.forEach((_, i) => { const [x, y] = pt(i, R); mk("line", { class: "r-axis", x1: cx, y1: cy, x2: x, y2: y }); });
    const vals = S.themes.map((t, i) => pt(i, R * Math.max(0.04, scores[t.id] / max)));
    mk("polygon", { class: "r-shape", points: vals.map((p) => p.join(",")).join(" ") });
    vals.forEach(([x, y]) => mk("circle", { class: "r-dot", cx: x, cy: y, r: 3.5 }));
    S.themes.forEach((t, i) => {
      const [x, y] = pt(i, R + 16);
      // labels are RTL text: "end" pushes text rightwards, "start" leftwards
      const anchor = x > cx + 6 ? "end" : x < cx - 6 ? "start" : "middle";
      const txt = mk("text", {
        class: "r-label" + (focus.includes(t.id) ? " top" : ""), x, y: y + (y < cy ? -2 : 10),
        "text-anchor": anchor, direction: "rtl"
      });
      txt.textContent = t.label;
    });
    return svg;
  }

  function renderSummary() {
    const { scores, focus } = analyze();
    const max = Math.max(1, ...Object.values(scores));
    $("#summary-title").textContent = `${state.name.split(" ")[0] || ""}, הנה הסיכום שלך`.replace(/^, /, "");
    $("#radar").replaceChildren(radarSvg(scores, focus));

    const fl = $("#focus-list");
    fl.replaceChildren(...(focus.length ? focus.map((id) => el("li", {},
      el("span", { class: "focus-name", text: themeLabel[id] }),
      el("span", { class: "focus-bar" }, (() => { const i = el("i"); i.style.width = Math.round((scores[id] / max) * 100) + "%"; return i; })())
    )) : [el("li", {}, el("p", { class: "empty-note", text: "לא עלה מוקד בולט. אפשר לחזור ולדייק." }))]));

    const dl = $("#summary-list");
    dl.replaceChildren(...summaryRows().map((r) => el("div", {},
      el("dt", { text: r.k }),
      el("dd", {},
        r.tags ? (r.tags.length ? r.tags.map((t) => el("span", { class: "tag" }, el("bdi", { dir: ltrIfNum(t.t), text: t.t }), t.n ? el("span", { class: "n", text: "×" + t.n }) : null)) : "—")
        : r.list ? (r.list.length ? el("div", {}, r.list.map((t) => el("div", { text: "• " + t.t }))) : "—")
        : r.text)
    )));
    $("#submit-status").textContent = "";
  }

  $("#btn-edit").addEventListener("click", () => { state.step = 0; renderStep(); show("diag"); });

  /* ---------- record, file, submit ---------- */
  function buildRecord() {
    const { scores, focus } = analyze();
    return {
      name: state.name,
      dept: state.dept,
      version: S.version,
      focus: focus.map((id) => themeLabel[id]),
      theme_scores: scores,
      answers: state.answers
    };
  }

  function summaryText() {
    const { focus } = analyze();
    const lines = [
      "צורכי הדרכה 2027 · סיכום אישי",
      "",
      `שם: ${state.name}`,
      `מחלקה: ${state.dept}`,
      `תאריך: ${new Date().toLocaleDateString("he-IL")}`,
      "",
      "מוקדי פיתוח: " + (focus.map((id, i) => `${i + 1}. ${themeLabel[id]}`).join("  ") || "—"),
      ""
    ];
    summaryRows().forEach((r) => {
      lines.push(r.k + ":");
      if (r.tags) lines.push("  " + (r.tags.map((t) => t.t + (t.n ? ` (${t.n})` : "")).join(", ") || "—"));
      else if (r.list) (r.list.length ? r.list : [{ t: "—" }]).forEach((t) => lines.push("  • " + t.t));
      else lines.push("  " + r.text);
    });
    lines.push("", "---", "נתונים גולמיים (לייבוא):", JSON.stringify(buildRecord()));
    return lines.join("\r\n");
  }

  function downloadSummary() {
    const blob = new Blob(["﻿" + summaryText()], { type: "text/plain;charset=utf-8" });
    const a = el("a", { href: URL.createObjectURL(blob), download: `צורכי-הדרכה-2027-${state.name || "מנהל"}.txt` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function send(record) {
    if (!C.supabaseUrl || !C.supabaseAnonKey) throw new Error("not-configured");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(C.supabaseUrl.replace(/\/$/, "") + "/rest/v1/responses", {
        method: "POST",
        headers: {
          apikey: C.supabaseAnonKey,
          Authorization: "Bearer " + C.supabaseAnonKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(record),
        signal: ctrl.signal
      });
      if (!res.ok) throw new Error("http-" + res.status);
    } finally { clearTimeout(timer); }
  }

  async function submit() {
    const btn = $("#btn-submit");
    const status = $("#submit-status");
    btn.disabled = true;
    status.textContent = "שולח…";
    let ok = false, notConfigured = false;
    try { await send(buildRecord()); ok = true; }
    catch (e) { notConfigured = e.message === "not-configured"; console.warn("submit failed:", e); }
    btn.disabled = false;
    status.textContent = "";

    $("#fallback").hidden = ok;
    $("#done-download-row").hidden = !ok;
    $("#done-mark").hidden = !ok;
    $("#done-text").textContent = ok
      ? "הסיכום שלך התקבל אצל צוות ההדרכה ויהיה חלק מבניית תכנית 2027."
      : notConfigured
        ? "זו תצוגה מקדימה: השאלון עוד לא מחובר למאגר, ולכן התשובות לא נשלחו."
        : "התשובות שלך עדיין לא הגיעו אלינו. אפשר לנסות שוב או לשלוח את הסיכום ידנית.";
    const contact = $("#contact-line");
    if (!ok && C.contactEmail) {
      $("#contact-name").textContent = C.contactName || "צוות ההדרכה";
      $("#contact-email").textContent = C.contactEmail;
      contact.hidden = false;
    } else contact.hidden = true;
    if (ok) clearDraft();
    show("done");
  }

  $("#btn-submit").addEventListener("click", submit);
  $("#btn-retry").addEventListener("click", () => { renderSummary(); show("summary"); submit(); });
  $("#btn-download").addEventListener("click", downloadSummary);
  $("#btn-download-copy").addEventListener("click", downloadSummary);
  $("#btn-copy").addEventListener("click", async (e) => {
    try { await navigator.clipboard.writeText(C.contactEmail); e.target.textContent = "הועתק"; }
    catch (err) {
      const r = document.createRange(); r.selectNodeContents($("#contact-email"));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  });

  /* ---------- boot ---------- */
  loadDraft();
  if (state.name) $("#btn-start").textContent = "בואו נמשיך מאיפה שעצרנו";
})();
