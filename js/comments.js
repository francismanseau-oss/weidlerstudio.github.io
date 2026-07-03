(function () {
    var STORAGE_KEY = "weidler_studio_comments";
    var PAGE_SOURCE_LANG = "fr";
    var MYMEMORY_API = "https://api.mymemory.translated.net/get";

    var TRANSLATE_COMMENT_LABELS = {
        fr: "Traduire en français",
        en: "Translate to English",
        de: "Ins Deutsche übersetzen",
        es: "Traducir al español",
        it: "Traduci in italiano",
        "zh-CN": "翻译成中文",
        ja: "日本語に翻訳",
        pt: "Traduzir para português"
    };

    var comments = [];

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function detectMessageLanguage(text) {
        var t = text.trim();
        if (!t) return PAGE_SOURCE_LANG;
        if (/[\u4e00-\u9fff]/.test(t)) return "zh-CN";
        if (/[\u3040-\u30ff]/.test(t)) return "ja";
        if (/[àâçéèêëîïôùûüæœ]/i.test(t)) return "fr";
        if (/[áéíóúñ¿¡]/i.test(t)) return "es";
        if (/[ãõ]/i.test(t)) return "pt";
        if (/\b(der|die|das|und|ich|nicht|ist)\b/i.test(t)) return "de";
        if (/\b(il|che|per|non|sono)\b/i.test(t)) return "it";
        if (/\b(the|and|is|are|you|hello|this|that|with|have|from)\b/i.test(t)) return "en";
        if (!/[àâçéèêëîïôùûüáéíóúñãõ]/i.test(t) && /^[\x00-\x7F]+$/.test(t)) return "en";
        return PAGE_SOURCE_LANG;
    }

    function getActiveSiteLang() {
        var activeBtn = document.querySelector(".lang-btn.active");
        var lang = activeBtn && activeBtn.getAttribute("data-lang");
        return lang || PAGE_SOURCE_LANG;
    }

    function getTranslateCommentLabel(lang) {
        return TRANSLATE_COMMENT_LABELS[lang] || ("Traduire (" + lang + ")");
    }

    function getCommentSourceLang(comment) {
        return detectMessageLanguage(comment.originalText);
    }

    function loadCommentsFromStorage() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;
            comments.length = 0;
            parsed.forEach(function (c) {
                comments.push({
                    id: c.id || String(Date.now()) + Math.random(),
                    pseudo: c.pseudo || "Anonyme",
                    originalText: c.originalText || c.text || "",
                    displayText: c.displayText != null ? c.displayText : (c.originalText || c.text || ""),
                    translatedTo: c.translatedTo || null,
                    isTranslated: Boolean(c.isTranslated),
                    createdAt: c.createdAt || new Date().toISOString()
                });
            });
        } catch (e) {
            console.warn("Impossible de charger les commentaires :", e);
        }
    }

    function saveCommentsToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
        } catch (e) {
            console.warn("Impossible de sauvegarder les commentaires :", e);
        }
    }

    function renderComments() {
        var list = document.getElementById("commentList");
        if (!list) return;

        var activeLang = getActiveSiteLang();
        list.innerHTML = "";

        if (comments.length === 0) {
            list.innerHTML = '<p class="comments-empty-msg" data-translate>Aucun commentaire pour l\'instant. Soyez le premier !</p>';
            return;
        }

        var label = escapeHtml(getTranslateCommentLabel(activeLang));

        comments.forEach(function (c) {
            var display = c.translatedTo === activeLang ? c.displayText : c.originalText;
            var showTranslate = c.translatedTo !== activeLang;

            var actionsHtml = "";
            if (showTranslate) {
                actionsHtml =
                    '<button type="button" class="btn-translate-comment" data-comment-id="' +
                    escapeHtml(c.id) + '" data-target-lang="' + escapeHtml(activeLang) + '">' +
                    label + "</button>";
            }

            list.innerHTML +=
                '<article class="comment-card" data-comment-id="' + escapeHtml(c.id) + '">' +
                    '<div class="comment-author">' + escapeHtml(c.pseudo) + "</div>" +
                    '<p class="comment-text">' + escapeHtml(display) + "</p>" +
                    actionsHtml +
                "</article>";
        });
    }

    async function fetchMyMemory(text, targetLang, sourceLang) {
        var url = MYMEMORY_API +
            "?q=" + encodeURIComponent(text.trim()) +
            "&langpair=" + encodeURIComponent(sourceLang + "|" + targetLang);
        var response = await fetch(url);
        if (!response.ok) throw new Error("Réseau " + response.status);
        var data = await response.json();
        if (data.responseStatus !== 200 || !data.responseData || !data.responseData.translatedText) {
            throw new Error(data.responseDetails || "Traduction refusée");
        }
        return data.responseData.translatedText;
    }

    async function translateComment(commentId, buttonEl) {
        var comment = comments.find(function (c) { return c.id === commentId; });
        if (!comment) return;

        var targetLang = buttonEl.getAttribute("data-target-lang") || getActiveSiteLang();
        var sourceLang = getCommentSourceLang(comment);
        var prevLabel = buttonEl.textContent;
        buttonEl.disabled = true;
        buttonEl.textContent = "…";

        try {
            var translated = await fetchMyMemory(comment.originalText, targetLang, sourceLang);
            comment.displayText = translated;
            comment.translatedTo = targetLang;
            comment.isTranslated = true;
            saveCommentsToStorage();
            renderComments();
        } catch (err) {
            console.error(err);
            buttonEl.disabled = false;
            buttonEl.textContent = prevLabel;
            alert("Traduction du message impossible : " + err.message);
        }
    }

    function addComment() {
        var pseudoEl = document.getElementById("pseudo");
        var msgEl = document.getElementById("msg");
        if (!pseudoEl || !msgEl) return;

        var pseudo = pseudoEl.value.trim() || "Anonyme";
        var text = msgEl.value.trim();
        if (!text) return;

        comments.unshift({
            id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
            pseudo: pseudo,
            originalText: text,
            displayText: text,
            translatedTo: null,
            isTranslated: false,
            createdAt: new Date().toISOString()
        });

        saveCommentsToStorage();
        msgEl.value = "";
        renderComments();
    }

    window.addComment = addComment;

    window.WeidlerComments = {
        onPageLangChange: function () {
            comments.forEach(function (c) {
                if (getActiveSiteLang() === PAGE_SOURCE_LANG) {
                    c.displayText = c.originalText;
                    c.translatedTo = null;
                    c.isTranslated = false;
                }
            });
            saveCommentsToStorage();
            renderComments();
        }
    };

    var list = document.getElementById("commentList");
    if (list) {
        list.addEventListener("click", function (e) {
            var btn = e.target.closest(".btn-translate-comment");
            if (!btn) return;
            var id = btn.getAttribute("data-comment-id");
            if (id) translateComment(id, btn);
        });
    }

    loadCommentsFromStorage();
    renderComments();
})();
