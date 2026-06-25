// UI library: click an icon tile to copy its Flaticon class to the clipboard.
(() => {
  const tiles = document.querySelectorAll(".ui-icon[data-icon]");
  if (!tiles.length) return;

  const flash = (tile) => {
    tile.classList.add("is-copied");
    window.setTimeout(() => tile.classList.remove("is-copied"), 1200);
  };

  tiles.forEach((tile) => {
    tile.addEventListener("click", async () => {
      const value = tile.getAttribute("data-icon");
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        // Clipboard API unavailable (e.g. non-secure context) — fall back to a temporary selection.
        const input = document.createElement("textarea");
        input.value = value;
        document.body.appendChild(input);
        input.select();
        try { document.execCommand("copy"); } catch { /* no-op */ }
        document.body.removeChild(input);
      }
      flash(tile);
    });
  });
})();
