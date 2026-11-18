/* Saúde em Movimento — navegação e interações */
(function () {
  "use strict";

  const views = document.querySelectorAll("[data-view]");
  const topbar = document.getElementById("topbar");
  const footer = document.getElementById("site-footer");
  const DEFAULT_VIEW = "inicio";

  /* ---------- Roteamento por hash (#inicio, #guia, #secao-1, #referencias) ---------- */
  function showView() {
    const name = location.hash.replace("#", "") || DEFAULT_VIEW;
    const target = document.querySelector(`[data-view="${name}"]`) ? name : DEFAULT_VIEW;

    views.forEach((v) => { v.hidden = v.dataset.view !== target; });

    const isIntro = target === "inicio";
    topbar.hidden = isIntro;
    footer.hidden = isIntro;

    window.scrollTo({ top: 0, behavior: "instant" });
    observeReveals();
  }
  window.addEventListener("hashchange", showView);

  /* ---------- Animação de entrada ao rolar ---------- */
  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          entry.target.querySelectorAll("[data-count]").forEach(countUp);
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12 })
    : null;

  function observeReveals() {
    document.querySelectorAll(".view:not([hidden]) .reveal:not(.is-visible)").forEach((el) => {
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add("is-visible");
    });
  }

  /* ---------- Contador animado (60 min, 3 dias) ---------- */
  function countUp(el) {
    const end = Number(el.dataset.count);
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Checklist de hábitos (salvo no navegador) ---------- */
  function storageGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sem armazenamento */ }
  }

  document.querySelectorAll("[data-checklist]").forEach((list) => {
    const id = list.dataset.checklist;
    const key = `saude-em-movimento:${id}`;
    const items = Array.from(list.querySelectorAll(".habit"));
    const progress = document.querySelector(`[data-progress="${id}"]`);
    const saved = storageGet(key) || [];

    items.forEach((item, i) => item.setAttribute("aria-pressed", saved[i] ? "true" : "false"));

    function update() {
      const state = items.map((it) => it.getAttribute("aria-pressed") === "true");
      const done = state.filter(Boolean).length;
      if (progress) {
        progress.querySelector("[data-progress-count]").textContent = done;
        progress.querySelector("[data-progress-fill]").style.width = `${(done / items.length) * 100}%`;
      }
      storageSet(key, state);
    }

    items.forEach((item) => {
      item.addEventListener("click", () => {
        const on = item.getAttribute("aria-pressed") !== "true";
        item.setAttribute("aria-pressed", String(on));
        update();
      });
    });
    update();
  });

  /* ---------- Abas (Tipo 1 x Tipo 2) ---------- */
  document.querySelectorAll("[data-tabs]").forEach((tabs) => {
    const buttons = Array.from(tabs.querySelectorAll('[role="tab"]'));

    function select(btn) {
      buttons.forEach((b) => {
        const active = b === btn;
        b.setAttribute("aria-selected", String(active));
        b.tabIndex = active ? 0 : -1;
        document.getElementById(b.getAttribute("aria-controls")).hidden = !active;
      });
    }

    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => select(btn));
      btn.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const next = buttons[(i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length];
        select(next);
        next.focus();
      });
    });
  });

  /* ---------- Desafio da pausa ativa (2 minutos) ---------- */
  document.querySelectorAll("[data-pause-timer]").forEach((box) => {
    const btn = box.querySelector("[data-timer-btn]");
    const text = box.querySelector("[data-timer-text]");
    const icon = btn.querySelector("i");
    const TOTAL = 120;
    let remaining = TOTAL;
    let timer = null;

    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    function reset() {
      clearInterval(timer);
      timer = null;
      remaining = TOTAL;
      box.classList.remove("is-running");
    }

    btn.addEventListener("click", () => {
      if (timer) {
        reset();
        text.textContent = `Começar ${fmt(TOTAL)}`;
        icon.className = "ph-bold ph-play";
        return;
      }
      box.classList.remove("is-done");
      box.classList.add("is-running");
      icon.className = "ph-bold ph-stop";
      text.textContent = `Bora! ${fmt(remaining)}`;
      timer = setInterval(() => {
        remaining -= 1;
        text.textContent = `Bora! ${fmt(remaining)}`;
        if (remaining <= 0) {
          reset();
          box.classList.add("is-done");
          icon.className = "ph-bold ph-confetti";
          text.textContent = "Mandou bem! De novo?";
        }
      }, 1000);
    });
  });

  showView();
})();
