// Reveal-on-scroll, contact form and star rating for the Contact and About sections.
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

/* Contact form: inline validation, not on-submit surprises */
const form = document.querySelector("#contact-form");

if (form) {
    const status = form.querySelector(".form-status");
    const submit = form.querySelector("button[type=submit]");

    const messages = {
        first: "Please enter your first name.",
        last: "Please enter your last name.",
        email: "Please enter a valid email so we can reply.",
        message: "Write us a short message — even one line helps.",
    };

    function validate(input) {
        const field = input.closest(".field");
        const error = field.querySelector(".error");
        const ok = input.checkValidity() && input.value.trim() !== "";
        field.classList.toggle("has-error", !ok);
        input.setAttribute("aria-invalid", String(!ok));
        if (error) error.textContent = ok ? "" : messages[input.name] || "This field is required.";
        return ok;
    }

    const inputs = [...form.querySelectorAll("[required]")];

    inputs.forEach((input) => {
        input.addEventListener("blur", () => validate(input));
        // once flagged, clear the error as soon as it's fixed
        input.addEventListener("input", () => {
            if (input.closest(".field").classList.contains("has-error")) validate(input);
        });
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const results = inputs.map(validate);
        if (results.includes(false)) {
            inputs[results.indexOf(false)].focus();
            status.classList.remove("is-ok");
            status.textContent = "Almost there — check the highlighted fields.";
            return;
        }
        // No backend yet: this confirms locally. Wire the fetch/mailto here.
        submit.disabled = true;
        status.classList.add("is-ok");
        status.textContent = "Thank you! We've got your message and will reply soon.";
        form.reset();
        setTimeout(() => { submit.disabled = false; }, 1200);
    });
}

/* Star rating: fills on hover, commits on press (local only for now) */
const stars = [...document.querySelectorAll(".star")];

if (stars.length) {
    const note = document.querySelector(".rating-note");
    let rating = 0;

    const paint = (n) => stars.forEach((s, i) => s.classList.toggle("is-on", i < n));

    stars.forEach((star, i) => {
        star.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") paint(i + 1); });
        star.addEventListener("pointerdown", () => paint(i + 1));   // respond on press
        star.addEventListener("click", () => {
            rating = i + 1;
            stars.forEach((s, j) => s.setAttribute("aria-checked", String(j === i)));
            note.textContent = `Thanks for rating us ${rating} out of 5!`;
        });
    });
    stars[0].parentElement.addEventListener("pointerleave", () => paint(rating));
}

})();
