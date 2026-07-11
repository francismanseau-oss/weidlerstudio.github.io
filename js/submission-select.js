(function () {
    var MOBILE_MQ = "(max-width: 640px)";
    var SELECT_IDS = [
        "requestType",
        "platformType",
        "budgetType",
        "budgetAmount",
        "timelineType"
    ];

    var wrappers = [];
    var mounted = false;

    function isMobile() {
        return window.matchMedia(MOBILE_MQ).matches;
    }

    function getSelectedLabel(select) {
        var option = select.options[select.selectedIndex];
        return option ? option.textContent.trim() : "";
    }

    function closeMenu(wrapper) {
        wrapper.dropdown.classList.remove("is-open");
        wrapper.toggle.setAttribute("aria-expanded", "false");
        wrapper.menu.hidden = true;
    }

    function closeAll(except) {
        wrappers.forEach(function (wrapper) {
            if (wrapper !== except && wrapper.dropdown.classList.contains("is-open")) {
                closeMenu(wrapper);
            }
        });
    }

    function openMenu(wrapper) {
        closeAll(wrapper);
        wrapper.dropdown.classList.add("is-open");
        wrapper.toggle.setAttribute("aria-expanded", "true");
        wrapper.menu.hidden = false;
    }

    function syncToggle(wrapper) {
        var label = wrapper.toggle.querySelector(".submission-select-label");
        if (label) {
            label.textContent = getSelectedLabel(wrapper.select);
        }

        wrapper.menu.querySelectorAll(".submission-select-option").forEach(function (btn) {
            var selected = btn.getAttribute("data-value") === wrapper.select.value;
            btn.classList.toggle("is-selected", selected);
            btn.setAttribute("aria-selected", selected ? "true" : "false");
        });

        wrapper.toggle.classList.toggle(
            "submission-field-invalid",
            wrapper.select.classList.contains("submission-field-invalid")
        );
    }

    function buildMenu(select, menu) {
        menu.innerHTML = "";

        Array.from(select.options).forEach(function (option) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "submission-select-option";
            btn.setAttribute("role", "option");
            btn.setAttribute("data-value", option.value);
            btn.textContent = option.textContent.trim();

            if (option.selected) {
                btn.classList.add("is-selected");
                btn.setAttribute("aria-selected", "true");
            } else {
                btn.setAttribute("aria-selected", "false");
            }

            menu.appendChild(btn);
        });
    }

    function mountSelect(select) {
        if (!select || select.closest(".submission-select-custom")) {
            return null;
        }

        var parent = select.parentNode;
        var dropdown = document.createElement("div");
        dropdown.className = "submission-select-custom";

        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "submission-select-toggle";
        toggle.setAttribute("aria-haspopup", "listbox");
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML =
            '<span class="submission-select-label"></span>' +
            '<span class="submission-select-chevron" aria-hidden="true">▼</span>';

        var menu = document.createElement("div");
        menu.className = "submission-select-menu";
        menu.setAttribute("role", "listbox");
        menu.hidden = true;

        var labelId = select.id;
        if (labelId) {
            var menuId = labelId + "CustomMenu";
            var toggleId = labelId + "CustomToggle";
            menu.id = menuId;
            toggle.id = toggleId;
            toggle.setAttribute("aria-controls", menuId);

            var labelEl = document.querySelector('label[for="' + labelId + '"]');
            if (labelEl) {
                if (!labelEl.id) {
                    labelEl.id = labelId + "Label";
                }
                toggle.setAttribute("aria-labelledby", labelEl.id);
            }
        }

        parent.insertBefore(dropdown, select);
        dropdown.appendChild(select);
        dropdown.appendChild(toggle);
        dropdown.appendChild(menu);

        select.classList.add("submission-select-native");

        var wrapper = {
            select: select,
            toggle: toggle,
            menu: menu,
            dropdown: dropdown
        };

        buildMenu(select, menu);
        syncToggle(wrapper);

        toggle.addEventListener("click", function (event) {
            event.stopPropagation();
            if (dropdown.classList.contains("is-open")) {
                closeMenu(wrapper);
            } else {
                openMenu(wrapper);
            }
        });

        menu.addEventListener("click", function (event) {
            var btn = event.target.closest(".submission-select-option");
            if (!btn) return;

            var value = btn.getAttribute("data-value");
            if (select.value !== value) {
                select.value = value;
                select.dispatchEvent(new Event("change", { bubbles: true }));
            }

            buildMenu(select, menu);
            syncToggle(wrapper);
            closeMenu(wrapper);
        });

        select.addEventListener("change", function () {
            buildMenu(select, menu);
            syncToggle(wrapper);
        });

        wrapper.optionObserver = new MutationObserver(function () {
            buildMenu(select, menu);
            syncToggle(wrapper);
        });
        wrapper.optionObserver.observe(select, {
            childList: true,
            subtree: true,
            characterData: true
        });

        wrapper.classObserver = new MutationObserver(function () {
            syncToggle(wrapper);
        });
        wrapper.classObserver.observe(select, {
            attributes: true,
            attributeFilter: ["class"]
        });

        return wrapper;
    }

    function unmountWrapper(wrapper) {
        if (!wrapper || !wrapper.dropdown.parentNode) return;

        if (wrapper.optionObserver) wrapper.optionObserver.disconnect();
        if (wrapper.classObserver) wrapper.classObserver.disconnect();

        var select = wrapper.select;
        var parent = wrapper.dropdown.parentNode;

        select.classList.remove("submission-select-native");
        parent.insertBefore(select, wrapper.dropdown);
        wrapper.dropdown.remove();
    }

    function mountAll() {
        if (!document.body.classList.contains("page-soumission") || !isMobile() || mounted) {
            return;
        }

        SELECT_IDS.forEach(function (id) {
            var select = document.getElementById(id);
            if (select) {
                var wrapper = mountSelect(select);
                if (wrapper) wrappers.push(wrapper);
            }
        });

        mounted = true;
    }

    function unmountAll() {
        wrappers.slice().forEach(unmountWrapper);
        wrappers = [];
        mounted = false;
    }

    function refresh() {
        if (isMobile()) {
            if (!mounted) mountAll();
        } else if (mounted) {
            unmountAll();
        }
    }

    document.addEventListener("click", function () {
        if (mounted) closeAll(null);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && mounted) closeAll(null);
    });

    window.addEventListener("resize", refresh, { passive: true });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", refresh);
    } else {
        refresh();
    }
})();
