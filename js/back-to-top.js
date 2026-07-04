(function () {
    var MAIN_PAGES = {
        home: true,
        services: true,
        projects: true,
        submission: true,
        about: true,
        contact: true
    };

    var SHOW_AFTER = 320;

    function mountBackToTop() {
        var active = document.body.getAttribute("data-nav-active");
        if (!MAIN_PAGES[active]) return;
        if (document.getElementById("siteBackTop")) return;

        var wrap = document.createElement("div");
        wrap.className = "site-back-top";
        wrap.id = "siteBackTop";
        wrap.innerHTML = '<button type="button" class="site-back-top-btn" aria-label="Remonter en haut">↑ Haut</button>';
        document.body.appendChild(wrap);

        var btn = wrap.querySelector(".site-back-top-btn");

        function updateVisibility() {
            wrap.classList.toggle("is-visible", window.scrollY > SHOW_AFTER);
        }

        btn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        window.addEventListener("scroll", updateVisibility, { passive: true });
        updateVisibility();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountBackToTop);
    } else {
        mountBackToTop();
    }
})();
