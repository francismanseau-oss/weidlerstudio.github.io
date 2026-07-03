(function () {
    var SOURCE_LANG = "fr";

    var UNAVAILABLE_MSG = "Contenu juridique temporairement indisponible.";

    var root = document.documentElement;
    var app = root.dataset.legalApp;
    var contentRoot = root.dataset.legalContentRoot || "../../legal/content";
    var docType = getInitialDocType();
    var sourceData = null;
    var currentLang = SOURCE_LANG;

    function $(selector) {
        return document.querySelector(selector);
    }

    function getI18n() {
        return window.WeidlerI18n || null;
    }

    function getInitialDocType() {
        var hash = (location.hash || "").replace(/^#/, "");
        if (hash === "terms" || hash === "legal-notice" || hash === "privacy") {
            return hash;
        }
        return root.dataset.legalDoc || "privacy";
    }

    function getActiveSiteLang() {
        var i18n = getI18n();
        if (i18n) return i18n.getCurrentLang();
        var active = document.querySelector(".lang-btn.active");
        return active ? active.getAttribute("data-lang") : SOURCE_LANG;
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function contentUrl() {
        return contentRoot + "/" + app + "/" + docType + "/" + SOURCE_LANG + ".json";
    }

    function isDataAvailable(data) {
        return data
            && data.available !== false
            && Array.isArray(data.sections)
            && data.sections.length > 0;
    }

    function documentCacheKey(targetLang) {
        return app + "|" + docType + "|" + targetLang + "|" + (sourceData ? sourceData.version : "");
    }

    function setPageMeta(data) {
        if (data.metaDescription) {
            var meta = document.querySelector('meta[name="description"]');
            if (meta) meta.setAttribute("content", data.metaDescription);
        }

        document.title = data.documentTitle + " — " + data.product + " | Weidler Studio";

        var productEl = $("#legalProductName");
        var docEl = $("#legalDocumentTitle");
        var versionEl = $("#legalVersion");
        var updatedEl = $("#legalUpdated");
        var accordion = $("#legalAccordion");

        if (productEl) productEl.textContent = data.product;
        if (docEl) docEl.textContent = data.documentTitle;
        if (versionEl) versionEl.textContent = "Version " + data.version;
        if (updatedEl) updatedEl.textContent = data.updated;
        if (accordion && data.documentTitle) {
            accordion.setAttribute("aria-label", data.documentTitle);
        }
    }

    function renderAccordion(sections) {
        var container = $("#legalAccordion");
        if (!container) return;

        container.innerHTML = sections.map(function (section) {
            var panelId = "legal-panel-" + section.id;
            var triggerId = "legal-trigger-" + section.id;
            return (
                '<article class="legal-accordion-item" id="legal-section-' + escapeHtml(section.id) + '">' +
                    '<h2 class="legal-accordion-heading">' +
                        '<button type="button" class="legal-accordion-trigger" id="' + triggerId + '" aria-expanded="false" aria-controls="' + panelId + '">' +
                            '<span>' + escapeHtml(section.title) + '</span>' +
                            '<svg class="legal-accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                                '<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>' +
                            '</svg>' +
                        '</button>' +
                    '</h2>' +
                    '<div class="legal-accordion-panel" id="' + panelId + '" role="region" aria-labelledby="' + triggerId + '">' +
                        '<div class="legal-accordion-panel-inner">' +
                            '<div class="legal-accordion-body">' + section.body + '</div>' +
                        '</div>' +
                    '</div>' +
                '</article>'
            );
        }).join("");

        container.querySelectorAll(".legal-accordion-trigger").forEach(function (button) {
            button.addEventListener("click", function () {
                toggleAccordionItem(button.closest(".legal-accordion-item"), button);
            });
        });
    }

    function renderToc(sections) {
        var toc = $("#legalToc");
        var list = $("#legalTocList");
        if (!toc || !list) return;

        if (!sections || !sections.length) {
            toc.hidden = true;
            list.innerHTML = "";
            return;
        }

        list.innerHTML = sections.map(function (section) {
            return (
                '<li>' +
                    '<button type="button" class="legal-toc-link" data-legal-section="' + escapeHtml(section.id) + '">' +
                        escapeHtml(section.title) +
                    '</button>' +
                '</li>'
            );
        }).join("");

        list.querySelectorAll(".legal-toc-link").forEach(function (button) {
            button.addEventListener("click", function () {
                openSectionById(button.getAttribute("data-legal-section"));
            });
        });

        toc.hidden = false;
    }

    function openAccordionItem(item, button) {
        if (!item || !button) return;
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
    }

    function toggleAccordionItem(item, button) {
        if (!item || !button) return;
        var isOpen = item.classList.contains("is-open");

        if (isOpen) {
            item.classList.remove("is-open");
            button.setAttribute("aria-expanded", "false");
        } else {
            openAccordionItem(item, button);
        }
    }

    function openSectionById(sectionId) {
        if (!sectionId) return;

        var item = document.getElementById("legal-section-" + sectionId);
        var button = document.getElementById("legal-trigger-" + sectionId);
        if (!item || !button) return;

        openAccordionItem(item, button);

        var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.requestAnimationFrame(function () {
            item.scrollIntoView({
                behavior: prefersReduced ? "auto" : "smooth",
                block: "start"
            });
            button.focus({ preventScroll: true });
        });
    }

    function setActiveDocTab(activeDoc) {
        document.querySelectorAll(".legal-doc-tab").forEach(function (tab) {
            var isActive = tab.getAttribute("data-legal-doc") === activeDoc;
            tab.classList.toggle("active", isActive);
            if (isActive) {
                tab.setAttribute("aria-current", "page");
            } else {
                tab.removeAttribute("aria-current");
            }
        });
    }

    function showUnavailable() {
        var container = $("#legalAccordion");
        if (container) {
            container.innerHTML = '<p class="legal-accordion-body">' + escapeHtml(UNAVAILABLE_MSG) + "</p>";
        }
        var toc = $("#legalToc");
        if (toc) toc.hidden = true;
    }

    function applyContent(data, lang) {
        currentLang = lang;
        root.lang = getI18n() ? getI18n().normalizeLang(lang) : lang;
        setPageMeta(data);
        renderAccordion(data.sections || []);
        renderToc(data.sections || []);
    }

    async function translateDocument(targetLang) {
        var i18n = getI18n();
        if (!sourceData || !i18n) return sourceData;

        var normalized = i18n.normalizeLang(targetLang);
        if (normalized === SOURCE_LANG) return sourceData;

        var cacheKey = documentCacheKey(targetLang);
        var cached = i18n.getDocumentCache(cacheKey);
        if (cached) return cached;

        var sections = [];
        for (var i = 0; i < sourceData.sections.length; i++) {
            var section = sourceData.sections[i];
            sections.push({
                id: section.id,
                title: await i18n.translateText(section.title, targetLang),
                body: await i18n.translateHtml(section.body, targetLang)
            });
        }

        var translated = {
            product: sourceData.product,
            documentType: sourceData.documentType,
            documentTitle: await i18n.translateText(sourceData.documentTitle, targetLang),
            version: sourceData.version,
            updated: await i18n.translateText(sourceData.updated, targetLang),
            metaDescription: await i18n.translateText(sourceData.metaDescription, targetLang),
            sections: sections
        };

        i18n.setDocumentCache(cacheKey, translated);
        return translated;
    }

    async function loadSourceData() {
        var response = await fetch(contentUrl());
        if (!response.ok) throw new Error("missing");
        var data = await response.json();
        if (!isDataAvailable(data)) throw new Error("pending");
        sourceData = data;
        return data;
    }

    async function renderForLang(targetLang) {
        if (!sourceData) await loadSourceData();

        var i18n = getI18n();
        var normalized = i18n ? i18n.normalizeLang(targetLang) : targetLang;

        if (normalized === SOURCE_LANG) {
            applyContent(sourceData, SOURCE_LANG);
            return;
        }

        if (i18n) i18n.setBusy(true);
        try {
            var localized = await translateDocument(targetLang);
            applyContent(localized, targetLang);
        } finally {
            if (i18n) i18n.setBusy(false);
        }
    }

    async function switchDocument(nextDoc) {
        if (!nextDoc || nextDoc === docType) return;
        docType = nextDoc;
        sourceData = null;
        root.dataset.legalDoc = docType;
        setActiveDocTab(docType);
        if (history.replaceState) {
            history.replaceState(null, "", "#" + docType);
        } else {
            location.hash = docType;
        }
        await renderForLang(getActiveSiteLang());
    }

    function initDocTabs() {
        document.querySelectorAll(".legal-doc-tab").forEach(function (tab) {
            tab.addEventListener("click", function () {
                switchDocument(tab.getAttribute("data-legal-doc"));
            });
        });
        setActiveDocTab(docType);
    }

    function initLangSync() {
        document.addEventListener("weidler:langchange", function (e) {
            var lang = e.detail && e.detail.lang ? e.detail.lang : SOURCE_LANG;
            renderForLang(lang).catch(function () {
                showUnavailable();
            });
        });
    }

    async function initLegalContent() {
        initDocTabs();
        initLangSync();
        await renderForLang(getActiveSiteLang());
    }

    if (!app) return;

    initLegalContent().catch(function () {
        showUnavailable();
    });
})();
