(function () {
    var STORAGE_KEY = "ws-theme";
    var VALID = { auto: true, day: true, night: true };
    var QUEBEC_TZ = "America/Toronto";

    function getStored() {
        var value = localStorage.getItem(STORAGE_KEY);
        return VALID[value] ? value : "auto";
    }

    function getQuebecHour() {
        var parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: QUEBEC_TZ,
            hour: "numeric",
            hour12: false
        }).formatToParts(new Date());

        var hourPart = parts.find(function (part) {
            return part.type === "hour";
        });

        return hourPart ? parseInt(hourPart.value, 10) : 0;
    }

    function resolveEffective(mode) {
        if (mode === "day") return "day";
        if (mode === "night") return "night";
        var hour = getQuebecHour();
        return hour >= 6 && hour < 20 ? "day" : "night";
    }

    function updateMetaThemeColor(effective) {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        meta.setAttribute("content", effective === "day" ? "#fafbfd" : "#0a0e1a");
    }

    function updateModeButtons(mode) {
        document.querySelectorAll(".theme-mode-btn").forEach(function (btn) {
            btn.classList.toggle("active", btn.getAttribute("data-theme-mode") === mode);
        });
    }

    function apply(mode) {
        var effective = resolveEffective(mode);
        document.documentElement.setAttribute("data-theme", mode);
        document.documentElement.setAttribute("data-theme-effective", effective);
        updateMetaThemeColor(effective);
        updateModeButtons(mode);
    }

    function setTheme(mode) {
        if (!VALID[mode]) return;
        localStorage.setItem(STORAGE_KEY, mode);
        apply(mode);
    }

    function closeDrawer() {
        var drawer = document.getElementById("themeDrawer");
        var tab = document.getElementById("themeDrawerTab");
        if (!drawer || !tab) return;
        drawer.classList.remove("is-open");
        tab.setAttribute("aria-expanded", "false");
    }

    function toggleDrawer() {
        var drawer = document.getElementById("themeDrawer");
        var tab = document.getElementById("themeDrawerTab");
        if (!drawer || !tab) return;
        var isOpen = drawer.classList.toggle("is-open");
        tab.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    function mountThemeDrawer() {
        if (document.getElementById("themeDrawer")) return;

        var drawer = document.createElement("div");
        drawer.className = "theme-drawer";
        drawer.id = "themeDrawer";
        drawer.innerHTML =
            '<button type="button" class="theme-drawer-tab" id="themeDrawerTab" aria-label="Thème" aria-expanded="false" aria-controls="themeDrawerPanel">' +
                '<span class="theme-drawer-tab-grip" aria-hidden="true"></span>' +
            "</button>" +
            '<div class="theme-drawer-panel" id="themeDrawerPanel">' +
                '<div class="theme-drawer-panel-inner">' +
                    '<p class="theme-drawer-label" data-translate>Thème</p>' +
                    '<div class="theme-drawer-actions">' +
                        '<button type="button" class="theme-mode-btn" data-theme-mode="auto">Auto</button>' +
                        '<button type="button" class="theme-mode-btn" data-theme-mode="day">Jour</button>' +
                        '<button type="button" class="theme-mode-btn" data-theme-mode="night">Nuit</button>' +
                    "</div>" +
                "</div>" +
            "</div>";

        document.body.appendChild(drawer);
        syncDrawerHost();

        var tab = document.getElementById("themeDrawerTab");
        tab.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleDrawer();
        });

        drawer.querySelectorAll(".theme-mode-btn").forEach(function (btn) {
            btn.addEventListener("click", function (event) {
                event.stopPropagation();
                setTheme(btn.getAttribute("data-theme-mode"));
            });
        });

        document.addEventListener("click", function (event) {
            if (!drawer.classList.contains("is-open")) return;
            if (drawer.contains(event.target)) return;
            closeDrawer();
        });

        updateModeButtons(getStored());
    }

    function syncDrawerHost() {
        var drawer = document.getElementById("themeDrawer");
        if (!drawer) return;

        var header = document.querySelector(".site-header");
        var mobile = window.matchMedia("(max-width: 640px)").matches;

        if (mobile && header) {
            header.appendChild(drawer);
        } else {
            document.body.appendChild(drawer);
        }
    }

    apply(getStored());

    window.WeidlerTheme = {
        getTheme: getStored,
        setTheme: setTheme,
        apply: apply,
        resolveEffective: resolveEffective
    };

    setInterval(function () {
        if (getStored() === "auto") {
            apply("auto");
        }
    }, 60000);

    document.addEventListener("DOMContentLoaded", function () {
        mountThemeDrawer();
        updateModeButtons(getStored());
    });

    window.addEventListener("resize", syncDrawerHost, { passive: true });
})();
