// Настройки сайта-приглашения. Меняйте значения здесь, не трогая основной код.
window.WEDDING_CONFIG = {
  couple: 'Маша + Даня',
  weddingDate: '2026-08-26T16:00:00+03:00',

  // Адреса для кнопок «Построить маршрут».
  locations: {
    registration: {
      title: 'Регистрация',
      address: 'ул. Мыткова, 65, Дворец бракосочетания'
    },
    banquet: {
      title: 'Банкет',
      address: 'ул. Никона Фёдорова, 9, Грин Хаус'
    }
  },

  // Ссылки можно заменить на реальные.
  links: {
    memories: '', // например: 'https://t.me/+your_group'
    rsvpEndpoint: '', // optional: URL Google Apps Script/Webhook для отправки анкеты POST JSON
    rsvpEmail: '' // optional: почта, если нужно отправлять анкету через mailto
  }
};
