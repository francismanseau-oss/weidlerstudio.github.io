(function () {
    if (document.querySelector(".home-bg-deco")) return;

    var script = document.currentScript;
    var base = script && script.src ? script.src.replace(/[^/]+$/, "") : "";
    var navRoot = document.body.getAttribute("data-nav-root") || "";

    var urls = [
        base + "site-bg.html",
        navRoot + "js/site-bg.html",
        "/js/site-bg.html",
        "js/site-bg.html",
        "../js/site-bg.html"
    ];

    function inject(html) {
        if (document.querySelector(".home-bg-deco")) return;

        var template = document.createElement("template");
        template.innerHTML = html.trim();

        var node = template.content.firstElementChild;
        if (node) document.body.insertBefore(node, document.body.firstChild);
    }

    function loadNext(index) {
        if (index >= urls.length) return;

        fetch(urls[index])
            .then(function (response) {
                if (!response.ok) throw new Error("site-bg.html");
                return response.text();
            })
            .then(inject)
            .catch(function () {
                loadNext(index + 1);
            });
    }

    loadNext(0);
})();