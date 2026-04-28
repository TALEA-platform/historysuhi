import { useEffect, useState } from "react";
import { loadCsvInfo } from "../lib/csvInfo.js";

// Loads all CSV info tables once on mount and exposes the parsed object.
// The `cancelled` flag inside the effect is the standard React guard against
// setting state on an unmounted component when the async work resolves late.
const initialState = {
  tables: {},
  yearlyStats: [],
  yearlyDetails: {},
  acquisitionDetails: {},
  deltaStats: null,
  ndviDeltaStats: null,
  albedoDeltaPairs: [],
  loaded: false,
};

export function useCsvInfo() {
  const [csvInfo, setCsvInfo] = useState(initialState);

  useEffect(() => {
    let cancelled = false;
    loadCsvInfo()
      .then((loaded) => {
        if (!cancelled) setCsvInfo({ ...loaded, loaded: true });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setCsvInfo((current) => ({ ...current, loaded: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return csvInfo;
}
