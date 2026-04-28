import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { statisticalAreas } from "../../data/statisticalAreas.js";
import { useI18n } from "../../i18n/useI18n.js";

const MAX_RESULTS = 6;

// Live combobox that lets a citizen jump to a district or statistical area by name.
// Results show the value of the currently selected View 5 metric, which bridges the
// search to the ranking table below: picking a result switches aggregation, selects
// the entity, flies the map to it and briefly pulses the matching table row.

export function AreaFinder({ id, onZoomToFeature }) {
  const { data, language } = useI18n();
  const setState = useAppStore((state) => state.setState);
  const view5Metric = useAppStore((state) => state.view5Metric);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputId = useId();
  const listboxId = useId();
  const wrapperRef = useRef(null);

  const metric = data.districtMetrics[view5Metric];

  const allOptions = useMemo(() => {
    const districts = data.districts.map((d) => ({
      id: d.id,
      name: d.name,
      parent: null,
      kind: "district",
      metricValue: d[view5Metric],
    }));
    const areas = statisticalAreas.map((a) => ({
      id: a.id,
      name: a.name,
      parent: a.quartiere,
      kind: "statistical",
      metricValue: a[view5Metric],
    }));
    return [...districts, ...areas];
  }, [data.districts, view5Metric]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const matched = allOptions.filter((option) => {
      const haystack = option.parent
        ? `${option.name} ${option.parent}`.toLowerCase()
        : option.name.toLowerCase();
      return haystack.includes(needle);
    });
    matched.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(needle);
      const bStarts = b.name.toLowerCase().startsWith(needle);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      // Districts before statistical areas at equal rank — broader unit first.
      if (a.kind !== b.kind) return a.kind === "district" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return matched.slice(0, MAX_RESULTS);
  }, [allOptions, query]);

  const copy = language === "en"
    ? {
      kicker: "Find your area",
      hint: "Selecting a result updates the map, the ranking table and the card on the right.",
      placeholder: "Type a district or statistical area...",
      clear: "Clear",
      kindDistrict: "District",
      kindArea: "Area",
      missingValue: "n/a",
      noMatch: "No matching area. Try a district name like 'Navile' or an area like 'Marconi'.",
    }
    : {
      kicker: "Trova la tua zona",
      hint: "La selezione aggiorna la mappa, la tabella di confronto e la scheda a destra.",
      placeholder: "Scrivi un quartiere o un'area statistica...",
      clear: "Cancella",
      kindDistrict: "Quartiere",
      kindArea: "Area",
      missingValue: "n.d.",
      noMatch: "Nessuna corrispondenza. Prova un quartiere come 'Navile' o un'area come 'Marconi'.",
    };

  const formatMetricValue = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return copy.missingValue;
    return `${value}${metric.unit ?? ""}`;
  };

  const select = (option) => {
    if (!option) return;
    setState({
      view5Aggregation: option.kind === "statistical" ? "statistical" : "district",
      selectedDistrictId: option.id,
    });
    setQuery(option.name);
    setOpen(false);
    // Wait for the table to re-render on the new aggregation/page, then scroll the
    // user back to the map, trigger fly-to and flash the matching row. The double
    // rAF gives React time to commit both the aggregation change and the page jump
    // triggered by selectedId.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const mapCard = wrapperRef.current?.closest(".map-stack")?.querySelector(".district-map-card");
        mapCard?.scrollIntoView({ behavior: "smooth", block: "center" });
        onZoomToFeature?.(option.id);
        const row = document.querySelector(".table-card tbody tr.active");
        if (!row) return;
        row.classList.remove("row-pulse");
        // Force reflow so the animation restarts on consecutive selections.
        void row.offsetWidth;
        row.classList.add("row-pulse");
      });
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => Math.min(Math.max(results.length - 1, 0), current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[highlight]) select(results[highlight]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  // Reset highlight whenever the result set changes so we never point past the end.
  useEffect(() => {
    setHighlight(0);
  }, [query, view5Metric]);

  // Close the dropdown when the user clicks outside the search wrapper.
  useEffect(() => {
    const onDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const showDropdown = open && query.trim().length > 0;
  const showEmpty = showDropdown && results.length === 0;

  return (
    <section id={id} className="area-finder" ref={wrapperRef} role="search" aria-label={copy.kicker}>
      <div className="area-finder-head">
        <span className="section-kicker">{copy.kicker}</span>
        <p className="area-finder-hint">{copy.hint}</p>
      </div>
      <div
        className={`area-finder-control ${showDropdown ? "is-open" : ""}`}
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-owns={listboxId}
      >
        <Search size={16} className="area-finder-icon" aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={copy.placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={showDropdown && results[highlight] ? `${listboxId}-${highlight}` : undefined}
        />
        {query && (
          <button
            type="button"
            className="area-finder-clear"
            onClick={() => { setQuery(""); setOpen(false); }}
            aria-label={copy.clear}
          >
            <X size={14} />
          </button>
        )}
        {showDropdown && (
          <ul id={listboxId} className="area-finder-results" role="listbox">
            {results.length > 0 && results.map((option, index) => (
              <li
                key={`${option.kind}-${option.id}`}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === highlight}
                className={`area-finder-result ${index === highlight ? "is-highlight" : ""}`}
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(event) => { event.preventDefault(); select(option); }}
              >
                <div className="area-finder-result-main">
                  <span className={`area-finder-result-kind kind-${option.kind}`}>
                    {option.kind === "district" ? copy.kindDistrict : copy.kindArea}
                  </span>
                  <strong>{option.name}</strong>
                  {option.parent && <span className="area-finder-result-parent">{option.parent}</span>}
                </div>
                <div className="area-finder-result-metric">
                  <span className="area-finder-result-metric-label">{metric.label}</span>
                  <span className="area-finder-result-metric-value">{formatMetricValue(option.metricValue)}</span>
                </div>
              </li>
            ))}
            {showEmpty && (
              <li className="area-finder-empty" role="status">{copy.noMatch}</li>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
