(function () {
    var SWIPE_PAGES = [
        { id: "home", path: "index.html" },
        { id: "services", path: "services/index.html" },
        { id: "projects", path: "projects/index.html" },
        { id: "submission", path: "soumission/index.html" },
        { id: "about", path: "about/index.html" },
        { id: "contact", path: "contact/index.html" }
    ];

    var PAGE_LABELS = {
        home: "Accueil",
        services: "Services",
        projects: "Projets",
        submission: "Soumission",
        about: "À propos",
        contact: "Contact"
    };

    var MOBILE_MAX = 640;
    var MIN_SWIPE_DISTANCE = 52;
    var FLICK_DISTANCE = 36;
    var MIN_FLICK_VELOCITY = 0.32;
    var LOCK_THRESHOLD = 10;
    var HORIZONTAL_RATIO = 1.25;
    var MAX_SWIPE_DURATION = 750;

    var IGNORE_SELECTOR =
        "input, textarea, select, button, a, label, " +
        "[contenteditable='true'], .lang-dropdown, .theme-drawer, " +
        ".main-nav.open, .mobile-swipe-hint";

    var PREV_SVG =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="15 18 9 12 15 6"/></svg>';
    var NEXT_SVG =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="9 18 15 12 9 6"/></svg>';

    var tracking = null;
    var uiMounted = false;

    function isMobile() {
        return window.matchMedia("(max-width: " + MOBILE_MAX + "px)").matches;
    }

    function isSwipeEnabled() {
        if (!isMobile()) return false;
        if (document.body.classList.contains("mobile-swipe-disabled")) return false;
        return getCurrentIndex() >= 0;
    }

    function getCurrentIndex() {
        var active = document.body.getAttribute("data-nav-active");
        return SWIPE_PAGES.findIndex(function (page) {
            return page.id === active;
        });
    }

    function navigateTo(index) {
        if (index < 0 || index >= SWIPE_PAGES.length) return;
        var root = document.body.getAttribute("data-nav-root") || "";
        window.location.href = root + SWIPE_PAGES[index].path;
    }

    function shouldIgnoreTouch(target) {
        return !!(target && target.closest && target.closest(IGNORE_SELECTOR));
    }

    function findTouch(list, identifier) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].identifier === identifier) return list[i];
        }
        return null;
    }

    function resetTracking() {
        tracking = null;
    }

    function isHorizontalSwipe(deltaX, deltaY, elapsed, lock) {
        if (lock === "v") return false;
        if (lock === "h") return true;

        var absX = Math.abs(deltaX);
        var absY = Math.abs(deltaY);
        if (absX < absY * HORIZONTAL_RATIO) return false;

        var distanceOk = absX >= MIN_SWIPE_DISTANCE;
        var flickOk = absX >= FLICK_DISTANCE && absX / Math.max(elapsed, 1) >= MIN_FLICK_VELOCITY;
        return distanceOk || flickOk;
    }

    function updateProgress() {
        var progress = document.getElementById("mobilePageProgress");
        if (!progress) return;

        var index = getCurrentIndex();
        if (index < 0) {
            progress.hidden = true;
            return;
        }

        var page = SWIPE_PAGES[index];
        var labelEl = progress.querySelector(".mobile-page-progress__label");
        var stepEl = progress.querySelector(".mobile-page-progress__step");

        if (labelEl) {
            labelEl.textContent = PAGE_LABELS[page.id] || page.id;
            labelEl.setAttribute("data-translate", "");
        }
        if (stepEl) {
            stepEl.textContent = " (" + (index + 1) + "/" + SWIPE_PAGES.length + ")";
        }

        progress.hidden = !isMobile();
    }

    function updateHints() {
        var hints = document.getElementById("mobileSwipeHints");
        var prev = hints && hints.querySelector(".mobile-swipe-hint--prev");
        var next = hints && hints.querySelector(".mobile-swipe-hint--next");
        if (!hints || !prev || !next) return;

        var index = getCurrentIndex();
        var showContainer = isMobile() && index >= 0;
        hints.hidden = !showContainer;

        if (!showContainer) return;

        var enabled = isSwipeEnabled();
        prev.hidden = !enabled || index <= 0;
        next.hidden = !enabled || index >= SWIPE_PAGES.length - 1;
    }

    function playHintIntro() {
        if (!isMobile() || !isSwipeEnabled()) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        var hints = document.getElementById("mobileSwipeHints");
        if (!hints || hints.hidden) return;

        hints.querySelectorAll(".mobile-swipe-hint").forEach(function (btn) {
            if (btn.hidden) return;

            btn.classList.remove("is-intro");
            void btn.offsetWidth;
            btn.classList.add("is-intro");

            btn.addEventListener("animationend", function onEnd(event) {
                if (event.animationName !== "mobile-swipe-hint-intro") return;
                btn.classList.remove("is-intro");
                btn.removeEventListener("animationend", onEnd);
            });
        });
    }

    function refreshUi() {
        updateProgress();
        updateHints();
    }

    function mountUi() {
        if (getCurrentIndex() < 0) return;
        if (uiMounted) {
            refreshUi();
            return;
        }

        var headerTop = document.querySelector(".header-top");
        var toggle = document.querySelector(".nav-toggle");
        if (!headerTop || !toggle) return;

        var progress = document.createElement("div");
        progress.id = "mobilePageProgress";
        progress.className = "mobile-page-progress";
        progress.innerHTML =
            '<span class="mobile-page-progress__label" data-translate></span>' +
            '<span class="mobile-page-progress__step" aria-hidden="true"></span>';
        headerTop.insertBefore(progress, toggle);

        var hints = document.createElement("div");
        hints.id = "mobileSwipeHints";
        hints.className = "mobile-swipe-hints";
        hints.hidden = true;
        hints.innerHTML =
            '<button type="button" class="mobile-swipe-hint mobile-swipe-hint--prev" aria-label="Page précédente" hidden>' +
            PREV_SVG +
            "</button>" +
            '<button type="button" class="mobile-swipe-hint mobile-swipe-hint--next" aria-label="Page suivante" hidden>' +
            NEXT_SVG +
            "</button>";
        document.body.appendChild(hints);

        hints.querySelector(".mobile-swipe-hint--prev").addEventListener("click", function () {
            if (!isSwipeEnabled()) return;
            navigateTo(getCurrentIndex() - 1);
        });

        hints.querySelector(".mobile-swipe-hint--next").addEventListener("click", function () {
            if (!isSwipeEnabled()) return;
            navigateTo(getCurrentIndex() + 1);
        });

        uiMounted = true;
        refreshUi();
        requestAnimationFrame(function () {
            requestAnimationFrame(playHintIntro);
        });
    }

    function onTouchStart(event) {
        if (!isSwipeEnabled() || event.touches.length !== 1) {
            resetTracking();
            return;
        }

        if (shouldIgnoreTouch(event.target)) {
            resetTracking();
            return;
        }

        var touch = event.touches[0];
        tracking = {
            id: touch.identifier,
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now(),
            lock: null
        };
    }

    function onTouchMove(event) {
        if (!tracking || !isSwipeEnabled()) return;

        var touch = findTouch(event.touches, tracking.id);
        if (!touch || tracking.lock) return;

        var deltaX = touch.clientX - tracking.startX;
        var deltaY = touch.clientY - tracking.startY;
        var absX = Math.abs(deltaX);
        var absY = Math.abs(deltaY);

        if (absX < LOCK_THRESHOLD && absY < LOCK_THRESHOLD) return;

        if (absX > absY * HORIZONTAL_RATIO) {
            tracking.lock = "h";
            return;
        }

        if (absY > absX * HORIZONTAL_RATIO) {
            tracking.lock = "v";
        }
    }

    function onTouchEnd(event) {
        if (!tracking || !isSwipeEnabled()) {
            resetTracking();
            return;
        }

        var touch = findTouch(event.changedTouches, tracking.id);
        if (!touch) return;

        var deltaX = touch.clientX - tracking.startX;
        var deltaY = touch.clientY - tracking.startY;
        var elapsed = Date.now() - tracking.startTime;
        var lock = tracking.lock;
        resetTracking();

        if (elapsed > MAX_SWIPE_DURATION) return;
        if (!isHorizontalSwipe(deltaX, deltaY, elapsed, lock)) return;

        var index = getCurrentIndex();
        if (index < 0) return;

        if (deltaX < 0) {
            navigateTo(index + 1);
        } else {
            navigateTo(index - 1);
        }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", resetTracking, { passive: true });

    window.addEventListener("resize", refreshUi, { passive: true });
    window.addEventListener("pageshow", function (event) {
        refreshUi();
        if (event.persisted) {
            requestAnimationFrame(function () {
                requestAnimationFrame(playHintIntro);
            });
        }
    });

    if (typeof MutationObserver !== "undefined") {
        var bodyObserver = new MutationObserver(function () {
            refreshUi();
            if (!isSwipeEnabled()) resetTracking();
        });
        bodyObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"]
        });
    }

    mountUi();
})();
