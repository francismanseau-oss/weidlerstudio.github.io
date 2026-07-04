(function () {
    var SWIPE_PAGES = [
        { id: "home", path: "index.html" },
        { id: "services", path: "services/index.html" },
        { id: "projects", path: "projects/index.html" },
        { id: "submission", path: "soumission/index.html" },
        { id: "about", path: "about/index.html" },
        { id: "contact", path: "contact/index.html" }
    ];

    var MOBILE_MAX = 640;
    var MIN_SWIPE = 72;
    var MAX_VERTICAL = 48;

    var touchStartX = 0;
    var touchStartY = 0;

    function isMobile() {
        return window.matchMedia("(max-width: " + MOBILE_MAX + "px)").matches;
    }

    function isSwipeEnabled() {
        if (!isMobile()) return false;
        if (document.body.classList.contains("mobile-swipe-disabled")) return false;
        return SWIPE_PAGES.some(function (page) {
            return page.id === document.body.getAttribute("data-nav-active");
        });
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

    document.addEventListener("touchstart", function (event) {
        if (!isSwipeEnabled() || event.touches.length !== 1) return;

        var tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }, { passive: true });

    document.addEventListener("touchend", function (event) {
        if (!isSwipeEnabled() || !event.changedTouches.length) return;

        var touch = event.changedTouches[0];
        var deltaX = touch.clientX - touchStartX;
        var deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaY) > MAX_VERTICAL) return;
        if (Math.abs(deltaX) < MIN_SWIPE) return;

        var index = getCurrentIndex();
        if (index < 0) return;

        if (deltaX < 0) {
            navigateTo(index + 1);
        } else {
            navigateTo(index - 1);
        }
    }, { passive: true });
})();
