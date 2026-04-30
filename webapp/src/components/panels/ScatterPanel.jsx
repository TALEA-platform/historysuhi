import { useMemo, useState } from "react";
import { RichText, RichTextInline } from "../ui/RichText.jsx";
import { deltaLayer } from "../../data/layers.js";
import { useI18n } from "../../i18n/useI18n.js";
import { getInterpolatedPaletteCss, getPaletteGradientCss } from "../../lib/rasterRenderer.js";
import { useAppStore } from "../../store/appStore.js";

// Single SVG scatter plot used in View 4: albedo vs DeltaLST, from real CSV pairs.

const SCATTER_LAYOUT_INLINE = {
  viewWidth: 100,
  viewHeight: 80,
  xStart: 15,
  xEnd: 94,
  yTop: 9,
  yBottom: 66,
  xTickTarget: 5,
  yTickTarget: 4,
  hitRadius: 3.6,
  pointRadii: {
    base: 1.4,
    hover: 1.8,
    selected: 2.1,
  },
};

const SCATTER_EPSILON = 0.000001;
const SCATTER_DELTA_RANGE = deltaLayer?.raster?.range || [6, 14];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scaleValue(value, min, max, start, end) {
  const ratio = (value - min) / Math.max(SCATTER_EPSILON, max - min);
  return start + (ratio * (end - start));
}

function normalizeRangeValue(value, range = SCATTER_DELTA_RANGE) {
  return clamp(
    (value - range[0]) / Math.max(SCATTER_EPSILON, range[1] - range[0]),
    0,
    1,
  );
}

// Pick rounded "nice" tick values that divide [min, max] into roughly `target` intervals.
function makeNiceTicks(min, max, target = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
  const span = max - min;
  const rawStep = span / target;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  let stepFactor;
  if (normalized < 1.5) stepFactor = 1;
  else if (normalized < 3) stepFactor = 2;
  else if (normalized < 7) stepFactor = 5;
  else stepFactor = 10;
  const step = stepFactor * magnitude;
  const ticks = [];
  const first = Math.ceil(min / step) * step;
  for (let v = first; v <= max + SCATTER_EPSILON; v += step) {
    ticks.push(Number(v.toPrecision(10)));
  }
  return ticks;
}

function getTickDecimals(ticks = [], fallback = 1, maxDecimals = 4) {
  const values = ticks
    .map((tick) => tick?.value)
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (values.length < 2) return fallback;

  const minStep = values.reduce((smallest, value, index) => {
    if (index === 0) return smallest;
    const diff = Math.abs(value - values[index - 1]);
    if (diff <= SCATTER_EPSILON) return smallest;
    return Math.min(smallest, diff);
  }, Number.POSITIVE_INFINITY);

  if (!Number.isFinite(minStep)) return fallback;

  for (let decimals = fallback; decimals <= maxDecimals; decimals += 1) {
    const labels = values.map((value) => value.toFixed(decimals));
    if (new Set(labels).size === labels.length) return decimals;
  }

  return maxDecimals;
}

function buildScatterModel(
  csvPoints = [],
  selectedPointKey = null,
  qualitativeCopy = null,
  layout = SCATTER_LAYOUT_INLINE,
  colorMode = "default",
) {
  const validPoints = csvPoints.filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y));
  if (!validPoints.length) {
    return { points: [], trendLine: null, axes: null, qualAxes: null };
  }

  const { xStart, xEnd, yTop, yBottom } = layout;

  const xValues = validPoints.map((item) => item.x);
  const yValues = validPoints.map((item) => item.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const meanX = xValues.reduce((sum, value) => sum + value, 0) / xValues.length;
  const meanY = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;
  const denominator = xValues.reduce((sum, value) => sum + ((value - meanX) ** 2), 0);
  const numerator = validPoints.reduce((sum, point) => sum + ((point.x - meanX) * (point.y - meanY)), 0);
  const slope = denominator <= SCATTER_EPSILON ? 0 : numerator / denominator;
  const intercept = meanY - (slope * meanX);
  const startY = clamp((slope * minX) + intercept, minY, maxY);
  const endY = clamp((slope * maxX) + intercept, minY, maxY);

  const xLowBound = minX + (maxX - minX) / 3;
  const xHighBound = minX + ((maxX - minX) * 2) / 3;
  const yLowBound = minY + (maxY - minY) / 3;
  const yHighBound = minY + ((maxY - minY) * 2) / 3;
  const bucketFor = (value, lowBound, highBound) => {
    if (value < lowBound) return "low";
    if (value > highBound) return "high";
    return "mid";
  };

  const points = validPoints.map((point) => ({
    ...point,
    rawX: point.x,
    rawY: point.y,
    plotX: scaleValue(point.x, minX, maxX, xStart, xEnd),
    plotY: scaleValue(point.y, minY, maxY, yBottom, yTop),
    fill: getInterpolatedPaletteCss("thermal", normalizeRangeValue(point.y), colorMode),
    isSelected: point.key === selectedPointKey,
    xBucket: bucketFor(point.x, xLowBound, xHighBound),
    yBucket: bucketFor(point.y, yLowBound, yHighBound),
  }));

  const xTickValues = makeNiceTicks(minX, maxX, layout.xTickTarget ?? 5);
  const yTickValues = makeNiceTicks(minY, maxY, layout.yTickTarget ?? 4);
  const xTicks = xTickValues.map((value) => ({
    value,
    plot: scaleValue(value, minX, maxX, xStart, xEnd),
  }));
  const yTicks = yTickValues.map((value) => ({
    value,
    plot: scaleValue(value, minY, maxY, yBottom, yTop),
  }));

  const xSpan = maxX - minX;
  const ySpan = maxY - minY;
  const qualAxes = qualitativeCopy
    ? {
      xLabels: ["low", "mid", "high"].map((bucket, index) => {
        const fraction = (1 + index * 2) / 6;
        const value = minX + fraction * xSpan;
        return {
          plot: scaleValue(value, minX, maxX, xStart, xEnd),
          label: qualitativeCopy.xBuckets[bucket],
        };
      }),
      yLabels: ["low", "mid", "high"].map((bucket, index) => {
        const fraction = (1 + index * 2) / 6;
        const value = minY + fraction * ySpan;
        return {
          plot: scaleValue(value, minY, maxY, yBottom, yTop),
          label: qualitativeCopy.yBuckets[bucket],
        };
      }),
      xBoundaries: [xLowBound, xHighBound].map((value) => ({
        plot: scaleValue(value, minX, maxX, xStart, xEnd),
      })),
      yBoundaries: [yLowBound, yHighBound].map((value) => ({
        plot: scaleValue(value, minY, maxY, yBottom, yTop),
      })),
    }
    : null;

  return {
    points,
    trendLine: validPoints.length > 1
      ? {
        x1: scaleValue(minX, minX, maxX, xStart, xEnd),
        y1: scaleValue(startY, minY, maxY, yBottom, yTop),
        x2: scaleValue(maxX, minX, maxX, xStart, xEnd),
        y2: scaleValue(endY, minY, maxY, yBottom, yTop),
      }
      : null,
    axes: { xTicks, yTicks },
    qualAxes,
  };
}

export function ScatterPanel({
  csvInfo,
  selectedPointKey = null,
  onSelectPoint,
  metric = "albedo",
  onMetricChange,
}) {
  const { language } = useI18n();
  const showNumericValues = useAppStore((state) => state.showNumericValues);
  const colorblindMode = useAppStore((state) => state.colorblindMode);
  const colorMode = colorblindMode ? "accessible" : "default";
  const copy = language === "en"
    ? {
      chart: "Chart",
      takeawayTitle: "In short",
      ariaLabel: "Scatter chart",
      deltaAxis: "Δ °C",
      trendLegend: "Average trend",
      lowLegend: "cools less",
      highLegend: "cools more",
      rangeTitle: "day-night range",
      rangeBuckets: { low: "lower", mid: "medium", high: "wider" },
      switchLabel: "Chart view",
      albedoButton: "Reflectance",
      ndviButton: "Green cover",
      metrics: {
        albedo: {
          title: "Reflectance and day-night range",
          intro:
            "**How to read it:** The horizontal axis shows surfaces from more **absorbing** to more **reflective** (**albedo / reflectance**). The vertical axis shows the **day-night temperature range**. Each dot is one 1 km cell intersecting Bologna.",
          takeaway: [
            "**Absorbing surfaces:** often show a wider day-night range.",
            "**Reflective surfaces:** often show a smaller range because they warm less during the day.",
          ],
          note: "The dashed line shows the average pattern for Bologna. Dot colors follow the same cooling scale as the map, so color repeats the day-night value while position explains the relationship.",
          axisLabel: "reflectance",
          surfaceTitle: "surface",
          surfaceBuckets: { low: "absorbing", mid: "medium", high: "reflective" },
        },
        ndvi: {
          title: "Vegetation density and day-night range",
          intro:
            "**How to read it:** The horizontal axis shows **vegetation density (NDVI)** — sparse on the left, dense on the right. The vertical axis shows the **day-night temperature range**. Each dot is one 1 km cell intersecting Bologna.",
          takeaway: [
            "**Greener areas:** often have a smaller day-night range.",
            "**Sparsely vegetated or built-up areas:** tend to swing more between day and night.",
          ],
          note: "The dashed line shows the average pattern for Bologna. Dot colors follow the same cooling scale as the map, so color repeats the day-night value while position explains the relationship.",
          axisLabel: "NDVI",
          surfaceTitle: "vegetation",
          surfaceBuckets: { low: "sparse", mid: "moderate", high: "dense" },
        },
      },
    }
    : {
      chart: "Grafico",
      takeawayTitle: "In sintesi",
      ariaLabel: "Grafico scatter",
      deltaAxis: "Δ °C",
      trendLegend: "Tendenza media",
      lowLegend: "si raffredda poco",
      highLegend: "si raffredda molto",
      rangeTitle: "escursione",
      rangeBuckets: { low: "bassa", mid: "media", high: "ampia" },
      switchLabel: "Vista grafico",
      albedoButton: "Riflettanza",
      ndviButton: "Presenza di verde",
      metrics: {
        albedo: {
          title: "Riflettanza ed escursione termica",
          intro:
            "**Come leggerlo:** L'asse orizzontale mostra superfici da più **assorbenti** a più **riflettenti** (**albedo / riflettanza**). L'asse verticale mostra l'**escursione termica** tra giorno e notte. Ogni punto rappresenta una cella di 1 km che interseca Bologna.",
          takeaway: [
            "**Superfici assorbenti:** mostrano spesso un'escursione più ampia.",
            "**Superfici riflettenti:** mostrano spesso un'escursione più bassa perché si scaldano meno durante il giorno.",
          ],
          note: "La linea tratteggiata mostra l'andamento medio di Bologna. I colori dei punti seguono la stessa scala di raffreddamento della mappa, mentre la posizione spiega la relazione con riflettanza ed escursione.",
          axisLabel: "riflettanza",
          surfaceTitle: "superficie",
          surfaceBuckets: { low: "assorbente", mid: "media", high: "riflettente" },
        },
        ndvi: {
          title: "Densità della vegetazione ed escursione termica",
          intro:
            "**Come leggerlo:** L'asse orizzontale mostra la **densità della vegetazione (NDVI)** — scarsa a sinistra, densa a destra. L'asse verticale mostra l'**escursione termica** tra giorno e notte. Ogni punto rappresenta una cella di 1 km che interseca Bologna.",
          takeaway: [
            "**Aree molto verdi:** mostrano spesso un'escursione più contenuta.",
            "**Aree poco vegetate o costruite:** tendono a oscillare di più tra giorno e notte.",
          ],
          note: "La linea tratteggiata mostra l'andamento medio di Bologna. I colori dei punti seguono la stessa scala di raffreddamento della mappa, mentre la posizione spiega la relazione con vegetazione ed escursione.",
          axisLabel: "NDVI",
          surfaceTitle: "vegetazione",
          surfaceBuckets: { low: "scarsa", mid: "moderata", high: "densa" },
        },
      },
    };
  const metricCopy = copy.metrics[metric] || copy.metrics.albedo;

  const projectedPoints = useMemo(() => {
    const source = csvInfo.albedoDeltaPairs || [];
    if (metric === "ndvi") {
      return source
        .filter((point) => Number.isFinite(point.z))
        .map((point) => ({ ...point, x: point.z }));
    }
    return source;
  }, [csvInfo.albedoDeltaPairs, metric]);
  const scaleBackground = useMemo(
    () => getPaletteGradientCss("thermal", colorMode),
    [colorMode],
  );

  return (
    <div className="relation-scatter-panel">
      <ScatterPanelBody
        copy={copy}
        metric={metric}
        metricCopy={metricCopy}
        projectedPoints={projectedPoints}
        selectedPointKey={selectedPointKey}
        onSelectPoint={onSelectPoint}
        showNumericValues={showNumericValues}
        onMetricChange={onMetricChange}
        colorMode={colorMode}
        scaleBackground={scaleBackground}
      />
    </div>
  );
}

function ScatterPanelBody({
  copy,
  metric,
  metricCopy,
  projectedPoints,
  selectedPointKey,
  onSelectPoint,
  showNumericValues,
  onMetricChange,
  colorMode,
  scaleBackground,
}) {
  return (
    <div className="scatter-block">
      <div className="scatter-toolbar">
        <div className="scatter-switch" role="group" aria-label={copy.switchLabel}>
          <button
            type="button"
            className={metric === "albedo" ? "active" : ""}
            aria-pressed={metric === "albedo"}
            onClick={onMetricChange ? () => onMetricChange("albedo") : undefined}
          >
            {copy.albedoButton}
          </button>
          <button
            type="button"
            className={metric === "ndvi" ? "active" : ""}
            aria-pressed={metric === "ndvi"}
            onClick={onMetricChange ? () => onMetricChange("ndvi") : undefined}
          >
            {copy.ndviButton}
          </button>
        </div>
      </div>
      <div className="analysis-head">
        <div>
          <span className="section-kicker">{copy.chart}</span>
          <h2>{metricCopy.title}</h2>
        </div>
      </div>
      <RichText as="p" text={metricCopy.intro} />
      <div className="scatter-figure">
        <ScatterSvg
          csvPoints={projectedPoints}
          ariaLabel={copy.ariaLabel}
          deltaLabel={copy.deltaAxis}
          xLabel={metricCopy.axisLabel}
          selectedPointKey={selectedPointKey}
          onSelectPoint={onSelectPoint}
          showNumericValues={showNumericValues}
          colorMode={colorMode}
          tooltipCopy={{
            surfaceTitle: metricCopy.surfaceTitle,
            rangeTitle: copy.rangeTitle,
            surfaceBuckets: metricCopy.surfaceBuckets,
            rangeBuckets: copy.rangeBuckets,
          }}
        />
      </div>
      <div className="scatter-guides" aria-hidden="true">
        <div className="scatter-guide">
          <i className="scatter-guide-line" />
          <span>{copy.trendLegend}</span>
        </div>
        <div className="scatter-guide scatter-guide--scale">
          <span>{copy.lowLegend}</span>
          <i className="scatter-guide-scale" style={{ backgroundImage: scaleBackground }} />
          <span>{copy.highLegend}</span>
        </div>
      </div>
      <div className="metric-interpretation">
        <span>{copy.takeawayTitle}</span>
        <ul>
          {metricCopy.takeaway.map((item) => (
            <li key={item}><RichTextInline text={item} /></li>
          ))}
        </ul>
      </div>
      <RichText as="p" text={metricCopy.note} />
    </div>
  );
}

// Scatter chart drawn directly as SVG so it can be themed alongside the rest of the page
// and we avoid pulling a charting library for a single chart shape. Points sit in the
// [SCATTER_X_START..SCATTER_X_END] x [SCATTER_Y_TOP..SCATTER_Y_BOTTOM] viewport; a
// least-squares trend line, gridlines, and tick labels frame the data. Each point gets a
// larger transparent hit-area sibling so clicking and keyboard focus are easier.
function ScatterSvg({
  csvPoints = [],
  ariaLabel,
  deltaLabel,
  xLabel,
  selectedPointKey = null,
  onSelectPoint,
  showNumericValues = false,
  colorMode = "default",
  tooltipCopy = null,
}) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const layout = SCATTER_LAYOUT_INLINE;
  const { viewWidth, viewHeight, xStart, xEnd, yTop, yBottom, hitRadius, pointRadii } = layout;
  const numericMode = showNumericValues;
  const qualitativeCopy = useMemo(
    () => (tooltipCopy
      ? { xBuckets: tooltipCopy.surfaceBuckets, yBuckets: tooltipCopy.rangeBuckets }
      : null),
    [tooltipCopy],
  );
  const { points, trendLine, axes, qualAxes } = useMemo(
    () => buildScatterModel(csvPoints, selectedPointKey, qualitativeCopy, layout, colorMode),
    [csvPoints, selectedPointKey, qualitativeCopy, layout, colorMode],
  );

  const xTickDecimals = useMemo(
    () => getTickDecimals(axes?.xTicks, Math.abs((axes?.xTicks?.[0]?.value ?? 0)) >= 1 ? 1 : 2),
    [axes?.xTicks],
  );
  const yTickDecimals = useMemo(
    () => getTickDecimals(axes?.yTicks, Math.abs((axes?.yTicks?.[0]?.value ?? 0)) >= 10 ? 0 : 1),
    [axes?.yTicks],
  );
  const formatXTick = (value) => value.toFixed(xTickDecimals);
  const formatYTick = (value) => value.toFixed(yTickDecimals);

  const hoveredPoint = points.find((point) => point.key === hoveredKey) || null;
  const selectedPoint = points.find((point) => point.isSelected) || null;
  const tipPoint = hoveredPoint || selectedPoint;

  const tipLines = (() => {
    if (!tipPoint) return null;
    if (numericMode) {
      return [
        `${xLabel}: ${tipPoint.rawX.toFixed(3)}`,
        `${deltaLabel}: ${tipPoint.rawY.toFixed(2)}`,
      ];
    }
    if (!tooltipCopy) return null;
    return [
      `${tooltipCopy.surfaceTitle}: ${tooltipCopy.surfaceBuckets[tipPoint.xBucket]}`,
      `${tooltipCopy.rangeTitle}: ${tooltipCopy.rangeBuckets[tipPoint.yBucket]}`,
    ];
  })();

  const tooltip = (() => {
    if (!tipPoint || !tipLines) return null;
    const charWidth = 1.6;
    const longest = Math.max(...tipLines.map((line) => line.length));
    const tipWidth = Math.min(viewWidth - 6, Math.max(28, longest * charWidth + 3.2));
    const tipHeight = 9.6;
    const anchorX = tipPoint.plotX;
    const anchorY = tipPoint.plotY;
    let tipX = anchorX + 3;
    let tipY = anchorY - tipHeight - 1.5;
    if (tipX + tipWidth > viewWidth - 1) tipX = anchorX - tipWidth - 3;
    if (tipX < xStart - 6) tipX = xStart - 6;
    if (tipY < 1) tipY = anchorY + 4;
    return { tipX, tipY, tipWidth, tipHeight };
  })();

  return (
    <svg
      className="scatter"
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      role="img"
      aria-label={ariaLabel}
    >
      {numericMode ? (
        <>
          {axes?.xTicks.map((tick) => (
            <line
              key={`gx-${tick.value}`}
              className="scatter-gridline"
              x1={tick.plot}
              y1={yTop}
              x2={tick.plot}
              y2={yBottom}
            />
          ))}
          {axes?.yTicks.map((tick) => (
            <line
              key={`gy-${tick.value}`}
              className="scatter-gridline"
              x1={xStart}
              y1={tick.plot}
              x2={xEnd}
              y2={tick.plot}
            />
          ))}
        </>
      ) : (
        <>
          {qualAxes?.xBoundaries.map((boundary, index) => (
            <line
              key={`qbx-${index}`}
              className="scatter-gridline scatter-gridline--boundary"
              x1={boundary.plot}
              y1={yTop}
              x2={boundary.plot}
              y2={yBottom}
            />
          ))}
          {qualAxes?.yBoundaries.map((boundary, index) => (
            <line
              key={`qby-${index}`}
              className="scatter-gridline scatter-gridline--boundary"
              x1={xStart}
              y1={boundary.plot}
              x2={xEnd}
              y2={boundary.plot}
            />
          ))}
        </>
      )}

      <line className="scatter-axis" x1={xStart} y1={yBottom} x2={xEnd} y2={yBottom} />
      <line className="scatter-axis" x1={xStart} y1={yTop} x2={xStart} y2={yBottom} />

      {numericMode ? (
        <>
          {axes?.xTicks.map((tick) => (
            <g key={`tx-${tick.value}`}>
              <line className="scatter-tick" x1={tick.plot} y1={yBottom} x2={tick.plot} y2={yBottom + 1.4} />
              <text className="scatter-tick-label" x={tick.plot} y={yBottom + 4.6} textAnchor="middle">{formatXTick(tick.value)}</text>
            </g>
          ))}
          {axes?.yTicks.map((tick) => (
            <g key={`ty-${tick.value}`}>
              <line className="scatter-tick" x1={xStart - 1.4} y1={tick.plot} x2={xStart} y2={tick.plot} />
              <text className="scatter-tick-label" x={xStart - 2} y={tick.plot + 1.2} textAnchor="end">{formatYTick(tick.value)}</text>
            </g>
          ))}
        </>
      ) : (
        <>
          {qualAxes?.xLabels.map((tick, index) => (
            <text
              key={`qtx-${index}`}
              className="scatter-tick-label scatter-tick-label--qualitative"
              x={tick.plot}
              y={yBottom + 4.6}
              textAnchor="middle"
            >{tick.label}</text>
          ))}
          {qualAxes?.yLabels.map((tick, index) => (
            <text
              key={`qty-${index}`}
              className="scatter-tick-label scatter-tick-label--qualitative"
              x={xStart - 2}
              y={tick.plot + 1.2}
              textAnchor="end"
            >{tick.label}</text>
          ))}
        </>
      )}

      {trendLine && (
        <path
          className="scatter-trendline"
          d={`M${trendLine.x1},${trendLine.y1} L${trendLine.x2},${trendLine.y2}`}
        />
      )}

      {points.map((point) => {
        const isHovered = hoveredKey === point.key;
        const radius = point.isSelected
          ? pointRadii.selected
          : isHovered ? pointRadii.hover : pointRadii.base;
        return (
          <circle
            key={point.key}
            className={`scatter-point${point.isSelected ? " is-selected" : ""}${isHovered ? " is-hovered" : ""}`}
            cx={point.plotX}
            cy={point.plotY}
            r={radius}
              style={{ "--scatter-point-fill": point.fill }}
              fill={point.fill}
          />
        );
      })}

      {points.map((point) => (
        <circle
          key={`hit-${point.key}`}
          className="scatter-hit"
          cx={point.plotX}
          cy={point.plotY}
          r={hitRadius}
          tabIndex={onSelectPoint ? 0 : undefined}
          role={onSelectPoint ? "button" : undefined}
          aria-label={onSelectPoint ? `${xLabel} ${point.rawX.toFixed(3)}, ${deltaLabel} ${point.rawY.toFixed(2)}` : undefined}
          onClick={onSelectPoint ? () => onSelectPoint(point.isSelected ? null : point) : undefined}
          onMouseEnter={() => setHoveredKey(point.key)}
          onMouseLeave={() => setHoveredKey((prev) => (prev === point.key ? null : prev))}
          onFocus={() => setHoveredKey(point.key)}
          onBlur={() => setHoveredKey((prev) => (prev === point.key ? null : prev))}
          onKeyDown={onSelectPoint ? (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectPoint(point.isSelected ? null : point);
            }
          } : undefined}
        />
      ))}

      {tooltip && tipLines && (
        <g className="scatter-tooltip" pointerEvents="none">
          <rect x={tooltip.tipX} y={tooltip.tipY} width={tooltip.tipWidth} height={tooltip.tipHeight} rx={1.2} />
          {tipLines.map((line, index) => (
            <text key={line} x={tooltip.tipX + 1.6} y={tooltip.tipY + 3.8 + index * 4}>{line}</text>
          ))}
        </g>
      )}

      <text className="scatter-axis-label" x={xStart + (xEnd - xStart) / 2} y={viewHeight - 1.4} textAnchor="middle">{xLabel}</text>
      <text className="scatter-axis-label" x={1.5} y={yTop - 2.4}>{deltaLabel}</text>
    </svg>
  );
}
