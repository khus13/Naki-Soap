// Reveal-on-scroll for the About section.
(() => {
/* Reveal on scroll */
const revealTargets = [...document.querySelectorAll("[data-reveal]")];
revealTargets.forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
        }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealTargets.forEach((el) => io.observe(el));
} else {
    revealTargets.forEach((el) => el.classList.add("is-in"));
}

/* Reviews: cards are rendered from this list, add a review by adding a line */
const reviews = [
    { name: "Auditor Dianne", meta: "Facebook · September 26, 2025", text: "Absolutely love Naki's soaps especially the Glowing Skin variant (the scent is mild but comforting— reminds me of coffee and roses)!!! 100/10 💞 As someone with skin eczema, using the soaps did not cause any harsh after effects with my skin so all 3 are sensitive skin approved. I also like that the soaps doesn't have any strong scents and does not feel drying after use. Must try!—" },
    { name: "Vanessa Joy Leopardas", meta: "Facebook · May 31, 2025", text: "I highly recommend Naki soap. Personal experience: I have a very sensitive skin especially my face. My face would react to soaps and expensive products hence I don't put anything on my face. Then one day I get to have bonding moment with my friend who created naki. I had one pimple on my face when we met. She said she brought soap. Just try it out. 2 days later, no more pimple! 🥰💜" },
    { name: "Sue Mari Enriquez-Macachor", meta: "Facebook comment", text: "wow wow wow! tried all & superrrr nice sa skin. my personal faves: For glowing skin w/petals 🫶🧼" },
    { name: "Mr Gay Sugbo Organization", meta: "Facebook · March 21", text: "Our sincere appreciation to Naki's Soap for their wonderful support of Mister Gay Sugbo 2026! Your dedication to self-care and confidence perfectly aligns with our mission of empowering our 24 finalists to shine, inside and out. 🌈💖 With partners like you, we continue to celebrate authenticity, pride, and the beauty of individuality on and off the stage. Thank you for believing in our candidates and for being part of this inspiring journey. Together, we make the Mister Gay Sugbo Experience even more radiant!" },
];

const track = document.querySelector(".review-track");
const makeReviewCard = ({ name, meta, text }) => {
    const card = document.createElement("article");
    card.className = "review-card";

    const head = document.createElement("div");
    head.className = "review-head";
    const avatar = document.createElement("span");
    avatar.className = "review-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = name.split(" ").slice(0, 2).map((word) => word[0]).join("");

    const author = document.createElement("div");
    const authorName = document.createElement("b");
    authorName.textContent = name;
    const reviewMeta = document.createElement("small");
    reviewMeta.textContent = meta;
    author.append(authorName, reviewMeta);
    head.append(avatar, author);

    const stars = document.createElement("div");
    stars.className = "review-stars";
    stars.setAttribute("role", "img");
    stars.setAttribute("aria-label", "5 out of 5 stars");
    stars.textContent = "★★★★★";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    card.append(head, stars, paragraph);
    return card;
};

track.replaceChildren(...reviews.map(makeReviewCard));

// Slideshow: one review at a time, fades to the next every 5s; dots jump to any review
const cards = [...track.children];
const dotsEl = document.querySelector(".review-dots");
reviews.forEach(({ name }) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", `Review by ${name}`);
    dotsEl.append(dot);
});
const dots = [...dotsEl.children];
const carousel = document.querySelector(".review-carousel");
const previous = document.querySelector(".review-control--prev");
const next = document.querySelector(".review-control--next");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let current = 0, timer;
let hovering = false;

const play = () => {
    clearTimeout(timer);
    if (motionPreference.matches || hovering || carousel.matches(":focus-within") || document.hidden) return;
    timer = setTimeout(() => show(current + 1), 5000);
};

const show = (i) => {
    current = (i + cards.length) % cards.length;
    cards.forEach((card, n) => {
        card.classList.toggle("is-active", n === current);
        card.setAttribute("aria-hidden", String(n !== current));
    });
    dots.forEach((dot, n) => {
        dot.style.setProperty("--dist", Math.abs(n - current));   // same fade as the product dots
        if (n === current) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
    });
    play();                                                       // any change restarts the countdown
};

dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));
previous.addEventListener("click", () => show(current - 1));
next.addEventListener("click", () => show(current + 1));
carousel.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
        hovering = true;
        clearTimeout(timer);
    }
});
carousel.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
        hovering = false;
        play();
    }
});
carousel.addEventListener("focusin", () => clearTimeout(timer));
carousel.addEventListener("focusout", () => setTimeout(play));
document.addEventListener("visibilitychange", play);
motionPreference.addEventListener("change", play);
show(0);

})();