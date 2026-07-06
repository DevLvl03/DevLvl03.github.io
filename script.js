// ================================
// Portfolio OS - Complete Application
// ================================

// ─── Sleep Utility ───
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Boot Manager ───
class BootManager {
    constructor() {
        this.bootScreen = document.getElementById('boot-screen');
        this.bootText = document.getElementById('boot-text');
        this.cursor = document.getElementById('cursor');
        this.pressEnter = document.getElementById('press-enter');
        this.desktop = document.getElementById('desktop');
        this.flash = document.getElementById('flash');
        this.booted = false;
        this.setup();
    }

    setup() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.booted) {
                this.booted = true;
                this.boot();
            }
        });

        this.bootScreen.addEventListener('click', () => {
            if (!this.booted) {
                this.booted = true;
                this.boot();
            }
        });

        this.pressEnter.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    async boot() {
        this.pressEnter.style.display = 'none';
        this.cursor.style.display = 'none';

        const lines = [
            'Loading Portfolio...',
            'Loading User...',
            'Checking Memory...',
            'Launching Explorer...',
            'Portfolio Loaded Successfully.'
        ];

        for (const line of lines) {
            await sleep(400);
            this.bootText.textContent += '\n';
            for (const char of line) {
                this.bootText.textContent += char;
                await sleep(15);
            }
        }

        await sleep(600);
        this.flash.style.opacity = '1';
        await sleep(150);
        this.bootScreen.style.display = 'none';
        this.desktop.classList.remove('hidden');
        void this.desktop.offsetHeight;
        this.desktop.classList.add('visible');
        this.flash.style.opacity = '0';

        this.bootComplete();
    }

    bootComplete() {
        const event = new Event('bootComplete');
        document.dispatchEvent(event);
    }
}

// ─── Particle Network ───
class ParticleNetwork {
    constructor() {
        this.canvas = document.getElementById('particles');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: -1000, y: -1000 };
        this.count = 70;
        this.maxDist = 140;
        this.resize();
        this.create();
        this.bind();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    create() {
        this.particles = [];
        for (let i = 0; i < this.count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 2 + 0.5
            });
        }
    }

    bind() {
        window.addEventListener('resize', () => {
            this.resize();
            if (this.particles.length < this.count) {
                while (this.particles.length < this.count) {
                    this.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: (Math.random() - 0.5) * 0.3,
                        r: Math.random() * 2 + 0.5
                    });
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.addEventListener('dragstart', (e) => e.preventDefault());
    }

    animate() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                p.x -= dx * 0.02;
                p.y -= dy * 0.02;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(76, 201, 240, 0.4)';
            ctx.fill();

            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const ddx = p.x - p2.x;
                const ddy = p.y - p2.y;
                const d = Math.sqrt(ddx * ddx + ddy * ddy);

                if (d < this.maxDist) {
                    const alpha = (1 - d / this.maxDist) * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(76, 201, 240, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// ─── Window Manager ───
class WindowManager {
    constructor() {
        this.windows = new Map();
        this.zIndex = 100;
        this.dragState = null;
        this.resizeState = null;
        this.windowOrder = [];
        this.taskbarButtons = new Map();
        this.init();
    }

    init() {
        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            const id = win.id;
            this.windows.set(id, {
                element: win,
                isMinimized: false,
                isMaximized: false,
                prevRect: null,
                isClosing: false
            });

            this.addResizeHandles(win);
            this.setupDrag(win);
            this.setupControls(win);
            this.setupFocus(win);
        });
    }

    addResizeHandles(win) {
        const dirs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
        dirs.forEach(dir => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${dir}`;
            handle.dataset.dir = dir;
            win.appendChild(handle);
            this.setupResize(win, handle, dir);
        });
    }

    setupDrag(win) {
        const titlebar = win.querySelector('.title-bar');
        if (!titlebar) return;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-buttons')) return;
            if (this.windows.get(win.id)?.isMaximized) {
                this.restore(win);
                return;
            }

            const rect = win.getBoundingClientRect();
            this.dragState = {
                win,
                startX: e.clientX,
                startY: e.clientY,
                origLeft: win.offsetLeft,
                origTop: win.offsetTop
            };
            this.focus(win);
            e.preventDefault();
        });
    }

    setupResize(win, handle, dir) {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (this.windows.get(win.id)?.isMaximized) return;

            const rect = win.getBoundingClientRect();
            this.resizeState = {
                win,
                dir,
                startX: e.clientX,
                startY: e.clientY,
                origLeft: win.offsetLeft,
                origTop: win.offsetTop,
                origWidth: win.offsetWidth,
                origHeight: win.offsetHeight
            };
            this.focus(win);
            e.preventDefault();
        });
    }

    setupControls(win) {
        const minBtn = win.querySelector('.minimize');
        const maxBtn = win.querySelector('.maximize');
        const closeBtn = win.querySelector('.close');

        if (minBtn) minBtn.addEventListener('click', (e) => { e.stopPropagation(); this.minimize(win); });
        if (maxBtn) maxBtn.addEventListener('click', (e) => { e.stopPropagation(); this.maximize(win); });
        if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.close(win); });
    }

    setupFocus(win) {
        win.addEventListener('mousedown', () => {
            if (!this.windows.get(win.id)?.isMinimized) {
                this.focus(win);
            }
        });
    }

    open(id) {
        const data = this.windows.get(id);
        if (!data) return;

        const win = data.element;

        if (data.isMinimized) {
            this.restore(win);
            this.focus(win);
            return;
        }

        if (!win.classList.contains('hidden')) {
            this.focus(win);
            return;
        }

        win.classList.remove('hidden', 'closing');
        data.isClosing = false;

        const icons = document.querySelectorAll('.desktop-icon');
        let iconIndex = 0;
        icons.forEach((ic, i) => {
            if (ic.dataset.window === id) iconIndex = i;
        });
        win.style.left = (120 + iconIndex * 40) + 'px';
        win.style.top = (80 + iconIndex * 30) + 'px';
        win.style.width = '480px';
        win.style.height = 'auto';

        this.focus(win);
        this.addTaskbarButton(id, win);
        this.triggerSkillsAnimation(win);
        this.focusTerminalInput(win);
    }

    focusTerminalInput(win) {
        if (win.id === 'terminal-window') {
            const input = win.querySelector('#term-input');
            if (input) setTimeout(() => input.focus(), 100);
        }
    }

    close(win) {
        const data = this.windows.get(win.id);
        if (!data || data.isClosing) return;

        data.isClosing = true;
        win.classList.add('closing');

        setTimeout(() => {
            win.classList.add('hidden');
            win.classList.remove('closing');
            data.isClosing = false;
            data.isMinimized = false;
            data.isMaximized = false;
            this.removeTaskbarButton(win.id);
            this.windowOrder = this.windowOrder.filter(w => w !== win.id);
        }, 200);
    }

    minimize(win) {
        const data = this.windows.get(win.id);
        if (!data) return;

        if (data.isMaximized) {
            this.restore(win);
        }

        data.isMinimized = true;
        win.classList.add('minimized');

        const btn = this.taskbarButtons.get(win.id);
        if (btn) btn.classList.add('minimized');
    }

    maximize(win) {
        const data = this.windows.get(win.id);
        if (!data) return;

        if (data.isMaximized) {
            this.restore(win);
            return;
        }

        data.prevRect = {
            left: win.style.left,
            top: win.style.top,
            width: win.style.width,
            height: win.style.height
        };

        data.isMaximized = true;
        win.classList.add('maximized');

        const maxBtn = win.querySelector('.maximize');
        if (maxBtn) maxBtn.textContent = '\u2750';
    }

    restore(win) {
        const data = this.windows.get(win.id);
        if (!data) return;

        if (data.isMaximized && data.prevRect) {
            win.style.left = data.prevRect.left;
            win.style.top = data.prevRect.top;
            win.style.width = data.prevRect.width;
            win.style.height = data.prevRect.height;
            data.isMaximized = false;
            win.classList.remove('maximized');

            const maxBtn = win.querySelector('.maximize');
            if (maxBtn) maxBtn.textContent = '\u25A1';
        }

        if (data.isMinimized) {
            data.isMinimized = false;
            win.classList.remove('minimized');
            const btn = this.taskbarButtons.get(win.id);
            if (btn) btn.classList.remove('minimized');
        }

        this.focusTerminalInput(win);
    }

    focus(win) {
        const data = this.windows.get(win.id);
        if (!data) return;

        this.windowOrder = this.windowOrder.filter(w => w !== win.id);
        this.windowOrder.push(win.id);

        this.zIndex++;
        win.style.zIndex = this.zIndex;

        document.querySelectorAll('.window').forEach(w => {
            w.classList.remove('focused');
        });
        win.classList.add('focused');

        const btn = this.taskbarButtons.get(win.id);
        if (btn) {
            document.querySelectorAll('.taskbar-app').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        this.focusTerminalInput(win);
    }

    addTaskbarButton(id, win) {
        if (this.taskbarButtons.has(id)) return;

        const container = document.getElementById('running-apps');
        const btn = document.createElement('button');
        btn.className = 'taskbar-app';
        btn.dataset.window = id;

        const titleText = win.querySelector('.title-bar-text')?.textContent?.trim() || id;
        btn.textContent = titleText;

        btn.addEventListener('click', () => {
            const data = this.windows.get(id);
            if (!data) return;

            if (data.isMinimized) {
                this.restore(win);
                this.focus(win);
            } else if (win.classList.contains('hidden')) {
                this.open(id);
            } else {
                if (win.classList.contains('focused')) {
                    this.minimize(win);
                } else {
                    this.focus(win);
                }
            }
        });

        container.appendChild(btn);
        this.taskbarButtons.set(id, btn);
    }

    removeTaskbarButton(id) {
        const btn = this.taskbarButtons.get(id);
        if (btn) {
            btn.remove();
            this.taskbarButtons.delete(id);
        }
    }

    triggerSkillsAnimation(win) {
        if (win.id !== 'skills-window') return;
        setTimeout(() => {
            const skills = win.querySelectorAll('.skill');
            skills.forEach((skill, i) => {
                setTimeout(() => {
                    const percent = skill.dataset.percent;
                    const fill = skill.querySelector('.progress-fill');
                    if (fill) {
                        fill.style.setProperty('--percent', percent + '%');
                        skill.classList.add('animate');
                    }
                }, i * 150);
            });
        }, 300);
    }
}

// ─── Desktop Icons ───
class DesktopIcons {
    constructor(windowManager) {
        this.wm = windowManager;
        this.init();
    }

    init() {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                const windowId = icon.dataset.window;
                if (windowId) {
                    this.wm.open(windowId);
                }
            });
        });
    }
}

// ─── Taskbar ───
class Taskbar {
    constructor() {
        this.clock = document.getElementById('clock');
        this.startBtn = document.getElementById('start-button');
        this.init();
    }

    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        this.clock.textContent = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// ─── Start Menu ───
class StartMenu {
    constructor(windowManager) {
        this.menu = document.getElementById('start-menu');
        this.startBtn = document.getElementById('start-button');
        this.isOpen = false;
        this.wm = windowManager;
        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.menu.querySelectorAll('.start-menu-item[data-window]').forEach(item => {
            item.addEventListener('click', () => {
                const windowId = item.dataset.window;
                this.wm.open(windowId);
                this.close();
            });
        });

        document.getElementById('start-menu-shutdown')?.addEventListener('click', () => {
            this.close();
            this.shutdown();
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.menu.contains(e.target) && e.target !== this.startBtn) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.menu.classList.remove('hidden');
        this.isOpen = true;
        this.startBtn.classList.add('active');
    }

    close() {
        this.menu.classList.add('hidden');
        this.isOpen = false;
        this.startBtn.classList.remove('active');
    }

    async shutdown() {
        const desktop = document.getElementById('desktop');
        const bootScreen = document.getElementById('boot-screen');
        const flash = document.getElementById('flash');

        desktop.style.transition = 'opacity 0.5s ease';
        desktop.style.opacity = '0';
        desktop.classList.remove('visible');

        await sleep(500);

        flash.style.opacity = '1';
        await sleep(200);

        desktop.classList.add('hidden');
        desktop.style.opacity = '';
        desktop.style.transition = '';

        bootScreen.style.display = 'flex';

        const bootText = document.getElementById('boot-text');
        bootText.textContent = 'Microsoft Windows XP [Version 5.1.2600]\n(C) Copyright LD\n\nC:\\Users\\Visitor>';

        const cursor = document.getElementById('cursor');
        cursor.style.display = 'inline';
        const pressEnter = document.getElementById('press-enter');
        pressEnter.style.display = 'block';

        flash.style.opacity = '0';

        const bootManager = new BootManager();
    }
}

// ─── Terminal Emulator ───
class Terminal {
    constructor() {
        this.container = document.getElementById('terminal-window');
        this.output = document.getElementById('term-output');
        this.input = document.getElementById('term-input');
        this.init();
    }

    init() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.input.value.trim();
                this.input.value = '';
                this.execute(cmd);
            }
            if (e.key === 'Tab') {
                e.preventDefault();
            }
        });
    }

    execute(cmd) {
        this.print(`visitor@portfolio:~$ ${cmd}`, 'info');

        if (!cmd) return;

        const args = cmd.split(/\s+/);
        const command = args[0].toLowerCase();

        switch (command) {
            case 'help':
                this.print('', '');
                this.print('Available commands:', 'system');
                this.print('  about     - Display about information', '');
                this.print('  skills    - List skills and proficiencies', '');
                this.print('  projects  - Show project portfolio', '');
                this.print('  desktop   - Return to desktop view', '');
                this.print('  clear     - Clear terminal', '');
                this.print('  help      - Show this message', '');
                this.print('', '');
                break;

            case 'about':
                this.print('', '');
                this.print('About Me:', 'info');
                this.print('Learning Prompt Hacking (Preparing for the AI invasion)', '');
                this.print('Minecraft enthusiast', '');
                this.print('Skript Developer', '');
                this.print('', '');
                this.print('Learning: HTML, CSS, JavaScript, Python, Java', '');
                this.print('', '');
                break;

            case 'skills':
                this.print('', '');
                this.print('Skills:', 'info');
                this.print('  Skript       [===========-------] 87%', '');
                this.print('  HTML         [====---------------] 30%', '');
                this.print('  CSS          [-------------------] 5%', '');
                this.print('  JavaScript   [-------------------] 1%', '');
                this.print('  Python       [-------------------] 4%', '');
                this.print('  Java         [-------------------] 0.001%', '');
                this.print('', '');
                break;

            case 'projects':
                this.print('', '');
                this.print('Projects:', 'info');
                this.print('  Portfolio OS  - Windows XP inspired portfolio website', '');
                this.print('  Minecraft Sc  - Custom Skript creations for Minecraft', '');
                this.print('  Prompt Exp    - AI prompt hacking experiments', '');
                this.print('  Learn Proj    - Various learning projects', '');
                this.print('', '');
                break;

            case 'desktop':
                this.print('Returning to desktop...', 'success');
                setTimeout(() => {
                    const win = document.getElementById('terminal-window');
                    if (win && !win.classList.contains('hidden')) {
                        const wm = window.__wm;
                        if (wm) wm.close(win);
                    }
                }, 300);
                break;

            case 'clear':
                this.output.textContent = '';
                break;

            default:
                this.print(`Command not found: ${command}. Type "help" for available commands.`, 'error');
        }
    }

    print(text, className = '') {
        const div = document.createElement('div');
        div.className = `term-line ${className}`;
        div.textContent = text;
        this.output.appendChild(div);
        this.output.scrollTop = this.output.scrollHeight;
    }
}

// ─── Keyboard Shortcuts ───
class KeyboardShortcuts {
    constructor(windowManager) {
        this.wm = windowManager;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.wm.open('terminal-window');
            }
            if (e.key === 'Escape') {
                const focused = document.querySelector('.window.focused');
                if (focused) {
                    this.wm.close(focused);
                }
            }
            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                const windows = document.querySelectorAll('.window:not(.hidden)');
                if (windows.length > 1) {
                    const focused = document.querySelector('.window.focused');
                    let idx = 0;
                    windows.forEach((w, i) => {
                        if (w === focused) idx = i;
                    });
                    const next = windows[(idx + 1) % windows.length];
                    this.wm.focus(next);
                }
            }
        });
    }
}

// ─── Application Initialization ───
document.addEventListener('DOMContentLoaded', () => {
    const bootManager = new BootManager();

    const particleNetwork = new ParticleNetwork();

    document.addEventListener('bootComplete', () => {
        const wm = new WindowManager();
        window.__wm = wm;

        const desktopIcons = new DesktopIcons(wm);
        const taskbar = new Taskbar();
        const startMenu = new StartMenu(wm);
        const terminal = new Terminal();
        terminal.print('Portfolio OS Terminal v1.0', 'system');
        terminal.print('Type "help" for available commands.', 'system');
        terminal.print('', '');
        const shortcuts = new KeyboardShortcuts(wm);

        const desktop = document.getElementById('desktop');
        desktop.addEventListener('dblclick', () => {
            if (startMenu.isOpen) startMenu.close();
        });

        document.addEventListener('mousemove', (e) => {
            if (wm.dragState) {
                const s = wm.dragState;
                const dx = e.clientX - s.startX;
                const dy = e.clientY - s.startY;
                s.win.style.left = (s.origLeft + dx) + 'px';
                s.win.style.top = (s.origTop + dy) + 'px';
            }

            if (wm.resizeState) {
                const s = wm.resizeState;
                const dx = e.clientX - s.startX;
                const dy = e.clientY - s.startY;
                const dir = s.dir;
                let newLeft = s.origLeft;
                let newTop = s.origTop;
                let newWidth = s.origWidth;
                let newHeight = s.origHeight;
                const minW = 300;
                const minH = 150;

                if (dir.includes('e')) newWidth = Math.max(minW, s.origWidth + dx);
                if (dir.includes('w')) {
                    newWidth = Math.max(minW, s.origWidth - dx);
                    if (newWidth > minW) newLeft = s.origLeft + dx;
                    else newLeft = s.origLeft + s.origWidth - minW;
                }
                if (dir.includes('s')) newHeight = Math.max(minH, s.origHeight + dy);
                if (dir.includes('n')) {
                    newHeight = Math.max(minH, s.origHeight - dy);
                    if (newHeight > minH) newTop = s.origTop + dy;
                    else newTop = s.origTop + s.origHeight - minH;
                }

                s.win.style.left = newLeft + 'px';
                s.win.style.top = newTop + 'px';
                s.win.style.width = newWidth + 'px';
                s.win.style.height = newHeight + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            wm.dragState = null;
            wm.resizeState = null;
        });
    });
});
