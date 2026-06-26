(() => {
  const html = document.documentElement;
  const header = document.querySelector('.site-header');
  const progress = document.getElementById('scrollProgress');
  const year = document.getElementById('year');
  const themeToggle = document.querySelector('.theme-toggle');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.getElementById('navLinks');
  const commandDialog = document.getElementById('commandDialog');
  const commandInput = document.getElementById('commandInput');
  const commandList = document.getElementById('commandList');
  const closeCommand = document.getElementById('closeCommand');
  const toast = document.getElementById('toast');
  const contactForm = document.getElementById('contactForm');
  const copyEmail = document.getElementById('copyEmail');
  const downloadVcard = document.getElementById('downloadVcard');

  const profile = {
    name: 'Артём Северов',
    role: 'Software Architect',
    email: 'hello@severov.dev',
    phone: '+7 000 000-00-00',
    website: 'https://severov.dev',
  };

  const commands = [
    { label: 'Главный экран', hint: 'Hero', target: '#top' },
    { label: 'Посмотреть работы', hint: 'Кейсы', target: '#work' },
    { label: 'Открыть стек', hint: 'Технологии', target: '#stack' },
    { label: 'Изучить процесс', hint: 'Метод работы', target: '#process' },
    { label: 'Контакты', hint: 'Email и заявка', target: '#contact' },
    { label: 'Сменить тему', hint: 'Dark / Light', action: () => setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark') },
    { label: 'Скопировать email', hint: profile.email, action: () => copyText(profile.email, 'Email скопирован') },
  ];

  const setTheme = (theme) => {
    html.dataset.theme = theme;
    localStorage.setItem('preferred-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#080B12' : '#F6F3EE');
  };

  const initialTheme = localStorage.getItem('preferred-theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  setTheme(initialTheme);

  if (year) year.textContent = new Date().getFullYear();

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };

  const copyText = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(message);
    } catch {
      showToast('Не удалось скопировать автоматически');
    }
  };

  const scrollToTarget = (target) => {
    const node = document.querySelector(target);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeMenu();
  };

  const openCommand = () => {
    if (!commandDialog || commandDialog.open) return;
    renderCommands('');
    commandDialog.showModal();
    window.setTimeout(() => commandInput?.focus(), 30);
  };

  const closeCommandDialog = () => {
    if (commandDialog?.open) commandDialog.close();
  };

  const renderCommands = (query = '') => {
    if (!commandList) return;
    const normalized = query.trim().toLowerCase();
    const filtered = commands.filter((command) =>
      `${command.label} ${command.hint}`.toLowerCase().includes(normalized)
    );

    commandList.innerHTML = '';

    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'form-note';
      empty.textContent = 'Ничего не найдено. Попробуйте: стек, контакты, работы.';
      commandList.append(empty);
      return;
    }

    filtered.forEach((command) => {
      const button = document.createElement('button');
      button.className = 'command-item';
      button.type = 'button';
      button.innerHTML = `<strong>${command.label}</strong><span>${command.hint}</span>`;
      button.addEventListener('click', () => {
        closeCommandDialog();
        if (command.target) scrollToTarget(command.target);
        if (command.action) command.action();
      });
      commandList.append(button);
    });
  };

  const closeMenu = () => {
    menuToggle?.setAttribute('aria-expanded', 'false');
    navLinks?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  themeToggle?.addEventListener('click', () => {
    setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  menuToggle?.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    navLinks?.classList.toggle('is-open', !expanded);
    document.body.classList.toggle('menu-open', !expanded);
  });

  document.querySelectorAll('.command-open').forEach((button) => {
    button.addEventListener('click', openCommand);
  });

  closeCommand?.addEventListener('click', closeCommandDialog);
  commandInput?.addEventListener('input', (event) => renderCommands(event.currentTarget.value));

  window.addEventListener('keydown', (event) => {
    const isCommand = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (isCommand) {
      event.preventDefault();
      openCommand();
    }
    if (event.key === 'Escape') closeMenu();
  });

  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const value = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
    if (progress) progress.style.width = `${value}%`;
    if (header) header.dataset.elevated = String(scrollTop > 24);
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach((node) => revealObserver.observe(node));

  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      if (!id) return;
      document.querySelectorAll('.nav-links a').forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      });
    });
  }, { threshold: 0.36 });

  document.querySelectorAll('main section[id]').forEach((section) => activeObserver.observe(section));

  document.querySelectorAll('.magnetic').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
  });

  copyEmail?.addEventListener('click', () => copyText(profile.email, 'Email скопирован'));

  downloadVcard?.addEventListener('click', () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${profile.name}`,
      `TITLE:${profile.role}`,
      `EMAIL;TYPE=INTERNET:${profile.email}`,
      `TEL:${profile.phone}`,
      `URL:${profile.website}`,
      'END:VCARD',
    ].join('\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'programmer-contact.vcf';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('vCard подготовлена');
  });

  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = String(data.get('name') || '').trim();
    const contact = String(data.get('contact') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (!name || !contact || !message) {
      showToast('Заполните все поля');
      return;
    }

    const subject = encodeURIComponent(`Новый проект от ${name}`);
    const body = encodeURIComponent([
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      '',
      'Задача:',
      message,
    ].join('\n'));

    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  });
})();
