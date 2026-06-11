(function () {
    var MYMEMORY_API = "https://api.mymemory.translated.net/get";
    var PAGE_SOURCE_LANG = "fr";
    var API_BATCH_SIZE = 3;
    var API_DELAY_MS = 350;

    var isTranslating = false;
    var currentPageLang = PAGE_SOURCE_LANG;

    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
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
        var to = targetLang;
        if (from === to) return trimmed;

        var url = MYMEMORY_API +
            "?q=" + encodeURIComponent(trimmed) +
            "&langpair=" + encodeURIComponent(from + "|" + to);

        var response = await fetch(url);
        if (!response.ok) throw new Error("Réseau " + response.status);

        var data = await response.json();
        if (data.responseStatus !== 200 || !data.responseData || !data.responseData.translatedText) {
            throw new Error(data.responseDetails || "Traduction refusée");
        }
        return data.responseData.translatedText;
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
    }

    async function translateFullPage(targetLang) {
        if (isTranslating) return;
        if (targetLang === PAGE_SOURCE_LANG) {
            restoreFrench();
            return;
        }

        cacheOriginals();
        setBusy(true);

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
            document.documentElement.lang = targetLang.split("-")[0];
            setActiveLang(targetLang);
            if (window.WeidlerComments && window.WeidlerComments.onPageLangChange) {
                window.WeidlerComments.onPageLangChange();
            }
        } catch (err) {
            console.error(err);
            alert("Traduction impossible : " + err.message);
        } finally {
            setBusy(false);
        }
    }

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

    cacheOriginals();
    setActiveLang(PAGE_SOURCE_LANG);
})();
