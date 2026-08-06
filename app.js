(function () {
  "use strict";

  document.documentElement.classList.add("js");

  const config = window.WEDDING_CONFIG || {};

  function setLink(selector, url) {
    const link = document.querySelector(selector);
    if (!link || !url) return;
    link.href = url;
  }

  setLink('[data-link="map"]', config.MAP_URL);
  setLink('[data-link="directions"]', config.DIRECTIONS_URL);

  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10%", threshold: 0.12 },
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const countdown = document.querySelector("#countdown");
  const targetTime = new Date(config.EVENT_DATE).getTime();

  function updateCountdown() {
    if (!countdown || Number.isNaN(targetTime)) return;

    const difference = targetTime - Date.now();
    if (difference <= 0) {
      countdown.innerHTML = '<p class="countdown-ended">Сегодня тот самый день.</p>';
      countdown.setAttribute("aria-label", "Сегодня день свадьбы");
      return;
    }

    const values = {
      days: Math.floor(difference / 86_400_000),
      hours: Math.floor((difference / 3_600_000) % 24),
      minutes: Math.floor((difference / 60_000) % 60),
      seconds: Math.floor((difference / 1_000) % 60),
    };

    Object.entries(values).forEach(([unit, value]) => {
      const target = countdown.querySelector(`[data-unit="${unit}"]`);
      if (target) target.textContent = String(value).padStart(2, "0");
    });

    countdown.setAttribute(
      "aria-label",
      `До свадьбы ${values.days} дней, ${values.hours} часов, ${values.minutes} минут`,
    );
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1_000);

  const form = document.querySelector("#rsvp-form");
  const partySizeField = document.querySelector("#party-size-field");
  const dietaryField = document.querySelector("#dietary-field");
  const status = document.querySelector("#form-status");

  function syncAttendance() {
    if (!form) return;
    const attendance = form.elements.attendance.value;
    const attending = attendance === "yes";
    if (partySizeField) partySizeField.hidden = !attending;
    if (dietaryField) dietaryField.classList.toggle("form-field-full", !attending);

    form.querySelectorAll(".radio-card").forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      card.classList.toggle("is-selected", Boolean(radio && radio.checked));
    });
  }

  form?.querySelectorAll('input[name="attendance"]').forEach((input) => {
    input.addEventListener("change", syncAttendance);
  });
  syncAttendance();

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const guestName = String(data.get("guestName") || "").trim();
    const attending = data.get("attendance") === "yes";
    const attendanceText = attending ? "С радостью буду" : "Не смогу прийти";
    const partySize = attending ? String(data.get("partySize") || "1") : "0";
    const dietary = String(data.get("dietary") || "Не указано").trim() || "Не указано";
    const message = String(data.get("message") || "—").trim() || "—";

    const subject = `RSVP — Анна и Михаил — ${guestName}`;
    const body = [
      `Имя: ${guestName}`,
      `Ответ: ${attendanceText}`,
      `Количество гостей: ${partySize}`,
      `Питание: ${dietary}`,
      "",
      "Пожелание:",
      message,
    ].join("\n");

    if (!config.RSVP_EMAIL || config.RSVP_EMAIL.endsWith("@example.com")) {
      if (status) {
        status.textContent =
          "Демо-режим: укажите настоящий RSVP_EMAIL в site-config.js перед рассылкой приглашения.";
      }
      return;
    }

    const mailto = `mailto:${encodeURIComponent(config.RSVP_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (status) status.textContent = "Открываем почтовое приложение…";
    window.location.href = mailto;
  });
})();
