/* VIR — page « Me tester »
   Lit window.VIR_QUIZ (questions.js). Trois écrans : choix → questions → résultat.
   Seul le meilleur score par périmètre est gardé dans le navigateur (localStorage). */
(() => {
  "use strict";
  const DATA = window.VIR_QUIZ;
  const BEST_KEY = "vir-quiz-best";
  const LETTERS = ["A", "B", "C", "D"];
  const $ = (id) => document.getElementById(id);
  const screens = { setup: $("quiz-setup"), play: $("quiz-play"), result: $("quiz-result") };
  if (!DATA || !screens.setup) return;

  let scope = "all";
  let session = null;

  /* ---------- Utilitaires ---------- */
  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const inScope = (key) => DATA.questions.filter((q) => key === "all" || String(q.module) === key);
  const readBest = () => {
    try { return JSON.parse(localStorage.getItem(BEST_KEY) || "{}") || {}; } catch (e) { return {}; }
  };
  const saveBest = (key, score, total) => {
    try {
      const best = readBest();
      const old = best[key];
      if (!old || score / total > old.score / old.total) {
        best[key] = { score, total };
        localStorage.setItem(BEST_KEY, JSON.stringify(best));
      }
    } catch (e) { /* stockage indisponible : on ignore */ }
  };
  /* Anti-triche : pendant le test, les liens de navigation sont grisés et inactifs. */
  const LOCKABLE = ".sidebar a, .topbar a, .page-footer a";
  const isCurrent = (a) => a.getAttribute("aria-current") === "page";
  const setLocked = (on) => {
    document.body.classList.toggle("quiz-locked", on);
    document.querySelectorAll(LOCKABLE).forEach((a) => {
      if (isCurrent(a)) return;
      if (on) { a.setAttribute("aria-disabled", "true"); a.tabIndex = -1; }
      else { a.removeAttribute("aria-disabled"); a.removeAttribute("tabindex"); }
    });
    window.onbeforeunload = on ? () => "" : null;
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest(LOCKABLE);
    if (a && document.body.classList.contains("quiz-locked") && !isCurrent(a)) e.preventDefault();
  }, true);

  const show = (name) => {
    Object.keys(screens).forEach((k) => { screens[k].hidden = k !== name; });
    setLocked(name === "play");
    window.scrollTo({ top: 0 });
  };
  const el = (tag, className, text) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  /* ---------- Écran 1 : choix du périmètre ---------- */
  function renderSetup() {
    const grid = $("scope-grid");
    const best = readBest();
    grid.innerHTML = "";
    const scopes = [{ key: "all", title: "Tous les modules", sub: "Révision complète" }]
      .concat(Object.keys(DATA.modules).map((m) => ({ key: m, title: "Module " + m.padStart(2, "0"), sub: DATA.modules[m] })));
    scopes.forEach((s) => {
      const count = inScope(s.key).length;
      const b = el("button", "scope-btn");
      b.type = "button";
      b.setAttribute("aria-pressed", String(s.key === scope));
      b.append(el("strong", "", s.title), el("span", "", s.sub));
      const meta = count + " questions" + (best[s.key] ? " · meilleur score " + best[s.key].score + "/" + best[s.key].total : "");
      b.append(el("small", "", meta));
      b.addEventListener("click", () => { scope = s.key; renderSetup(); });
      grid.append(b);
    });
    show("setup");
  }

  /* ---------- Écran 2 : questions ---------- */
  function start(questions, retry) {
    session = {
      retry: !!retry,
      scope,
      items: shuffle(questions).map((q) => ({
        q,
        options: shuffle(q.options.map((text, i) => ({ text, correct: i === q.answer })))
      })),
      index: 0, score: 0, missed: [], locked: false
    };
    // La bonne réponse ne reste jamais à la même lettre d’une question à la suivante.
    const pos = (it) => it.options.findIndex((o) => o.correct);
    for (let i = 1; i < session.items.length; i++) {
      const cur = session.items[i];
      const p = pos(cur);
      if (p === pos(session.items[i - 1])) {
        const j = (p + 1 + Math.floor(Math.random() * 3)) % 4;
        [cur.options[p], cur.options[j]] = [cur.options[j], cur.options[p]];
      }
    }
    renderQuestion();
  }

  function renderQuestion() {
    const s = session;
    const item = s.items[s.index];
    $("quiz-count").textContent = "Question " + (s.index + 1) + " sur " + s.items.length;
    $("quiz-module").textContent = "Module " + String(item.q.module).padStart(2, "0") + " · " + DATA.modules[item.q.module];
    $("quiz-bar").style.width = (s.index / s.items.length) * 100 + "%";
    $("quiz-question").textContent = item.q.question;
    const list = $("quiz-options");
    list.innerHTML = "";
    item.options.forEach((opt, i) => {
      const b = el("button", "option");
      b.type = "button";
      b.append(el("span", "key", LETTERS[i]), el("span", "", opt.text));
      b.addEventListener("click", () => pick(i));
      list.append(b);
    });
    $("quiz-feedback").hidden = true;
    $("quiz-next").hidden = true;
    s.locked = false;
    show("play");
  }

  function pick(i) {
    const s = session;
    if (s.locked) return;
    s.locked = true;
    const item = s.items[s.index];
    const ok = item.options[i].correct;
    if (ok) s.score++; else s.missed.push(item.q);
    [...$("quiz-options").children].forEach((b, n) => {
      b.disabled = true;
      if (item.options[n].correct) b.classList.add("is-correct");
      else if (n === i) b.classList.add("is-wrong");
      else b.classList.add("is-dim");
    });
    const fb = $("quiz-feedback");
    fb.className = "feedback " + (ok ? "is-ok" : "is-ko");
    fb.innerHTML = "";
    fb.append(el("strong", "", ok ? "Bonne réponse" : "Mauvaise réponse"), el("p", "", item.q.explanation));
    fb.hidden = false;
    const next = $("quiz-next");
    next.textContent = s.index === s.items.length - 1 ? "Voir mon résultat" : "Question suivante";
    next.hidden = false;
    next.focus();
  }

  function next() {
    session.index++;
    if (session.index >= session.items.length) renderResult(); else renderQuestion();
  }

  /* ---------- Écran 3 : résultat ---------- */
  function renderResult() {
    const s = session;
    const total = s.items.length;
    const pct = Math.round((s.score / total) * 100);
    if (!s.retry) saveBest(s.scope, s.score, total);
    $("result-score").textContent = s.score + " / " + total;
    $("result-pct").textContent = pct + " % de bonnes réponses";
    $("result-msg").textContent = pct === 100 ? "Sans faute. La doctrine est acquise."
      : pct >= 80 ? "Très bon niveau. Relisez les points manqués pour verrouiller."
      : pct >= 50 ? "Des bases solides, mais certains points sont à revoir."
      : "Retournez sur les modules concernés avant de retenter.";

    const byModule = $("result-modules");
    byModule.innerHTML = "";
    if (s.scope === "all" && !s.retry) {
      Object.keys(DATA.modules).forEach((m) => {
        const n = s.items.filter((it) => String(it.q.module) === m).length;
        const wrong = s.missed.filter((q) => String(q.module) === m).length;
        const li = el("li");
        li.append(el("span", "", DATA.modules[m]), el("strong", "", (n - wrong) + " / " + n));
        byModule.append(li);
      });
    }
    byModule.hidden = !byModule.children.length;

    const box = $("result-missed");
    const list = $("result-missed-list");
    list.innerHTML = "";
    s.missed.forEach((q) => {
      const li = el("li");
      li.append(el("strong", "", q.question), el("span", "", "Bonne réponse : " + q.options[q.answer]));
      list.append(li);
    });
    box.hidden = !s.missed.length;
    $("retry-missed").hidden = !s.missed.length;
    show("result");
  }

  /* ---------- Événements ---------- */
  $("start-btn").addEventListener("click", () => start(inScope(scope), false));
  $("quiz-next").addEventListener("click", next);
  $("quit-btn").addEventListener("click", () => {
    if (window.confirm("Quitter le test ? Ta progression sera perdue.")) renderSetup();
  });
  $("retry-missed").addEventListener("click", () => start(session.missed, true));
  $("restart-btn").addEventListener("click", () => start(inScope(session.scope), false));
  $("change-btn").addEventListener("click", renderSetup);
  document.addEventListener("keydown", (e) => {
    if (screens.play.hidden || !session || session.locked) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) pick(n - 1);
  });

  renderSetup();
})();