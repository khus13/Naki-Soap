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

})();
