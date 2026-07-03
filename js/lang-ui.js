(function () {

    var LANG_LABELS = {

        en: "EN",

        fr: "FR",

        de: "DE",

        es: "ES",

        it: "IT",

        "zh-CN": "ZH",

        ja: "JA",

        pt: "PT"

    };



    var nav = document.getElementById("langFlags");

    if (!nav) return;



    var buttons = Array.from(nav.querySelectorAll(".lang-btn"));

    if (!buttons.length) return;



    var langBar = nav.parentElement;

    var mainNav = document.getElementById("mainNav");



    nav.querySelectorAll(".lang-sep").forEach(function (sep) {

        sep.remove();

    });



    var dropdown = document.createElement("div");

    dropdown.className = "lang-dropdown lang-dropdown--nav";



    var toggle = document.createElement("button");

    toggle.type = "button";

    toggle.className = "lang-dropdown-toggle";

    toggle.setAttribute("aria-expanded", "false");

    toggle.setAttribute("aria-haspopup", "listbox");

    toggle.setAttribute("aria-controls", "langFlags");

    toggle.setAttribute("aria-label", "Choisir la langue");

    toggle.innerHTML =

        '<span class="lang-dropdown-code">FR</span>' +

        '<span class="lang-dropdown-chevron" aria-hidden="true">▼</span>';



    nav.classList.add("lang-dropdown-menu");

    nav.setAttribute("role", "listbox");

    nav.hidden = true;



    buttons.forEach(function (btn) {

        btn.setAttribute("role", "option");

        nav.appendChild(btn);

    });



    dropdown.appendChild(toggle);

    dropdown.appendChild(nav);



    if (mainNav) {

        var sep = document.createElement("span");

        sep.className = "nav-sep nav-sep--lang";

        sep.setAttribute("aria-hidden", "true");

        sep.textContent = "|";

        mainNav.appendChild(sep);

        mainNav.appendChild(dropdown);

    } else if (langBar) {

        langBar.appendChild(dropdown);

    }



    if (langBar && langBar.classList.contains("lang-bar")) {

        var status = document.getElementById("langStatus");

        var headerTop = document.querySelector(".header-top");

        if (status && headerTop && status.parentElement === langBar) {

            headerTop.appendChild(status);

        }

        langBar.remove();

    }



    function getActiveLang() {

        var active = dropdown.querySelector(".lang-btn.active");

        return active ? active.getAttribute("data-lang") : "fr";

    }



    function updateToggleLabel() {

        var lang = getActiveLang();

        var codeEl = toggle.querySelector(".lang-dropdown-code");

        if (codeEl) {

            codeEl.textContent = LANG_LABELS[lang] || lang.toUpperCase().slice(0, 2);

        }

    }



    function syncToggleDisabled() {

        var busy = buttons.some(function (btn) { return btn.disabled; });

        toggle.disabled = busy;

    }



    function openMenu() {

        if (toggle.disabled) return;

        dropdown.classList.add("is-open");

        nav.hidden = false;

        toggle.setAttribute("aria-expanded", "true");

    }



    function closeMenu() {

        dropdown.classList.remove("is-open");

        nav.hidden = true;

        toggle.setAttribute("aria-expanded", "false");

    }



    function toggleMenu() {

        if (dropdown.classList.contains("is-open")) {

            closeMenu();

        } else {

            openMenu();

        }

    }



    toggle.addEventListener("click", function (e) {

        e.stopPropagation();

        toggleMenu();

    });



    toggle.addEventListener("keydown", function (e) {

        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {

            e.preventDefault();

            if (!dropdown.classList.contains("is-open")) openMenu();

            var first = nav.querySelector(".lang-btn:not([disabled])");

            if (first) first.focus();

        }

    });



    nav.addEventListener("click", function (e) {

        if (e.target.closest(".lang-btn")) {

            closeMenu();

            updateToggleLabel();

        }

    });



    nav.addEventListener("keydown", function (e) {

        var items = Array.from(nav.querySelectorAll(".lang-btn:not([disabled])"));

        var index = items.indexOf(document.activeElement);



        if (e.key === "Escape") {

            closeMenu();

            toggle.focus();

        } else if (e.key === "ArrowDown") {

            e.preventDefault();

            var next = items[Math.min(index + 1, items.length - 1)];

            if (next) next.focus();

        } else if (e.key === "ArrowUp") {

            e.preventDefault();

            var prev = items[Math.max(index - 1, 0)];

            if (prev) prev.focus();

        }

    });



    document.addEventListener("click", function (e) {

        if (!dropdown.contains(e.target)) closeMenu();

    });



    document.addEventListener("weidler:langchange", function () {

        updateToggleLabel();

        closeMenu();

    });



    new MutationObserver(function () {

        updateToggleLabel();

        syncToggleDisabled();

    }).observe(nav, {

        subtree: true,

        attributes: true,

        attributeFilter: ["class", "disabled"]

    });



    updateToggleLabel();

    syncToggleDisabled();

})();

