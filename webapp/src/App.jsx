import { useEffect } from "react";
import { useAppStore } from "./store/appStore.js";
import { useCsvInfo } from "./hooks/useCsvInfo.js";
import { useUrlSync } from "./hooks/useUrlSync.js";
import { BrandArcs } from "./components/layout/BrandArcs.jsx";
import { Header } from "./components/layout/Header.jsx";
import { ProgressIndicator } from "./components/layout/ProgressIndicator.jsx";
import { TopNav } from "./components/layout/TopNav.jsx";
import { Footer } from "./components/layout/Footer.jsx";
import { View1 } from "./components/views/View1.jsx";
import { View2 } from "./components/views/View2.jsx";
import { View3 } from "./components/views/View3.jsx";
import { View4 } from "./components/views/View4.jsx";
import { View5 } from "./components/views/View5.jsx";
import { OnboardingModal } from "./components/modals/OnboardingModal.jsx";
import { MethodologyDrawer } from "./components/modals/MethodologyDrawer.jsx";
import { SurfaceValuesNotice } from "./components/modals/SurfaceValuesNotice.jsx";
import { CompareModal } from "./components/modals/CompareModal.jsx";
import { WelcomeModal } from "./components/modals/WelcomeModal.jsx";
import { SupportModeOverlay } from "./components/support/SupportModeOverlay.jsx";
import { SupportToggleButton } from "./components/support/SupportToggleButton.jsx";

// Top-level shell: chrome (header, nav, footer), the active view, and the two modals.
// All state lives in the Zustand store; useUrlSync mirrors the relevant slice into the URL
// so the page is shareable. CSV-derived data is loaded once via useCsvInfo and threaded into
// the views that need it (1 and 4).

export function App() {
  const colorblindMode = useAppStore((state) => state.colorblindMode);
  const currentView = useAppStore((state) => state.currentView);
  const welcomeOpen = useAppStore((state) => state.welcomeOpen);
  const onboardingOpen = useAppStore((state) => state.onboardingOpen);
  const methodologyOpen = useAppStore((state) => state.methodologyOpen);
  const compareEnabled = useAppStore((state) => state.compareEnabled);
  const supportModeOpen = useAppStore((state) => state.supportModeOpen);
  const csvInfo = useCsvInfo();

  useUrlSync();

  // When the user switches view, scroll back to the top so the next view starts
  // from its intro rather than wherever the previous view was left scrolled.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  useEffect(() => {
    if (!welcomeOpen && !onboardingOpen && !methodologyOpen) return undefined;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousOverscrollBehavior = documentElement.style.overscrollBehavior;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [welcomeOpen, onboardingOpen, methodologyOpen]);

  return (
    <div className={colorblindMode ? "theme-accessible" : ""}>
      <BrandArcs />
      <div className="app-shell">
        <Header />
        <ProgressIndicator />
        <main>
          {currentView === "v1" && <View1 csvInfo={csvInfo} />}
          {currentView === "v2" && <View2 />}
          {currentView === "v3" && <View3 />}
          {currentView === "v4" && <View4 csvInfo={csvInfo} />}
          {currentView === "v5" && <View5 />}
        </main>
        <TopNav />
        <Footer />
      </div>
      {welcomeOpen && <WelcomeModal />}
      {onboardingOpen && <OnboardingModal />}
      {methodologyOpen && <MethodologyDrawer />}
      {compareEnabled && currentView === "v1" && <CompareModal />}
      {supportModeOpen && <SupportModeOverlay />}
      <SupportToggleButton />
      <SurfaceValuesNotice />
    </div>
  );
}
