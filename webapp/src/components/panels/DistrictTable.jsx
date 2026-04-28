import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../i18n/useI18n.js";
import { buildPaginationItems } from "../../utils/pagination.js";

const STATISTICAL_PAGE_SIZE = 6;

// Sortable ranking table used in View 5. Quartieri (6 items) fit on a single page;
// statistical areas (~90) get the full pagination bar with first/last + neighbours.

export function DistrictTable({ sorted, metricKey, selectedId, aggregation, onSelect }) {
  const { data, language } = useI18n();
  const metric = data.districtMetrics[metricKey];
  const isStatistical = aggregation === "statistical";
  const showHotspotColumn = metricKey !== "hotspotPercent";
  const [pageIndex, setPageIndex] = useState(0);

  // For quartieri we collapse pagination by setting page size = full list, page count = 1.
  const pageSize = isStatistical ? STATISTICAL_PAGE_SIZE : Math.max(sorted.length, 1);
  const pageCount = isStatistical ? Math.ceil(sorted.length / pageSize) : 1;
  // Guard against the page index pointing past the new last page after the data shrinks.
  const safePageIndex = Math.min(pageIndex, Math.max(0, pageCount - 1));
  const pageStart = safePageIndex * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, sorted.length);
  const visibleRows = isStatistical ? sorted.slice(pageStart, pageEnd) : sorted;
  const paginationItems = buildPaginationItems(safePageIndex, pageCount);
  const copy = language === "en"
    ? {
      kicker: "Ranking",
      statisticalComparison: "Statistical areas comparison",
      districtComparison: "District comparison",
      showing: `Showing ${pageStart + 1}-${pageEnd} of ${sorted.length} statistical areas`,
      statisticalArea: "Statistical area",
      district: "District",
      hotspot: "Critical share",
      paginationAria: "Statistical areas pagination",
      previousPage: "Previous page",
      nextPage: "Next page",
      page: (index) => `Page ${index + 1}`,
    }
    : {
      kicker: "Ranking",
      statisticalComparison: "Confronto aree statistiche",
      districtComparison: "Confronto quartieri",
      showing: `Mostrate ${pageStart + 1}-${pageEnd} di ${sorted.length} aree statistiche`,
      statisticalArea: "Area statistica",
      district: "Quartiere",
      hotspot: "Quota critica",
      paginationAria: "Paginazione aree statistiche",
      previousPage: "Pagina precedente",
      nextPage: "Pagina successiva",
      page: (index) => `Pagina ${index + 1}`,
    };

  // Reset to page 1 when the view switches between district / statistical or the metric changes:
  // the previous row order no longer reflects the new ranking.
  useEffect(() => {
    setPageIndex(0);
  }, [aggregation, metricKey]);

  // When the selected entity is on another page (e.g. user picked it on the map), jump to it.
  useEffect(() => {
    if (!isStatistical || !selectedId) return;
    const selectedIndex = sorted.findIndex((district) => district.id === selectedId);
    if (selectedIndex >= 0) setPageIndex(Math.floor(selectedIndex / pageSize));
  }, [isStatistical, pageSize, selectedId, sorted]);

  return (
    <section className="table-card">
      <div className="analysis-head">
        <div>
          <span className="section-kicker">{copy.kicker}</span>
          <h2>{isStatistical ? copy.statisticalComparison : copy.districtComparison}</h2>
        </div>
      </div>
      {isStatistical && (
        <div className="table-toolbar">
          <span>{copy.showing}</span>
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{isStatistical ? copy.statisticalArea : copy.district}</th>
              {isStatistical && <th>{copy.district}</th>}
              <th>{data.districtMetrics[metricKey].label}</th>
              {showHotspotColumn && <th>{copy.hotspot}</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((district, index) => (
              <tr
                key={district.id}
                className={district.id === selectedId ? "active" : ""}
                onClick={() => onSelect(district.id)}
              >
                <td>{pageStart + index + 1}</td>
                <td>{district.name}</td>
                {isStatistical && <td>{district.quartiere}</td>}
                <td>{district[metricKey]}{metric.unit}</td>
                {showHotspotColumn && <td>{district.hotspotPercent}%</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isStatistical && pageCount > 1 && (
        <div className="table-pagination" aria-label={copy.paginationAria}>
          <button
            type="button"
            className="pagination-arrow"
            onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
            disabled={safePageIndex === 0}
            aria-label={copy.previousPage}
          >
            <ChevronLeft size={16} />
          </button>
          {paginationItems.map((item) =>
            item.type === "ellipsis" ? (
              <span key={item.key} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={item.index}
                type="button"
                className={item.index === safePageIndex ? "active" : ""}
                aria-current={item.index === safePageIndex ? "page" : undefined}
                aria-label={copy.page(item.index)}
                onClick={() => setPageIndex(item.index)}
              >
                {item.index + 1}
              </button>
            ),
          )}
          <button
            type="button"
            className="pagination-arrow"
            onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))}
            disabled={safePageIndex >= pageCount - 1}
            aria-label={copy.nextPage}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
