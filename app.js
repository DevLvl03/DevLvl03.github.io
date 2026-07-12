const CATEGORIES = {
    minecraft: { iconClass: 'icon-minecraft', label: 'Minecraft' },
    images:    { iconClass: 'icon-images',    label: 'Images' },
    bio:       { iconClass: 'icon-bio',       label: 'Bio / Text' },
    videos:    { iconClass: 'icon-videos',    label: 'Videos' },
    quotes:    { iconClass: 'icon-quotes',    label: 'Quotes' },
    text:      { iconClass: 'icon-text',      label: 'Text' }
};

const ASCII = `
 ____            _       _____            
|  _ \\ __ _ _ __(_) ___ |  ___|__  _ __ ___ 
| |_) / _\` | '__| |/ _ \\| |_ / _ \\| '__/ _ \\
|  __/ (_| | |  | | (_) |  _| (_) | | |  __/
|_|   \\__,_|_|  |_|\\___/|_|  \\___/|_|  \\___|
`;

let data = {};
let dataHash = '';
let currentIndex = null;
let currentTheme = localStorage.getItem('portfo-theme') || 'normal';
let currentCat = null;

const body = document.body;
const navCats = document.getElementById('nav-cats');
const mobileNavCats = document.getElementById('mobile-nav-cats');
const categoriesGrid = document.getElementById('categories-grid');
const entriesSection = document.getElementById('entries-section');
const entriesGrid = document.getElementById('entries-grid');
const sectionTitle = document.getElementById('section-title');
const normalView = document.getElementById('normal-view');
const terminalView = document.getElementById('terminal-view');
const output = document.getElementById('output');
const cmdInput = document.getElementById('cmd');
const mobileMenu = document.getElementById('mobile-menu');

function makeIcon(key) {
    const icon = document.createElement('div');
    icon.className = 'icon ' + CATEGORIES[key].iconClass;
    if (key === 'text') {
        for (let i = 0; i < 4; i++) icon.appendChild(document.createElement('span'));
    }
    return icon;
}

function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h;
}

// ====== DATA ======
async function loadData() {
    let newData = null;
    let newHash = '';

    // localStorage first (editor writes here)
    const local = localStorage.getItem('portfo-data');
    if (local) {
        try {
            const parsed = JSON.parse(local);
            if (parsed && Object.keys(parsed).length) {
                newData = parsed;
                newHash = hashStr(local);
            }
        } catch {}
    }

    // Fallback to index.json
    if (!newData) {
        try {
            const res = await fetch('index.json');
            if (res.ok) {
                const idx = await res.json();
                currentIndex = idx;
                newData = {};
                for (const [key, val] of Object.entries(idx)) {
                    newData[key] = (val.posts || []).map(p => ({
                        title: p.title, slug: p.slug, date: p.date,
                        body: p.excerpt || '', tags: p.tags, image: p.image || ''
                    }));
                }
                newHash = hashStr(JSON.stringify(newData));
            }
        } catch {}
    }

    // Fallback to data.json
    if (!newData) {
        try {
            const r = await fetch('data.json');
            if (r.ok) {
                newData = await r.json();
                newHash = hashStr(JSON.stringify(newData));
            }
        } catch {}
    }

    if (!newData) return;

    // Only re-render if data actually changed
    if (newHash !== dataHash) {
        dataHash = newHash;
        data = newData;
        if (!currentIndex) {
            // preserve currentCat if it still has posts
            if (currentCat && data[currentCat] && data[currentCat].length) {
                renderNav();
                openCategory(currentCat);
            } else {
                currentCat = null;
                renderNav();
                renderCategories();
            }
        }
    }
}

function getPostUrl(cat, slug) { return cat + '/' + slug + '/index.html'; }

// ====== THEME ======
function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('portfo-theme', theme);
    body.className = theme === 'terminal' ? 'theme-terminal' : '';
    normalView.classList.toggle('hidden', theme === 'terminal');
    terminalView.classList.toggle('hidden', theme === 'normal');
    if (theme === 'terminal') {
        showNormalSections(false);
        printWelcome();
        setTimeout(() => cmdInput.focus(), 50);
    } else {
        output.innerHTML = '';
    }
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    setTheme(currentTheme === 'normal' ? 'terminal' : 'normal');
});

document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

mobileNavCats.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') mobileMenu.classList.add('hidden');
});

document.querySelector('.logo').addEventListener('click', () => {
    currentCat = null;
    renderNav();
    renderCategories();
    showNormalSections(true);
});

// ====== NAV ======
function renderNav() {
    const build = (c) => {
        c.innerHTML = '';
        for (const [k, v] of Object.entries(CATEGORIES)) {
            const btn = document.createElement('button');
            btn.textContent = v.label;
            if (k === currentCat) btn.classList.add('active');
            btn.addEventListener('click', () => openCategory(k));
            c.appendChild(btn);
        }
    };
    build(navCats); build(mobileNavCats);
}

// ====== NORMAL VIEW ======
function renderCategories() {
    categoriesGrid.innerHTML = '';
    entriesSection.classList.add('hidden');
    categoriesGrid.style.display = '';

    for (const [key, val] of Object.entries(CATEGORIES)) {
        const posts = data[key] || [];
        if (!posts.length) continue;

        const card = document.createElement('div');
        card.className = 'cat-card';

        const iconWrap = document.createElement('div');
        iconWrap.className = 'cat-card-icon';
        iconWrap.appendChild(makeIcon(key));

        const name = document.createElement('div');
        name.className = 'cat-card-name';
        name.textContent = val.label;
        const countEl = document.createElement('div');
        countEl.className = 'cat-card-count';
        countEl.textContent = posts.length + (posts.length === 1 ? ' post' : ' posts');

        card.appendChild(iconWrap);
        card.appendChild(name);
        card.appendChild(countEl);
        card.addEventListener('click', () => openCategory(key));
        categoriesGrid.appendChild(card);
    }
}

function openCategory(cat) {
    currentCat = cat;
    renderNav();
    mobileMenu.classList.add('hidden');

    if (currentTheme === 'terminal') { termList(cat); return; }

    const posts = data[cat] || [];
    categoriesGrid.style.display = 'none';
    entriesSection.classList.remove('hidden');
    sectionTitle.textContent = CATEGORIES[cat].label;

    if (!posts.length) {
        entriesGrid.innerHTML = '<p style="color:var(--text-muted);padding:20px 0;">No posts yet.</p>';
        return;
    }

    entriesGrid.innerHTML = '';
    posts.forEach((post, i) => {
        const url = currentIndex ? getPostUrl(cat, post.slug) : null;
        const card = document.createElement('a');
        card.className = 'entry-card';
        card.style.animationDelay = (i * 0.05) + 's';
        if (url) { card.href = url; } else { card.style.cursor = 'default'; card.addEventListener('click', e => e.preventDefault()); }

        if (post.image) {
            const imgWrap = document.createElement('div');
            imgWrap.className = 'entry-card-image';
            const img = document.createElement('img');
            img.src = post.image;
            img.alt = post.title || '';
            img.loading = 'lazy';
            imgWrap.appendChild(img);
            card.appendChild(imgWrap);
        }

        const header = document.createElement('div');
        header.className = 'entry-card-header';
        const title = document.createElement('div');
        title.className = 'entry-card-title';
        title.textContent = post.title || 'Untitled';
        const date = document.createElement('div');
        date.className = 'entry-card-date';
        date.textContent = post.date || '';
        header.appendChild(title);
        header.appendChild(date);

        const preview = document.createElement('div');
        preview.className = 'entry-card-preview';
        preview.textContent = (post.body || '').substring(0, 200);

        card.appendChild(header);
        card.appendChild(preview);

        if (post.tags) {
            const tags = post.tags.split(',').map(t => t.trim()).filter(Boolean);
            if (tags.length) {
                const tagsEl = document.createElement('div');
                tagsEl.className = 'entry-card-tags';
                tags.forEach(t => {
                    const span = document.createElement('span');
                    span.className = 'tag';
                    span.textContent = t;
                    tagsEl.appendChild(span);
                });
                card.appendChild(tagsEl);
            }
        }
        entriesGrid.appendChild(card);
    });
}

function showNormalSections(show) {
    categoriesGrid.style.display = show ? '' : 'none';
    if (!show) entriesSection.classList.add('hidden');
}

document.getElementById('back-btn').addEventListener('click', () => {
    currentCat = null;
    renderNav();
    renderCategories();
});

// ====== TERMINAL ======
function printTerm(text, cls) {
    const line = document.createElement('div');
    line.className = 'line' + (cls ? ' ' + cls : '');
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function printWelcome() {
    output.innerHTML = '';
    printTerm(ASCII, 'ascii-art');
    printTerm('Welcome to Portfo', 'header');
    printTerm('Type "help" for commands.\n', 'info');
}

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function termList(cat) {
    const posts = data[cat] || [];
    printTerm('\n--- ' + CATEGORIES[cat].label + ' (' + posts.length + ') ---', 'header');
    if (!posts.length) { printTerm('Empty.\n', 'info'); return; }
    posts.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'entry-box';
        div.innerHTML = '<span class="eb-title">#' + (i + 1) + ' - ' + esc(p.title || 'Untitled') + '</span> <span class="eb-date">' + esc(p.date || '') + '</span>';
        if (currentIndex && p.slug) {
            div.addEventListener('click', () => { window.location.href = getPostUrl(cat, p.slug); });
        }
        output.appendChild(div);
    });
    printTerm('');
    output.scrollTop = output.scrollHeight;
}

function termCategories() {
    printTerm('\nCategories:', 'header');
    for (const [key, val] of Object.entries(CATEGORIES)) {
        const posts = data[key] || [];
        if (!posts.length) continue;
        printTerm('  ' + key.padEnd(12) + val.label + ' (' + posts.length + ')', 'category');
    }
    printTerm('');
}

function handleTermCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    printTerm('portfo@terminal ~ % ' + trimmed, 'dim');
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
        case 'help':
            printTerm('\nCommands:', 'header');
            printTerm('  help              Show this help');
            printTerm('  categories        List categories');
            printTerm('  list <category>   List posts');
            printTerm('  open <cat> <id>   Open post');
            printTerm('  clear             Clear screen');
            printTerm('  theme             Switch to normal');
            printTerm('  ascii             ASCII art\n', 'info');
            break;
        case 'categories': case 'cats': termCategories(); break;
        case 'list': case 'ls': {
            const cat = parts[1] && parts[1].toLowerCase();
            if (!cat || !CATEGORIES[cat]) { printTerm('Usage: list <category>', 'error'); break; }
            currentCat = cat; renderNav(); termList(cat);
            break;
        }
        case 'open': case 'show': {
            const cat = parts[1] && parts[1].toLowerCase();
            const id = parseInt(parts[2]);
            if (!cat || !CATEGORIES[cat] || isNaN(id)) { printTerm('Usage: open <category> <id>', 'error'); break; }
            const posts = data[cat] || [];
            const post = posts[id - 1];
            if (!post) { printTerm('Not found.', 'error'); break; }
            if (currentIndex && post.slug) { window.location.href = getPostUrl(cat, post.slug); }
            else {
                printTerm('\nTitle:  ' + (post.title || 'Untitled'), 'info');
                if (post.date) printTerm('Date:   ' + post.date, 'info');
                if (post.tags) printTerm('Tags:   ' + post.tags, 'info');
                if (post.image) printTerm('Image:  ' + post.image, 'info');
                printTerm('\n' + (post.body || '(empty)'), 'content');
                printTerm('');
            }
            break;
        }
        case 'clear': output.innerHTML = ''; break;
        case 'theme': setTheme('normal'); break;
        case 'ascii': printTerm(ASCII, 'ascii-art'); break;
        default: printTerm('Unknown: ' + cmd + '. Type "help".', 'error');
    }
}

cmdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { handleTermCommand(cmdInput.value); cmdInput.value = ''; }
});

document.addEventListener('click', (e) => {
    if (currentTheme === 'terminal' && !e.target.closest('button') && e.target !== cmdInput) cmdInput.focus();
});

setTheme(currentTheme);
loadData();
setInterval(loadData, 2000);
