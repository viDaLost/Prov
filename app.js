(() => {
  'use strict';

  const config = {
    couple: 'Маша и Даня',
    eventTitle: 'Свадьба Маши и Дани',
    eventDateIso: '2026-08-26T16:00:00+05:00',
    eventEndIso: '2026-08-26T23:30:00+05:00',
    registrationMapUrl: '#',
    banquetMapUrl: '#',
    memoriesUrl: '',
    formUrl: '',
    calendarLocation: '',
    calendarDescription: '',
    ...(window.WEDDING_CONFIG || {})
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const toast = $('#toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  function isRealUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
  }

  function openUrl(url) {
    if (!isRealUrl(url)) return false;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  function setLink(selector, url) {
    const node = $(selector);
    if (!node) return;
    if (isRealUrl(url)) {
      node.href = url;
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
    }
    node.addEventListener('click', (event) => {
      event.preventDefault();
      if (!openUrl(url)) showToast('Ссылка ещё не указана в config.js');
    });
  }

  setLink('[data-action="registration-map"]', config.registrationMapUrl);
  setLink('[data-action="banquet-map"]', config.banquetMapUrl);

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function toIcsDate(iso) {
    const d = new Date(iso);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  }

  function escapeIcs(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  function downloadCalendarEvent() {
    const now = toIcsDate(new Date().toISOString());
    const uid = `wedding-${config.eventDateIso}@local-invite`;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wedding Invitation//Masha Danya//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDate(config.eventDateIso)}`,
      `DTEND:${toIcsDate(config.eventEndIso)}`,
      `SUMMARY:${escapeIcs(config.eventTitle)}`,
      `LOCATION:${escapeIcs(config.calendarLocation)}`,
      `DESCRIPTION:${escapeIcs(config.calendarDescription)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'svadba-masha-danya-26-08-2026.ics';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 700);
    showToast('Событие для календаря скачано');
  }

  $('#calendarHeart')?.addEventListener('click', downloadCalendarEvent);

  function updateCountdown() {
    const target = new Date(config.eventDateIso).getTime();
    const diff = Math.max(0, target - Date.now());
    const second = 1000;
    const minute = 60 * second;
    const hour = 60 * minute;
    const day = 24 * hour;

    const values = {
      days: Math.floor(diff / day),
      hours: Math.floor((diff % day) / hour),
      minutes: Math.floor((diff % hour) / minute),
      seconds: Math.floor((diff % minute) / second)
    };

    $('[data-count="days"]') && ($('[data-count="days"]').textContent = String(values.days));
    $('[data-count="hours"]') && ($('[data-count="hours"]').textContent = pad(values.hours));
    $('[data-count="minutes"]') && ($('[data-count="minutes"]').textContent = pad(values.minutes));
    $('[data-count="seconds"]') && ($('[data-count="seconds"]').textContent = pad(values.seconds));
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  const memoryDialog = $('#memoryDialog');
  const rsvpDialog = $('#rsvpDialog');

  $('[data-action="memories"]')?.addEventListener('click', () => {
    if (openUrl(config.memoriesUrl)) return;
    if (memoryDialog?.showModal) memoryDialog.showModal();
    else showToast('Добавьте ссылку на Telegram-группу в config.js');
  });

  $('[data-action="form"]')?.addEventListener('click', () => {
    if (openUrl(config.formUrl)) return;
    if (rsvpDialog?.showModal) rsvpDialog.showModal();
    else showToast('Добавьте ссылку на анкету в config.js');
  });

  $('[data-close="rsvp"]')?.addEventListener('click', () => rsvpDialog?.close());

  $('#rsvpForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const record = {
      ...data,
      savedAt: new Date().toISOString()
    };
    const current = JSON.parse(localStorage.getItem('wedding-rsvp') || '[]');
    current.push(record);
    localStorage.setItem('wedding-rsvp', JSON.stringify(current));
    form.reset();
    rsvpDialog?.close();
    showToast('Ответ сохранён на этом устройстве');
  });

  const scrollTop = $('#scrollTop');
  if (scrollTop) {
    scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    const onScroll = () => scrollTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.85);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function hidePreloader() {
    $('#preloader')?.classList.add('is-hidden');
  }
  window.addEventListener('load', () => window.setTimeout(hidePreloader, 250));
  window.setTimeout(hidePreloader, 1800);

  function addFloatingHearts() {
    const shell = $('.site-shell');
    if (!shell || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hearts = [
      { x: '7%', y: '1.8%', d: '7s', delay: '.1s' },
      { x: '89%', y: '2.4%', d: '8.5s', delay: '.9s' },
      { x: '12%', y: '31%', d: '8s', delay: '1.8s' },
      { x: '84%', y: '48%', d: '7.6s', delay: '.6s' },
      { x: '9%', y: '74%', d: '9s', delay: '1.4s' },
      { x: '91%', y: '83%', d: '7.8s', delay: '2.1s' }
    ];

    for (const item of hearts) {
      const span = document.createElement('span');
      span.className = 'floating-heart';
      span.textContent = Math.random() > .45 ? '♡' : '♥';
      span.style.setProperty('--x', item.x);
      span.style.setProperty('--y', item.y);
      span.style.setProperty('--duration', item.d);
      span.style.setProperty('--delay', item.delay);
      shell.append(span);
    }
  }

  addFloatingHearts();

  $$('img').forEach((img) => {
    img.addEventListener('contextmenu', (event) => event.preventDefault());
  });
})();
