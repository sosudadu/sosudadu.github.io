const root = document.documentElement;
const desktop = document.querySelector('#desktopArea');
const clock = document.querySelector('#clock');
const activeAppName = document.querySelector('#activeAppName');
const windows = [...document.querySelectorAll('.window')];
const dockItems = [...document.querySelectorAll('.dock-item')];
let topZ = 100;
let cascade = 0;

const appNames = {
  about: 'About',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  growth: 'Growth',
  contact: 'Contact'
};

function updateClock() {
  const now = new Date();
  clock.textContent = new Intl.DateTimeFormat('ko-KR', {
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(now);
}

function focusWindow(win) {
  windows.forEach(item => item.classList.remove('focused'));
  win.classList.add('focused');
  win.style.zIndex = String(++topZ);
  activeAppName.textContent = appNames[win.dataset.app] || 'Resume';
}

function placeWindow(win) {
  if (matchMedia('(max-width: 767px)').matches) return;
  const sideMargin = desktop.clientWidth <= 1024 ? 10 : 18;
  const dockReserve = desktop.clientHeight <= 650 ? 72 : 100;
  const width = Math.min(Number(win.dataset.width || 760), desktop.clientWidth - sideMargin * 2);
  const height = Math.min(Number(win.dataset.height || 560), desktop.clientHeight - dockReserve);
  const offset = (cascade++ % 5) * 24;
  win.style.width = `${width}px`;
  win.style.height = `${height}px`;
  win.style.left = `${Math.min(desktop.clientWidth - width - sideMargin, Math.max(sideMargin, (desktop.clientWidth - width) / 2 + offset - 48))}px`;
  win.style.top = `${Math.min(desktop.clientHeight - height - dockReserve + 22, Math.max(8, (desktop.clientHeight - height) / 2 + offset - 24))}px`;
}

function fitWindowToViewport(win) {
  if (matchMedia('(max-width: 767px)').matches || win.classList.contains('maximized')) return;
  const sideMargin = desktop.clientWidth <= 1024 ? 10 : 18;
  const dockReserve = desktop.clientHeight <= 650 ? 72 : 100;
  const width = Math.min(Number(win.dataset.width || 760), desktop.clientWidth - sideMargin * 2);
  const height = Math.min(Number(win.dataset.height || 560), desktop.clientHeight - dockReserve);
  const currentLeft = Number.parseFloat(win.style.left) || sideMargin;
  const currentTop = Number.parseFloat(win.style.top) || 8;
  win.style.width = `${width}px`;
  win.style.height = `${height}px`;
  win.style.left = `${Math.min(Math.max(sideMargin, currentLeft), Math.max(sideMargin, desktop.clientWidth - width - sideMargin))}px`;
  win.style.top = `${Math.min(Math.max(8, currentTop), Math.max(8, desktop.clientHeight - height - dockReserve + 22))}px`;
}

function openApp(name) {
  const win = document.querySelector(`.window[data-app="${name}"]`);
  if (!win) return;
  if (win.classList.contains('open') && win.classList.contains('focused')) {
    minimizeWindow(win);
    return;
  }
  if (!win.classList.contains('open')) placeWindow(win);
  win.classList.remove('minimizing');
  win.classList.add('open');
  focusWindow(win);
  document.querySelector(`.dock-item[data-open="${name}"]`)?.classList.add('active');
}

function closeWindow(win) {
  win.classList.remove('open', 'focused', 'maximized');
  document.querySelector(`.dock-item[data-open="${win.dataset.app}"]`)?.classList.remove('active');
  activeAppName.textContent = 'Resume';
}

function minimizeWindow(win) {
  win.classList.add('minimizing');
  setTimeout(() => {
    win.classList.remove('open', 'focused', 'minimizing');
    activeAppName.textContent = 'Resume';
  }, 250);
}

function toggleMaximize(win) {
  if (!win.classList.contains('maximized')) {
    win.dataset.previous = JSON.stringify({ left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height });
    win.classList.add('maximized');
  } else {
    win.classList.remove('maximized');
    const previous = JSON.parse(win.dataset.previous || '{}');
    Object.assign(win.style, previous);
  }
  focusWindow(win);
}

function enableDragging(win) {
  const handle = win.querySelector('.titlebar');
  let drag = null;
  handle.addEventListener('pointerdown', event => {
    if (event.target.closest('.traffic-lights') || win.classList.contains('maximized') || matchMedia('(max-width: 767px)').matches) return;
    focusWindow(win);
    drag = { x: event.clientX, y: event.clientY, left: win.offsetLeft, top: win.offsetTop };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', event => {
    if (!drag) return;
    const left = Math.min(desktop.clientWidth - 130, Math.max(-win.offsetWidth + 130, drag.left + event.clientX - drag.x));
    const top = Math.min(desktop.clientHeight - 70, Math.max(0, drag.top + event.clientY - drag.y));
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
  });
  const end = event => {
    if (drag && handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    drag = null;
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  handle.addEventListener('dblclick', event => {
    if (!event.target.closest('.traffic-lights')) toggleMaximize(win);
  });
}

dockItems.forEach(item => item.addEventListener('click', () => openApp(item.dataset.open)));
windows.forEach(win => {
  win.addEventListener('pointerdown', () => focusWindow(win));
  win.querySelector('.close').addEventListener('click', () => closeWindow(win));
  win.querySelector('.minimize').addEventListener('click', () => minimizeWindow(win));
  win.querySelector('.maximize').addEventListener('click', () => toggleMaximize(win));
  enableDragging(win);
});

document.querySelector('#themeToggle').addEventListener('click', event => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  event.currentTarget.textContent = next === 'dark' ? '☾' : '☀';
  localStorage.setItem('resume-theme', next);
});

document.querySelectorAll('a[aria-disabled="true"]').forEach(link => {
  link.addEventListener('click', event => event.preventDefault());
});

let resizeFrame;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    windows.filter(win => win.classList.contains('open')).forEach(fitWindowToViewport);
  });
});

const savedTheme = localStorage.getItem('resume-theme');
if (savedTheme) root.dataset.theme = savedTheme;
document.querySelector('#themeToggle').textContent = root.dataset.theme === 'dark' ? '☾' : '☀';
updateClock();
setInterval(updateClock, 30000);
placeWindow(document.querySelector('.window[data-app="about"]'));
focusWindow(document.querySelector('.window[data-app="about"]'));
