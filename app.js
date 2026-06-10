(() => {
  'use strict';

  const CONFIG = window.WEDDING_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const encodeMapUrl = (address) => {
    const query = encodeURIComponent(address || '');
    return `https://yandex.ru/maps/?text=${query}&z=16`;
  };

  const setRouteLinks = () => {
    $$('.hotspot--route').forEach((link) => {
      const key = link.dataset.route;
      const item = CONFIG.locations?.[key];
      if (!item?.address) return;
      link.href = encodeMapUrl(item.address);
      link.title = `${item.title}: ${item.address}`;
    });
  };

  const getWeddingDate = () => new Date(CONFIG.weddingDate || '2026-08-26T16:00:00+03:00');

  const pad = (value) => String(value).padStart(2, '0');

  const updateCountdown = () => {
    const target = getWeddingDate().getTime();
    const now = Date.now();
    const distance = Math.max(0, target - now);

    const days = Math.floor(distance / 86_400_000);
    const hours = Math.floor((distance % 86_400_000) / 3_600_000);
    const minutes = Math.floor((distance % 3_600_000) / 60_000);
    const seconds = Math.floor((distance % 60_000) / 1_000);

    $('[data-unit="days"]').textContent = pad(days);
    $('[data-unit="hours"]').textContent = pad(hours);
    $('[data-unit="minutes"]').textContent = pad(minutes);
    $('[data-unit="seconds"]').textContent = pad(seconds);
  };

  const openModal = (modal) => {
    if (!modal) return;
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modal) => {
    if (!modal) return;
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
    document.body.style.overflow = '';
  };

  const setupModals = () => {
    $$('[data-open-modal]').forEach((button) => {
      button.addEventListener('click', () => {
        const modal = button.dataset.openModal === 'rsvp' ? $('#rsvpModal') : $('#memoriesModal');
        openModal(modal);
      });
    });

    $$('[data-close-modal]').forEach((button) => {
      button.addEventListener('click', () => closeModal(button.closest('dialog')));
    });

    $$('dialog.modal').forEach((modal) => {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal(modal);
      });
      modal.addEventListener('close', () => {
        document.body.style.overflow = '';
      });
    });
  };

  const createIcsContent = () => {
    const start = getWeddingDate();
    const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
    const stamp = new Date();

    const toIcsDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MashaDanya//Wedding Invitation//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${start.getTime()}-masha-danya-wedding@example.local`,
      `DTSTAMP:${toIcsDate(stamp)}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      'SUMMARY:Свадьба Маши и Дани',
      'DESCRIPTION:Сбор гостей у ЗАГСа в 16:00, регистрация в 16:30, банкет в 17:30.',
      `LOCATION:${CONFIG.locations?.registration?.address || 'Дворец бракосочетания'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lines.join('\r\n');
  };

  const downloadCalendar = () => {
    const blob = new Blob([createIcsContent()], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'masha-danya-wedding.ics';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
  };

  const serializeRsvp = (form) => {
    const data = Object.fromEntries(new FormData(form));
    return {
      name: String(data.name || '').trim(),
      attendance: data.attendance,
      adults: Number(data.adults || 0),
      children: Number(data.children || 0),
      comment: String(data.comment || '').trim(),
      createdAt: new Date().toISOString()
    };
  };

  const rsvpToText = (rsvp) => [
    'Анкета на свадьбу Маши и Дани',
    `Имя: ${rsvp.name}`,
    `Присутствие: ${rsvp.attendance}`,
    `Взрослых: ${rsvp.adults}`,
    `Детей: ${rsvp.children}`,
    rsvp.comment ? `Комментарий: ${rsvp.comment}` : ''
  ].filter(Boolean).join('\n');

  const saveRsvp = async (rsvp) => {
    const storageKey = 'masha-danya-rsvp-list';
    const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
    list.push(rsvp);
    localStorage.setItem(storageKey, JSON.stringify(list));

    if (CONFIG.links?.rsvpEndpoint) {
      await fetch(CONFIG.links.rsvpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvp),
        mode: 'no-cors'
      });
    }
  };

  const setupRsvp = () => {
    const form = $('#rsvpForm');
    const status = $('#rsvpStatus');
    let lastRsvp = null;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      lastRsvp = serializeRsvp(form);
      status.textContent = 'Сохраняем…';

      try {
        await saveRsvp(lastRsvp);
        status.textContent = 'Готово! Ответ сохранён. Теперь его можно скопировать или отправить.';
        if (CONFIG.links?.rsvpEmail) {
          const subject = encodeURIComponent('Анкета на свадьбу Маши и Дани');
          const body = encodeURIComponent(rsvpToText(lastRsvp));
          window.location.href = `mailto:${CONFIG.links.rsvpEmail}?subject=${subject}&body=${body}`;
        }
      } catch (error) {
        status.textContent = 'Ответ сохранён на устройстве, но отправить его на сервер не получилось.';
        console.warn(error);
      }
    });

    $('#copyRsvp').addEventListener('click', async () => {
      const rsvp = lastRsvp || serializeRsvp(form);
      if (!rsvp.name) {
        status.textContent = 'Сначала укажите имя.';
        return;
      }

      try {
        await navigator.clipboard.writeText(rsvpToText(rsvp));
        status.textContent = 'Текст анкеты скопирован.';
      } catch {
        status.textContent = rsvpToText(rsvp);
      }
    });
  };

  const setupMemories = () => {
    const input = $('#memoryFiles');
    const preview = $('#filePreview');
    const status = $('#memoriesStatus');
    const shareButton = $('#shareFiles');
    const memoriesLink = $('#memoriesLink');

    if (CONFIG.links?.memories) memoriesLink.href = CONFIG.links.memories;
    else memoriesLink.addEventListener('click', (event) => {
      event.preventDefault();
      status.textContent = 'Добавьте ссылку на Telegram-группу в config.js — после этого кнопка откроет её автоматически.';
    });

    const renderPreview = () => {
      preview.innerHTML = '';
      const files = Array.from(input.files || []);
      if (!files.length) {
        status.textContent = '';
        return;
      }
      status.textContent = `Выбрано файлов: ${files.length}`;

      files.slice(0, 9).forEach((file) => {
        const url = URL.createObjectURL(file);
        let node;
        if (file.type.startsWith('image/')) {
          node = document.createElement('img');
          node.src = url;
          node.alt = file.name;
        } else if (file.type.startsWith('video/')) {
          node = document.createElement('video');
          node.src = url;
          node.muted = true;
          node.playsInline = true;
        } else {
          node = document.createElement('div');
          node.className = 'file-card';
          node.textContent = file.name;
        }
        preview.append(node);
      });
    };

    input.addEventListener('change', renderPreview);

    shareButton.addEventListener('click', async () => {
      const files = Array.from(input.files || []);
      if (!files.length) {
        status.textContent = 'Сначала выберите фото или видео.';
        return;
      }

      try {
        if (navigator.canShare?.({ files })) {
          await navigator.share({
            title: 'Воспоминания для Маши и Дани',
            text: 'Фото и видео для свадебного альбома',
            files
          });
          status.textContent = 'Готово — файлы переданы в меню «Поделиться».';
        } else {
          status.textContent = 'Этот браузер не поддерживает отправку файлов через сайт. Откройте группу и прикрепите файлы вручную.';
        }
      } catch (error) {
        status.textContent = 'Отправка отменена или не удалась.';
        console.warn(error);
      }
    });
  };

  const setupScrollTools = () => {
    const button = $('#toTop');
    const toggle = () => button.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.7);
    window.addEventListener('scroll', toggle, { passive: true });
    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    toggle();
  };

  const hidePreloader = () => {
    const preloader = $('#preloader');
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('is-hidden'), 250);
    }, { once: true });
  };

  const init = () => {
    setRouteLinks();
    setupModals();
    setupRsvp();
    setupMemories();
    setupScrollTools();
    hidePreloader();

    $('#calendarButton').addEventListener('click', downloadCalendar);
    updateCountdown();
    setInterval(updateCountdown, 1_000);

    if (location.hash === '#rsvp') openModal($('#rsvpModal'));
  };

  init();
})();
