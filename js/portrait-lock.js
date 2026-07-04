(function () {
    var LANDSCAPE_PHONE =
        "(orientation: landscape) and (max-height: 500px) and (pointer: coarse)";

    var ROTATE_SVG =
        '<svg class="portrait-lock-icon" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<rect x="7" y="2.5" width="10" height="19" rx="2.2" opacity="0.85"/>' +
        '<path d="M12 17.5h.01"/>' +
        '<path d="M16.5 6.5a4.5 4.5 0 0 0-6.2 6.2L9 13"/>' +
        '<polyline points="7 10.5 9 13 11.5 10.5"/>' +
        "</svg>";

    function shouldLock() {
        return window.matchMedia(LANDSCAPE_PHONE).matches;
    }

    function mountOverlay() {
        if (document.getElementById("portraitLockOverlay")) return;

        var overlay = document.createElement("div");
        overlay.id = "portraitLockOverlay";
        overlay.className = "portrait-lock-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML =
            ROTATE_SVG +
            '<p class="portrait-lock-message" data-translate>' +
            "Tournez votre téléphone en mode vertical pour une meilleure expérience." +
            "</p>";
        document.body.appendChild(overlay);
    }

    function updateLock() {
        mountOverlay();
        document.body.classList.toggle("portrait-lock-active", shouldLock());
    }

    window.addEventListener("resize", updateLock, { passive: true });
    window.addEventListener("orientationchange", updateLock, { passive: true });

    if (window.matchMedia) {
        var media = window.matchMedia(LANDSCAPE_PHONE);
        if (typeof media.addEventListener === "function") {
            media.addEventListener("change", updateLock);
        } else if (typeof media.addListener === "function") {
            media.addListener(updateLock);
        }
    }

    updateLock();
})();
