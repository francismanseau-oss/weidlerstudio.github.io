(function () {
    var MYMEMORY_API = "https://api.mymemory.translated.net/get";
    var PAGE_SOURCE_LANG = "fr";
    var API_BATCH_SIZE = 3;
    var API_DELAY_MS = 350;
    var CACHE_STORAGE_KEY = "weidler-i18n-cache-v1";
    var CACHE_MAX_ENTRIES = 800;

    var isTranslating = false;
    var currentPageLang = PAGE_SOURCE_LANG;
    var textCache = Object.create(null);
    var documentCache = Object.create(null);

    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function hashText(text) {
        var h = 0;
        for (var i = 0; i < text.length; i++) {
            h = ((h << 5) - h) + text.charCodeAt(i);
            h |= 0;
        }
        return h.toString(36);
    }

    function normalizeLang(lang) {
        if (!lang) return PAGE_SOURCE_LANG;
        if (lang === "zh-CN") return "zh";
        return lang.split("-")[0];
    }

    function cacheKey(sourceLang, targetLang, text) {
        return sourceLang + "|" + targetLang + "|" + hashText(text);
    }

    function loadPersistedCache() {
        try {
            var raw = localStorage.getItem(CACHE_STORAGE_KEY);
            if (!raw) return;
            var data = JSON.parse(raw);
            if (data && data.text) {
                Object.keys(data.text).forEach(function (key) {
                    textCache[key] = data.text[key];
                });
            }
        } catch (err) {
            /* ignore corrupt cache */
        }
    }

    function persistTextCache() {
        try {
            var keys = Object.keys(textCache);
            if (keys.length > CACHE_MAX_ENTRIES) {
                keys.slice(0, keys.length - CACHE_MAX_ENTRIES).forEach(function (key) {
                    delete textCache[key];
                });
            }
            localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ text: textCache }));
        } catch (err) {
            /* quota or private mode */
        }
    }

    function getTranslatableElements() {
        return Array.from(document.querySelectorAll("[data-translate], [data-translate-placeholder]"))
            .filter(function (el) { return !el.closest("#commentList"); });
    }

    function readOriginal(el) {
        if (el.hasAttribute("data-translate-placeholder")) {
            return el.getAttribute("placeholder") || "";
        }
        return el.textContent.trim();
    }

    function writeText(el, text) {
        if (el.hasAttribute("data-translate-placeholder")) {
            el.setAttribute("placeholder", text);
        } else {
            el.textContent = text;
        }
    }

    function cacheOriginals() {
        getTranslatableElements().forEach(function (el) {
            if (!el.dataset.originalText) {
                el.dataset.originalText = readOriginal(el);
            }
        });
    }

    async function fetchMyMemory(text, targetLang, sourceLang) {
        var trimmed = text.trim();
        if (!trimmed) return text;

        var from = sourceLang || PAGE_SOURCE_LANG;
        var to = normalizeLang(targetLang);
        if (from === to) return trimmed;

        var key = cacheKey(from, to, trimmed);
        if (textCache[key]) return textCache[key];

        var url = MYMEMORY_API +
            "?q=" + encodeURIComponent(trimmed) +
            "&langpair=" + encodeURIComponent(from + "|" + to);

        var response = await fetch(url);
        if (!response.ok) throw new Error("Réseau " + response.status);

        var data = await response.json();
        if (data.responseStatus !== 200 || !data.responseData || !data.responseData.translatedText) {
            throw new Error(data.responseDetails || "Traduction refusée");
        }

        var translated = data.responseData.translatedText;
        textCache[key] = translated;
        persistTextCache();
        return translated;
    }

    async function translateBatch(items, targetLang, sourceLang) {
        var results = new Array(items.length);
        for (var i = 0; i < items.length; i += API_BATCH_SIZE) {
            var slice = items.slice(i, i + API_BATCH_SIZE);
            var translated = await Promise.all(
                slice.map(function (item) {
                    return fetchMyMemory(item.text, targetLang, sourceLang || PAGE_SOURCE_LANG);
                })
            );
            slice.forEach(function (item, j) {
                results[item.index] = translated[j];
            });
            if (i + API_BATCH_SIZE < items.length) await sleep(API_DELAY_MS);
        }
        return results;
    }

    async function translateText(text, targetLang, sourceLang) {
        if (!text || !String(text).trim()) return text || "";
        var from = sourceLang || PAGE_SOURCE_LANG;
        var to = normalizeLang(targetLang);
        if (from === to) return text;
        return fetchMyMemory(String(text), to, from);
    }

    async function translateTexts(texts, targetLang, sourceLang) {
        if (!texts || !texts.length) return [];
        var from = sourceLang || PAGE_SOURCE_LANG;
        var to = normalizeLang(targetLang);
        if (from === to) return texts.slice();

        var queue = texts.map(function (text, index) {
            return { index: index, text: String(text || "") };
        });
        return translateBatch(queue, to, from);
    }

    async function translateHtml(html, targetLang, sourceLang) {
        if (!html) return html;
        var from = sourceLang || PAGE_SOURCE_LANG;
        var to = normalizeLang(targetLang);
        if (from === to) return html;

        var wrap = document.createElement("div");
        wrap.innerHTML = html;

        var textNodes = [];
        var walker = document.createTreeWalker(
            wrap,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    return node.textContent.trim()
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            }
        );

        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        if (!textNodes.length) return html;

        var originals = textNodes.map(function (node) { return node.textContent; });
        var translated = await translateTexts(originals, to, from);
        textNodes.forEach(function (node, index) {
            node.textContent = translated[index];
        });

        return wrap.innerHTML;
    }

    function setBusy(busy) {
        isTranslating = busy;
        var status = document.getElementById("langStatus");
        if (status) status.classList.toggle("visible", busy);
        document.querySelectorAll(".lang-btn").forEach(function (b) { b.disabled = busy; });
    }

    function setActiveLang(lang) {
        document.querySelectorAll(".lang-btn").forEach(function (b) {
            b.classList.toggle("active", b.getAttribute("data-lang") === lang);
        });
    }

    function dispatchLangChange(lang) {
        document.dispatchEvent(new CustomEvent("weidler:langchange", {
            detail: { lang: lang, normalizedLang: normalizeLang(lang) }
        }));
    }

    function restoreFrench() {
        getTranslatableElements().forEach(function (el) {
            if (el.dataset.originalText) writeText(el, el.dataset.originalText);
        });
        currentPageLang = PAGE_SOURCE_LANG;
        document.documentElement.lang = PAGE_SOURCE_LANG;
        setActiveLang(PAGE_SOURCE_LANG);
        if (window.WeidlerComments && window.WeidlerComments.onPageLangChange) {
            window.WeidlerComments.onPageLangChange();
        }
        dispatchLangChange(PAGE_SOURCE_LANG);
    }

    async function translateFullPage(targetLang) {
        if (isTranslating) return;
        if (targetLang === PAGE_SOURCE_LANG) {
            restoreFrench();
            return;
        }

        cacheOriginals();
        setBusy(true);
        var translatedOk = false;

        try {
            var elements = getTranslatableElements();
            var queue = elements.map(function (el, index) {
                var original = el.dataset.originalText || readOriginal(el);
                el.dataset.originalText = original;
                return { index: index, text: original, el: el };
            });

            var translated = await translateBatch(
                queue.map(function (q) { return { index: q.index, text: q.text }; }),
                targetLang,
                PAGE_SOURCE_LANG
            );

            queue.forEach(function (q, i) {
                writeText(q.el, translated[i]);
            });

            currentPageLang = targetLang;
            document.documentElement.lang = normalizeLang(targetLang);
            setActiveLang(targetLang);
            if (window.WeidlerComments && window.WeidlerComments.onPageLangChange) {
                window.WeidlerComments.onPageLangChange();
            }
            translatedOk = true;
        } catch (err) {
            console.error(err);
            alert("Traduction impossible : " + err.message);
        } finally {
            setBusy(false);
            if (translatedOk) {
                setTimeout(function () { dispatchLangChange(targetLang); }, 0);
            }
        }
    }

    function getDocumentCache(key) {
        return documentCache[key] || null;
    }

    function setDocumentCache(key, data) {
        documentCache[key] = data;
    }

    window.WeidlerI18n = {
        SOURCE_LANG: PAGE_SOURCE_LANG,
        normalizeLang: normalizeLang,
        getCurrentLang: function () { return currentPageLang; },
        isTranslating: function () { return isTranslating; },
        setBusy: setBusy,
        translateText: translateText,
        translateTexts: translateTexts,
        translateHtml: translateHtml,
        getDocumentCache: getDocumentCache,
        setDocumentCache: setDocumentCache
    };

    var langFlags = document.getElementById("langFlags");
    if (langFlags) {
        langFlags.addEventListener("click", function (e) {
            var btn = e.target.closest(".lang-btn");
            if (!btn || isTranslating) return;
            var lang = btn.getAttribute("data-lang");
            if (!lang) return;
            if (lang === PAGE_SOURCE_LANG) {
                restoreFrench();
            } else {
                translateFullPage(lang);
            }
        });
    }

    loadPersistedCache();
    cacheOriginals();
    setActiveLang(PAGE_SOURCE_LANG);
})();
