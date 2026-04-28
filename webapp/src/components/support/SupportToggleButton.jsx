import { HelpCircle, X } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";

// Floating help pill anchored to the bottom-right of the viewport. Visible label
// makes it scannable: a circular icon-only button was easy to miss against busy
// map content. When support mode is active, the same slot turns into an explicit
// exit control so the user always has a consistent way out.

export function SupportToggleButton() {
  const { language } = useI18n();
  const setState = useAppStore((state) => state.setState);
  const welcomeOpen = useAppStore((state) => state.welcomeOpen);
  const supportModeOpen = useAppStore((state) => state.supportModeOpen);

  if (welcomeOpen) return null;

  const copy = supportModeOpen
    ? {
      label: language === "en" ? "Exit" : "Esci",
      aria: language === "en" ? "Exit support mode" : "Esci dalla modalità aiuto",
      icon: <X size={22} aria-hidden="true" />,
      className: "support-floating support-floating--exit",
      onClick: () => setState({ supportModeOpen: false }),
    }
    : {
      label: language === "en" ? "Help" : "Aiuto",
      aria: language === "en" ? "Open contextual help" : "Apri l'aiuto contestuale",
      icon: <HelpCircle size={22} aria-hidden="true" />,
      className: "support-floating",
      onClick: () => setState({ supportModeOpen: true }),
    };

  return (
    <button
      type="button"
      className={copy.className}
      onClick={copy.onClick}
      aria-label={copy.aria}
      title={copy.aria}
    >
      {copy.icon}
      <span className="support-floating-label">{copy.label}</span>
    </button>
  );
}
