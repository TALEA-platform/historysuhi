import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { BookOpen, HelpCircle, X } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { supportConfig } from "./supportConfig.js";

function isEditableTarget(target) {
  return target instanceof HTMLElement && (
    target.tagName === "INPUT"
    || target.tagName === "TEXTAREA"
    || target.tagName === "SELECT"
    || target.isContentEditable
  );
}

// Contextual support overlay: dims the page and draws persistent callout labels next
// to the key elements of the current view. Inspired by the "support mode" on
// my.fbk.eu/explorer — a static explanatory overlay rather than a next/prev tour.
//
// Scrolling: callouts use document-relative absolute positioning (rect.top +
// window.scrollY) so they scroll with the page natively — no per-event JS work,
// no lag between page and overlay. ResizeObserver still triggers a recompute
// when the document layout changes (toggle a panel, language switch, viewport
// resize). The dim backdrop and the top banner stay position: fixed because they
// belong to the viewport, not to a specific page position.

export function SupportModeOverlay() {
  const { language } = useI18n();
  const currentView = useAppStore((state) => state.currentView);
  const onboardingOpen = useAppStore((state) => state.onboardingOpen);
  const methodologyOpen = useAppStore((state) => state.methodologyOpen);
  const compareEnabled = useAppStore((state) => state.compareEnabled);
  const setState = useAppStore((state) => state.setState);
  const entries = supportConfig[currentView] || [];
  const [positions, setPositions] = useState([]);
  const foregroundOverlayOpen = onboardingOpen || methodologyOpen || (compareEnabled && currentView === "v1");

  const close = useCallback(() => setState({ supportModeOpen: false }), [setState]);
  const openGuide = useCallback(() => {
    setState({ onboardingOpen: true });
  }, [setState]);

  const copy = language === "en"
    ? {
      banner: "Support mode is on. Press **Guide** for a full walk-through.",
      ariaLabel: "Support mode controls",
      close: "Close support mode",
      closeTitle: "Close support mode (X)",
      guideButton: "Guide",
    }
    : {
      banner: "Modalità aiuto contestuale attiva. Premi **Guida** per la spiegazione completa.",
      ariaLabel: "Controlli modalità aiuto",
      close: "Esci dalla modalità aiuto",
      closeTitle: "Chiudi modalità aiuto (X)",
      guideButton: "Guida",
    };

  const recompute = useCallback(() => {
    const next = entries.map((entry) => {
      const el = document.querySelector(entry.selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return null;
      return {
        label: entry.label[language] || entry.label.en,
        showOutline: entry.showOutline !== false,
        calloutClassName: entry.calloutClassName || "",
        // Document-relative coords so callouts follow the page when scrolling
        // without us having to reposition them on every scroll event.
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      };
    }).filter(Boolean);
    setPositions(next);
  }, [entries, language]);

  useLayoutEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    // Layout-affecting events only — scroll is handled natively because the
    // callouts are absolutely positioned in document space.
    let rafId = null;
    const onChange = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        recompute();
      });
    };
    window.addEventListener("resize", onChange);
    const observer = new ResizeObserver(onChange);
    observer.observe(document.body);
    const observedTargets = new Set();
    for (const entry of entries) {
      const el = document.querySelector(entry.selector);
      if (!el || observedTargets.has(el)) continue;
      observedTargets.add(el);
      observer.observe(el);
    }
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onChange);
      observer.disconnect();
    };
  }, [entries, recompute]);

  useEffect(() => {
    if (foregroundOverlayOpen) return undefined;

    const onKey = (event) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;
      if (event.key.toLowerCase() === "x") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, foregroundOverlayOpen]);

  const bannerHtml = copy.banner
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  return (
    <>
      <div className="support-backdrop" aria-hidden="true" />
      <div className="support-banner" role="region" aria-label={copy.ariaLabel}>
        <div className="support-banner-copy">
          <HelpCircle size={16} />
          <span dangerouslySetInnerHTML={{ __html: bannerHtml }} />
        </div>
        <div className="support-banner-actions">
          <button type="button" className="support-guide" onClick={openGuide}>
            <BookOpen size={15} />
            <span>{copy.guideButton}</span>
          </button>
          <button
            type="button"
            className="support-close"
            onClick={close}
            aria-label={copy.close}
            title={copy.closeTitle}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {positions.map((item, index) => (
        <div
          key={index}
          className="support-callout-wrap"
          style={{
            top: item.top,
            left: item.left,
            width: item.width,
            height: item.height,
          }}
        >
          {item.showOutline && <div className="support-callout-outline" />}
          <div className={`support-callout ${item.calloutClassName}`.trim()}>
            <span className="support-callout-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="support-callout-text">{item.label}</span>
          </div>
        </div>
      ))}
    </>
  );
}
