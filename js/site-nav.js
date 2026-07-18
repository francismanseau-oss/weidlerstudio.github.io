(function () {
    var nav = document.getElementById("mainNav");
    if (!nav) return;

    var body = document.body;
    var root = body.getAttribute("data-nav-root") || "";
    var active = body.getAttribute("data-nav-active") || "";

    // TEMP 2026-07-18: masquer le lien Soumission (page /soumission/ reste accessible en URL directe).
    // Remettre à false pour réafficher dans le menu.
    var HIDE_SUBMISSION_NAV = true;

    var items = [
        { id: "home", href: root + "index.html", label: "Accueil" },
        { id: "services", href: root + "services/index.html", label: "Services" },
        { id: "projects", href: root + "projects/index.html", label: "Projets" },
        { id: "submission", href: root + "soumission/index.html", label: "Soumission" },
        { id: "about", href: root + "about/index.html", label: "À propos" },
        { id: "contact", href: root + "contact/index.html", label: "Contact" }
    ].filter(function (item) {
        return !(HIDE_SUBMISSION_NAV && item.id === "submission");
    });

    nav.innerHTML = items.map(function (item, index) {
        var cls = item.id === active ? ' class="active"' : "";
        var link =
            '<a href="' + item.href + '"' + cls + '>' +
                '<span class="nav-link-text" data-translate>' + item.label + "</span>" +
            "</a>";
        if (index < items.length - 1) {
            return link + '<span class="nav-sep" aria-hidden="true">|</span>';
        }
        return link;
    }).join("");
})();
