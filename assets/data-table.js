/**
 * Reusable data table powered by Grid.js (loaded via CDN as window.gridjs).
 *
 * Usage — put a JSON config in a <script type="application/json"> inside the container:
 *
 *   <div class="data-table" data-table>
 *     <script type="application/json">
 *       {
 *         "columns": ["Meno", "E-mail", "Mesto"],
 *         "data": [["Jana", "jana@example.sk", "Košice"]],
 *         "search": true, "sort": true, "pagination": true, "limit": 10
 *       }
 *     </script>
 *   </div>
 *
 * Options (all optional): search/sort/pagination default to true; limit defaults to 10.
 * The component no-ops when Grid.js isn't present or there are no [data-table] containers.
 */
(function () {
  // Slovak UI strings so the table reads consistently with the rest of the site.
  var LANGUAGE = {
    search: { placeholder: "Hľadať…" },
    pagination: {
      previous: "Predchádzajúca",
      next: "Ďalšia",
      showing: "Zobrazené",
      of: "z",
      to: "–",
      results: "záznamov",
    },
    loading: "Načítavam…",
    noRecordsFound: "Nenašli sa žiadne záznamy",
    error: "Pri načítaní dát nastala chyba",
  };

  function render(el) {
    if (el.__gridRendered) return;

    var cfgEl = el.querySelector('script[type="application/json"]');
    if (!cfgEl) return;

    var config;
    try {
      config = JSON.parse(cfgEl.textContent);
    } catch (e) {
      return;
    }
    if (!config || !config.columns) return;

    var mount = document.createElement("div");
    el.appendChild(mount);

    new window.gridjs.Grid({
      columns: config.columns,
      data: config.data || [],
      search: config.search !== false,
      sort: config.sort !== false,
      pagination:
        config.pagination === false
          ? false
          : { limit: config.limit || 10, summary: true },
      language: LANGUAGE,
      className: { container: "data-table__grid" },
    }).render(mount);

    el.__gridRendered = true;
  }

  function init() {
    if (!window.gridjs) return;
    var containers = document.querySelectorAll(".data-table[data-table]");
    Array.prototype.forEach.call(containers, render);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
