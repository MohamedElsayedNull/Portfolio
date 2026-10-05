(() => {
    const currentScript = document.currentScript;
    if (!(currentScript instanceof HTMLScriptElement)) {
        throw new Error("Unable to determine the config.js location.");
    }

    const scriptBase = currentScript.src;
    const scriptsToLoad = [
        "https://cdn.tailwindcss.com/3.4.17",
        "https://cdn.jsdelivr.net/npm/lucide@0.577.0/dist/umd/lucide.min.js",
        new URL("./main.js", scriptBase).href,
    ];

    const loadScript = (src) =>
        new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = () =>
                reject(new Error(`Failed to load required script: ${src}`));
            document.head.append(script);
        });

    const loadDependencies = async () => {
        for (const src of scriptsToLoad) {
            await loadScript(src);
        }
    };

    loadDependencies().catch((error) => {
        console.error("Page initialization failed.", error);
    });
})();
