const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

class Spring {
    constructor(value, onUpdate, { damping = 1, response = 0.4 } = {}) {
        this.value = value;
        this.target = value;
        this.velocity = 0;
        this.damping = damping;
        this.response = response;
        this.onUpdate = onUpdate;
        this.frame = null;
    }

    to(target, { velocity, damping, response } = {}) {
        this.target = target;
        if (velocity !== undefined) this.velocity = velocity;
        if (damping !== undefined) this.damping = damping;
        if (response !== undefined) this.response = response;

        if (reduceMotion.matches) return this.jump(target);
        if (!this.frame) {
            this.last = performance.now();
            this.frame = requestAnimationFrame(this.tick);
        }
    }

    // Set the value immediately (used while tracking a finger 1:1)
    jump(value) {
        this.stop();
        this.value = this.target = value;
        this.velocity = 0;
        this.onUpdate(value);
    }

    stop() {
        cancelAnimationFrame(this.frame);
        this.frame = null;
    }

    tick = (now) => {
        // rAF timestamps can be slightly older than performance.now()
        const dt = Math.min(Math.max(now - this.last, 0) / 1000, 1 / 30);
        this.last = now;

        const stiffness = (2 * Math.PI / this.response) ** 2;
        const friction = (4 * Math.PI * this.damping) / this.response;

        // a few sub-steps keep the integration stable on slow frames
        const steps = 4;
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
            const accel = -stiffness * (this.value - this.target) - friction * this.velocity;
            this.velocity += accel * h;
            this.value += this.velocity * h;
        }

        if (Math.abs(this.value - this.target) < 0.05 && Math.abs(this.velocity) < 5) {
            this.value = this.target;
            this.velocity = 0;
            this.frame = null;
        } else {
            this.frame = requestAnimationFrame(this.tick);
        }
        this.onUpdate(this.value);
    };
}

// Apple's momentum projection: where would a flick come to rest?
function project(velocity, decelerationRate = 0.998) {
    return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// Progressive resistance past an edge instead of a hard stop
function rubberband(overshoot, dimension, constant = 0.55) {
    return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}


/* Sticky nav: material on scroll + sliding active indicator */
const header = document.querySelector(".site-header");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const indicator = document.querySelector(".nav-indicator");
let activeLink = navLinks[0];

const indicatorX = new Spring(0, render, { response: 0.35 });
const indicatorW = new Spring(0, render, { response: 0.35 });

function render() {
    indicator.style.transform = `translate3d(${indicatorX.value}px, 0, 0)`;
    indicator.style.width = `${Math.max(indicatorW.value, 0)}px`;
}

const INDICATOR_OVERHANG = 6;   // px the underline extends past each side of the word

function placeIndicator(animate = true) {
    const x = activeLink.offsetLeft - INDICATOR_OVERHANG;
    const w = activeLink.offsetWidth + INDICATOR_OVERHANG * 2;
    if (animate) {
        indicatorX.to(x);
        indicatorW.to(w);
    } else {
        indicatorX.jump(x);
        indicatorW.jump(w);
    }
}

function setActive(link) {
    if (link === activeLink) return;
    activeLink.classList.remove("active");
    activeLink.removeAttribute("aria-current");
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
    activeLink = link;
    placeIndicator();
}

// Which section is under the nav right now?
const sections = ["home", "products", "contact"].map((id) => document.getElementById(id));
let currentSection = "home";
let followScroll = true;

function sectionInView() {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) return "contact";
    const line = window.innerHeight * 0.4;
    let id = "home";
    for (const s of sections) if (s.getBoundingClientRect().top <= line) id = s.id;
    return id;
}

// scroll events already arrive at most once per frame
function onScroll() {
    header.classList.toggle("is-stuck", window.scrollY > 8);

    const id = sectionInView();
    if (followScroll && id !== currentSection) {
        currentSection = id;
        setActive(navLinks.find((a) => a.dataset.section === id));
    }
}

// A clicked link wins until the scroll it started has finished
let settleTimer;
function releaseAfterScroll() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
        followScroll = true;
        currentSection = sectionInView();
    }, 140);
}

navLinks.forEach((link) => {
    // respond on press, not on release
    link.addEventListener("pointerdown", () => setActive(link));
    link.addEventListener("click", () => {
        setActive(link);
        followScroll = false;
        releaseAfterScroll();
    });
});

window.addEventListener("scroll", () => {
    if (!followScroll) releaseAfterScroll();
    onScroll();
}, { passive: true });

// Re-measure whenever a link's box changes — e.g. when the web font swaps
// in after the fallback font, or the window resizes.
const linkObserver = new ResizeObserver(() => placeIndicator(false));
navLinks.forEach((link) => linkObserver.observe(link));
window.addEventListener("resize", () => placeIndicator(false));
placeIndicator(false);
onScroll();

/* Product carousel: 1:1 drag, rubber-band edges, momentum + springs */
const products = [
    {
        title: "Germicidal Soap",
        desc: "lorem ipsum dolor sit amet consectetur adipiscing elit provident ut aute imperdiet eligendi occaeca. lorem ipsum dolor sit amet consectetur adipiscing elit provident ut aute imperdiet eligendi occaeca. The seasons too overrated, unsa font ma suggest nimo",
    },
    {
        title: "Sensitive Skin",
        desc: "lorem ipsum dolor sit amet consectetur adipiscing elit provident ut aute imperdiet eligendi occaeca. Gentle on delicate skin, made with soothing natural oils. The seasons too overrated, unsa font ma suggest nimo",
    },
    {
        title: "Glowing Skin",
        desc: "lorem ipsum dolor sit amet consectetur adipiscing elit provident ut aute imperdiet eligendi occaeca. Brightens and nourishes for a natural glow. The seasons too overrated, unsa font ma suggest nimo",
    },
];

const viewport = document.querySelector(".slides");
const track = document.querySelector(".track");
const dots = [...document.querySelectorAll(".dot")];
const info = document.querySelector(".product-info");
const title = document.querySelector(".product-title");
const desc = document.querySelector(".product-desc");
const GAP = 40;
let current = 0;

const trackX = new Spring(0, (x) => {
    track.style.transform = `translate3d(${x}px, 0, 0)`;
});

const stepSize = () => track.clientWidth + GAP;
const minX = () => -(products.length - 1) * stepSize();

let textTimer;
function showText(index, direction) {
    clearTimeout(textTimer);
    info.classList.remove("fade-next", "fade-prev");
    void info.offsetWidth;
    info.classList.add(direction > 0 ? "fade-next" : "fade-prev");
    textTimer = setTimeout(() => {
        title.textContent = products[index].title;
        desc.textContent = products[index].desc;
        info.classList.remove("fade-next", "fade-prev");
    }, 180);
}

function goTo(index, { velocity = 0, damping = 1 } = {}) {
    index = Math.max(0, Math.min(products.length - 1, index));
    if (index !== current) {
        dots[current].classList.remove("is-active");
        dots[current].removeAttribute("aria-current");
        dots[index].classList.add("is-active");
        dots[index].setAttribute("aria-current", "true");
        showText(index, index - current);
        current = index;
    }
    trackX.to(-index * stepSize(), { velocity, damping, response: 0.4 });
}

dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));

document.querySelectorAll("[data-product]").forEach((link) =>
    link.addEventListener("click", () => goTo(Number(link.dataset.product)))
);

viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { goTo(current + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { goTo(current - 1); e.preventDefault(); }
});

// --- drag ---
const THRESHOLD = 10;   // px of movement before committing to a direction
let drag = null;

viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    trackX.stop();       // grab it mid-flight, from where it is on screen
    drag = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origin: trackX.value,
        axis: null,
        history: [{ x: e.clientX, t: e.timeStamp }],
    };
});

viewport.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.axis) {
        if (Math.abs(dx) > THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
            drag.axis = "x";
            drag.startX = e.clientX;   // start tracking from here, so there's no jump
            viewport.setPointerCapture(e.pointerId);
            viewport.classList.add("is-dragging");
        } else if (Math.abs(dy) > THRESHOLD) {
            drag.axis = "y";            // it's a page scroll, let it go
        }
        return;
    }
    if (drag.axis !== "x") return;

    let x = drag.origin + (e.clientX - drag.startX);
    const width = viewport.clientWidth;
    if (x > 0) x = rubberband(x, width);
    if (x < minX()) x = minX() - rubberband(minX() - x, width);
    trackX.jump(x);

    drag.history.push({ x: e.clientX, t: e.timeStamp });
    while (drag.history.length > 2 && e.timeStamp - drag.history[0].t > 100) drag.history.shift();
});

function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const wasDragging = drag.axis === "x";
    const h = drag.history;
    drag = null;
    viewport.classList.remove("is-dragging");

    if (!wasDragging) {
        if (trackX.target !== trackX.value) goTo(current);   // tap during motion: settle
        return;
    }

    const first = h[0];
    const last = h[h.length - 1];
    const dt = (last.t - first.t) / 1000;
    const velocity = dt > 0 ? (last.x - first.x) / dt : 0;   // px/s

    // project where the flick is heading, then choose the nearest slide
    const projected = trackX.value + project(velocity);
    let index = Math.round(-projected / stepSize());
    index = Math.max(current - 1, Math.min(current + 1, index));

    // only overshoot when the gesture carried momentum
    goTo(index, { velocity, damping: Math.abs(velocity) > 300 ? 0.8 : 1 });
}

viewport.addEventListener("pointerup", endDrag);
viewport.addEventListener("pointercancel", endDrag);

window.addEventListener("resize", () => trackX.jump(-current * stepSize()));
