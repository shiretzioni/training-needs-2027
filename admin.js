/* צורכי הדרכה 2027 – מסך ניהול: כניסה, תמונת מצב והורדה לאקסל */
(function () {
  "use strict";

  const S = window.SURVEY;
  const C = window.CONFIG || {};
  const BASE = (C.supabaseUrl || "").replace(/\/$/, "");
  const TOKEN_KEY = "tna2027-admin-token";

  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else n.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null) n.append(kid);
    return n;
  };
  const screens = ["login", "dash", "not-configured"];
  const show = (id) => screens.forEach((s) => { $("#" + s).hidden = s !== id; });

  const getToken = () => { try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; } };
  const setToken = (t) => { try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ } };
  let memToken = null;

  let all = [];

  /* ---------- auth & data ---------- */
  async function login(email, password) {
    const res = await fetch(BASE + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: C.supabaseAnonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error("login");
    const j = await res.json();
    memToken = j.access_token; setToken(j.access_token);
  }

  async function load() {
    const token = memToken || getToken();
    if (!token) { show("login"); return; }
    $("#dash-status").textContent = "טוען…";
    const res = await fetch(BASE + "/rest/v1/responses?select=*&order=created_at.desc", {
      headers: { apikey: C.supabaseAnonKey, Authorization: "Bearer " + token }
    });
    if (res.status === 401 || res.status === 403) { setToken(null); memToken = null; show("login"); return; }
    if (!res.ok) { $("#dash-status").textContent = "הטעינה נכשלה. נסו לרענן."; return; }
    all = await res.json();
    show("dash");
    fillFilters();
    render();
    $("#dash-status").textContent = `עודכן ${new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
  }

  /* ---------- filters ---------- */
  function fillFilters() {
    const fill = (sel, values, allLabel) => {
      const cur = sel.value;
      sel.replaceChildren(el("option", { value: "", text: allLabel }), ...values.map((v) => el("option", { value: v, text: v })));
      sel.value = values.includes(cur) ? cur : "";
    };
    fill($("#flt-dept"), [...new Set(all.map((r) => r.dept))].sort((a, b) => a.localeCompare(b, "he")), "כל המחלקות");
    fill($("#flt-level"), [...new Set(all.map((r) => r.level).filter(Boolean))], "כל הדרגים");
  }
  const filtered = () => all.filter((r) =>
    (!$("#flt-dept").value || r.dept === $("#flt-dept").value) &&
    (!$("#flt-level").value || r.level === $("#flt-level").value));

  /* ---------- helpers ---------- */
  const stepOf = (type) => S.steps.filter((s) => s.type === type);
  const themeLabel = Object.fromEntries(S.themes.map((t) => [t.id, t.label]));

  function bars(host, rows, fmt) {
    rows = rows.filter((r) => r.v > 0).sort((a, b) => b.v - a.v);
    const max = Math.max(1, ...rows.map((r) => r.v));
    host.replaceChildren(...(rows.length ? rows.map((r) => {
      const i = el("i"); i.style.width = Math.round((r.v / max) * 100) + "%";
      return el("li", {}, el("bdi", { dir: /^\d/.test(r.k) ? "ltr" : "auto", text: r.k }), el("span", { class: "num", text: fmt ? fmt(r.v) : String(r.v) }), el("span", { class: "bar" }, i));
    }) : [el("li", {}, el("span", { class: "fine", text: "אין עדיין נתונים" }))]));
  }

  /* ---------- render ---------- */
  function render() {
    const rs = filtered();
    $("#flt-note").textContent = rs.length !== all.length ? `מוצגות ${rs.length} מתוך ${all.length}` : "";

    const people = new Set(rs.map((r) => (r.name || "").trim() + "|" + r.dept)).size;
    const depts = new Set(rs.map((r) => r.dept)).size;
    const withText = rs.filter((r) => textAnswers(r).length).length;
    $("#kpis").replaceChildren(
      ...[[rs.length, "תשובות"], [people, "מנהלים שונים"], [depts, "מחלקות"], [withText, "כתבו צורך במילים שלהם"]]
        .map(([n, l]) => el("div", { class: "kpi" }, el("b", { text: String(n) }), el("span", { text: l })))
    );

    // broad: average normalized theme intensity (each response scaled to its own max)
    const sums = Object.fromEntries(S.themes.map((t) => [t.id, 0]));
    rs.forEach((r) => {
      const sc = r.theme_scores || {};
      const m = Math.max(1, ...Object.values(sc));
      S.themes.forEach((t) => { sums[t.id] += (sc[t.id] || 0) / m; });
    });
    bars($("#p-themes"), S.themes.map((t) => ({ k: t.label, v: rs.length ? sums[t.id] / rs.length : 0 })), (v) => Math.round(v * 100) + "%");

    const f1 = {};
    rs.forEach((r) => { const f = (r.focus || [])[0]; if (f) f1[f] = (f1[f] || 0) + 1; });
    bars($("#p-focus1"), Object.entries(f1).map(([k, v]) => ({ k, v })));

    // specific items
    const tok = stepOf("tokens")[0], pick = stepOf("pick")[0], sw = stepOf("swipe")[0], multi = stepOf("multi")[0];
    const A = (r, id) => (r.answers || {})[id];
    if (tok) bars($("#p-team"), tok.items.map((it) => ({ k: it.label, v: rs.reduce((a, r) => a + ((A(r, tok.id) || {})[it.id] || 0), 0) })));
    if (pick) bars($("#p-me"), pick.items.map((it) => ({ k: it.label, v: rs.filter((r) => (A(r, pick.id) || []).includes(it.id)).length })));
    if (sw) bars($("#p-reality"), sw.items.map((it) => ({ k: it.text, v: rs.filter((r) => (A(r, sw.id) || {})[it.id] === "yes").length })));
    if (multi) bars($("#p-how"), multi.groups.flatMap((g) => g.items.map((it) => ({
      k: it.label, v: rs.filter((r) => ((A(r, multi.id) || {})[g.id] || []).includes(it.id)).length
    }))));

    $("#p-quotes").replaceChildren(...(rs.flatMap((r) => textAnswers(r).map((t) =>
      el("li", {}, t.text, el("small", { text: `${r.name} · ${r.dept} · ${t.label}` }))
    )) || []));
    if (!$("#p-quotes").children.length) $("#p-quotes").append(el("li", { class: "fine", text: "אין עדיין תשובות פתוחות" }));

    $("#rows").replaceChildren(...rs.map((r) => el("tr", {},
      el("td", { class: "date", text: fmtDate(r.created_at) }),
      el("td", { text: r.name }), el("td", { text: r.dept }), el("td", { text: r.level || "" }),
      el("td", { text: (r.focus || []).join(" · ") })
    )));
  }

  function textAnswers(r) {
    return stepOf("text").flatMap((s) => s.fields.map((f) => ({ label: f.label, text: (((r.answers || {})[s.id] || {})[f.id] || "").trim() })))
      .filter((t) => t.text);
  }
  const fmtDate = (d) => d ? new Date(d).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

  /* ---------- CSV ---------- */
  function csv() {
    const cols = [
      ["תאריך", (r) => fmtDate(r.created_at)],
      ["שם", (r) => r.name], ["מחלקה", (r) => r.dept], ["דרג", (r) => r.level], ["גרסה", (r) => r.version],
      ["מוקד 1", (r) => (r.focus || [])[0]], ["מוקד 2", (r) => (r.focus || [])[1]], ["מוקד 3", (r) => (r.focus || [])[2]],
      ...S.themes.map((t) => ["ציון: " + t.label, (r) => (r.theme_scores || {})[t.id] || 0])
    ];
    const swLabel = { yes: "זה אני", some: "קצת", no: "לא ממש" };
    for (const s of S.steps) {
      const A = (r) => (r.answers || {})[s.id];
      if (s.type === "tokens") s.items.forEach((it) => cols.push([`${s.label}: ${it.label}`, (r) => (A(r) || {})[it.id] || 0]));
      if (s.type === "pick") s.items.forEach((it) => cols.push([`${s.label}: ${it.label}`, (r) => (A(r) || []).includes(it.id) ? 1 : 0]));
      if (s.type === "swipe") s.items.forEach((it) => cols.push([it.text, (r) => swLabel[(A(r) || {})[it.id]] || ""]));
      if (s.type === "multi") s.groups.forEach((g) => g.items.forEach((it) =>
        cols.push([`${g.title.replace(/\s*\(.*\)$/, "")}: ${it.label}`, (r) => ((A(r) || {})[g.id] || []).includes(it.id) ? 1 : 0])));
      if (s.type === "text") s.fields.forEach((f) => cols.push([f.label, (r) => (A(r) || {})[f.id] || ""]));
    }
    const q = (v) => {
      const t = v == null ? "" : String(v);
      return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    };
    const lines = [cols.map((c) => q(c[0])).join(",")].concat(filtered().map((r) => cols.map((c) => q(c[1](r))).join(",")));
    return "﻿" + lines.join("\r\n");
  }

  function download() {
    const blob = new Blob([csv()], { type: "text/csv;charset=utf-8" });
    const a = el("a", { href: URL.createObjectURL(blob), download: `צורכי-הדרכה-2027-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- wiring ---------- */
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#login-error");
    err.hidden = true;
    try { await login($("#l-email").value.trim(), $("#l-pass").value); $("#l-pass").value = ""; await load(); }
    catch (x) { err.textContent = "המייל או הסיסמה לא נכונים, או שאין חיבור למאגר."; err.hidden = false; }
  });
  $("#btn-refresh").addEventListener("click", load);
  $("#btn-csv").addEventListener("click", download);
  $("#btn-logout").addEventListener("click", () => { setToken(null); memToken = null; all = []; show("login"); });
  $("#flt-dept").addEventListener("change", render);
  $("#flt-level").addEventListener("change", render);

  if (!BASE || !C.supabaseAnonKey) show("not-configured");
  else load().catch(() => show("login"));
})();
