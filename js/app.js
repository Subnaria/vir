(() => {
  "use strict";

  const STORAGE_KEY = "vir-formation-v1";
  const moduleIds = ["1", "2", "3"];

  function readCompletedModules() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.map(String).filter((id) => moduleIds.includes(id)) : [];
    } catch (error) {
      return [];
    }
  }

  function updateProgress() {
    const completed = readCompletedModules();
    const percent = Math.round((completed.length / moduleIds.length) * 100);

    document.querySelectorAll("[data-progress-count]").forEach((node) => {
      node.textContent = String(completed.length);
    });
    document.querySelectorAll("[data-progress-percent], [data-nav-progress]").forEach((node) => {
      node.textContent = percent + "%";
    });
    document.querySelectorAll("[data-progress-bar]").forEach((bar) => {
      bar.style.width = percent + "%";
    });

    document.querySelectorAll("[data-complete-module]").forEach((button) => {
      const done = completed.includes(button.dataset.completeModule);
      const row = button.closest(".module-completion-row");
      button.setAttribute("aria-pressed", String(done));
      button.innerHTML = done
        ? 'Module maîtrisé <span>✓</span>'
        : 'Marquer comme maîtrisé <span>✓</span>';
      if (row) row.classList.toggle("is-complete", done);
    });

    document.querySelectorAll("[data-home-module]").forEach((card) => {
      const done = completed.includes(card.dataset.homeModule);
      const status = card.querySelector("[data-module-status]");
      card.classList.toggle("is-complete", done);
      if (status) status.textContent = done ? "Maîtrisé" : "À découvrir";
    });
  }

  document.querySelectorAll("[data-complete-module]").forEach((button) => {
    button.addEventListener("click", () => {
      const completed = readCompletedModules();
      const id = button.dataset.completeModule;
      const next = completed.includes(id)
        ? completed.filter((item) => item !== id)
        : completed.concat(id);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      updateProgress();
    });
  });

  updateProgress();

  const sidebar = document.querySelector("#sidebar");
  const scrim = document.querySelector("[data-close-sidebar]");
  const menuToggle = document.querySelector("[data-menu-toggle]");

  function setMenuOpen(isOpen) {
    if (!sidebar || !menuToggle || !scrim) return;
    sidebar.classList.toggle("is-open", isOpen);
    scrim.classList.toggle("is-visible", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });
  }
  if (scrim) scrim.addEventListener("click", () => setMenuOpen(false));
  document.querySelectorAll(".sidebar a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  const trainingModules = document.querySelectorAll("[data-training-module]");
  const moduleLinks = document.querySelectorAll("[data-module-link]");

  function setCurrentModule(id) {
    moduleLinks.forEach((link) => {
      const current = link.dataset.moduleLink === id;
      if (link.closest(".training-nav")) {
        link.classList.toggle("is-current", current);
        if (current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    });
  }

  moduleLinks.forEach((link) => {
    link.addEventListener("click", () => setCurrentModule(link.dataset.moduleLink));
  });

  if ("IntersectionObserver" in window && trainingModules.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setCurrentModule(visible.target.dataset.trainingModule);
    }, { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.1, 0.25, 0.5] });
    trainingModules.forEach((module) => observer.observe(module));
  }

  if (window.location.hash.startsWith("#module-")) {
    const id = window.location.hash.replace("#module-", "");
    if (moduleIds.includes(id)) setCurrentModule(id);
  }
})();