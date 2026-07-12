const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let w, h, particles, mouseX = 0, mouseY = 0;

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}

function createParticles() {
    particles = [];
    const count = Math.floor((w * h) / 18000);
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.5 + 0.5,
            o: Math.random() * 0.3 + 0.1
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(230, 184, 0, ' + p.o + ')';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = 'rgba(230, 184, 0, ' + (0.08 * (1 - dist / 120)) + ')';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        const mdx = p.x - mouseX;
        const mdy = p.y - mouseY;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 200) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.strokeStyle = 'rgba(230, 184, 0, ' + (0.15 * (1 - mdist / 200)) + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }

    requestAnimationFrame(draw);
}

window.addEventListener('resize', () => { resize(); createParticles(); });
document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

resize();
createParticles();
draw();
