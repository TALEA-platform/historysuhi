import { Info, X } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { RichText } from "../ui/RichText.jsx";

// First-run guide modal. The "talea:onboarded" flag in localStorage suppresses it
// on subsequent visits — the store only opens it on mount when the flag is missing.

export function OnboardingModal() {
  const { language } = useI18n();
  const setState = useAppStore((state) => state.setState);
  const close = () => {
    localStorage.setItem("talea:onboarded", "1");
    setState({ onboardingOpen: false });
  };
  const copy = language === "en"
    ? {
      close: "Close",
      kicker: "Guide to reading the map",
      title: "How to use the urban heat map",
      projectTitle: "Talea project",
      projectNote:
        "TALEA is a European project led by the Municipality of Bologna to address urban heat islands by combining nature-based solutions, digital tools and citizen participation, with the goal of creating more inclusive climate shelters in public space.",
      lead: [
        "The map you are viewing shows **Bologna's surface temperature in summer** as observed by satellites: roads, roofs, squares and vegetation. It is not air temperature, but it helps explain where the city stores more heat.",
        "The five views are arranged as a reading path: they begin with the citywide pattern, then move to change over time, physical drivers and, at the end, local summaries.",
      ],
      stepsAria: "Suggested steps",
      stepsTitle: "Quick start",
      quickSteps: [
        "**Follow the views in sequence.** The view buttons are below the main content and lead from the general city pattern to change over time, causes and local summaries.",
        "**Use 'Inspect'** to read values from the map.",
        "**Open 'How to read it'** for the full layer explanation.",
      ],
      fullGuideTitle: "Show the full guide",
      fullStepsTitle: "All suggested steps",
      viewsSectionTitle: "The five views",
      steps: [
        "**Use the sequence of views as a guide.** The selector is below the main content: the first views help you read the citywide pattern, the later ones explain changes, causes and local summaries.",
        "**Read the title and legend first.** The legend tells you whether you are looking at temperatures, differences, indices or years of recurrence.",
        "**Use 'Inspect'.** Hover over the map for a quick reading; click to pin a point and read its details.",
        "**Open 'How to read it'.** Each layer has a short explanation and a deeper-reading section.",
        "**Use the '? Help' button.** It opens contextual help for the current section and shows what the visible controls do.",
        "**Use the path as a progression.** Views 1 and 2 orient you, Views 3 and 4 explain why the pattern changes, and View 5 is the final territorial summary.",
        "**Turn on values only when needed.** Colors help with the overall reading; numbers help with more precise comparisons. They are not always temperatures: depending on the layer they may represent °C, differences from the usual pattern, years of recurrence or unitless indices, so they should be read together with the legend and the 'How to read it' panel.",
      ],
      importantTitle: "Three important things",
      important: [
        "**Surface, not air.** A road can be much hotter than the air measured by a weather station.",
        "**Anomalous does not mean the highest surface temperature in absolute terms.** It means different from the usual behaviour of that same place.",
        "**Districts and statistical areas are summaries.** They help compare zones, not describe every street or building.",
      ],
      guideCards: [
        {
          title: "1. Where it gets hot",
          text: "This opening view shows where the surface temperature is highest in a selected year and how that reading compares with the city average.",
        },
        {
          title: "2. Heat history",
          text: "This view reads heat over time, separating usual conditions, recurring anomalies, chronic heat and the specific behaviour of 2025.",
        },
        {
          title: "3. Why it happens",
          text: "This view focuses on the physical drivers: vegetation, bright or absorbent surfaces and synthetic indices. It helps explain why nearby areas can behave differently.",
        },
        {
          title: "4. Day and night",
          text: "This view shows how much the surface changes between day and night, revealing broader patterns at district scale rather than single-building behaviour.",
        },
        {
          title: "5. Districts and statistical areas",
          text: "This final view summarizes 2025 indicators for recognizable areas, letting you compare districts and then statistical areas for finer internal differences.",
        },
      ],
      enter: "Got it",
      methodology: "Open methodology",
      taleaCta: "Talea project ↗",
    }
    : {
      close: "Chiudi",
      kicker: "Guida per capire la webapp",
      title: "Come usare la webapp del caldo urbano",
      projectTitle: "Progetto Talea",
      projectNote:
        "TALEA è un progetto europeo guidato dal Comune di Bologna per affrontare il problema delle isole di calore urbane combinando soluzioni basate sulla natura, strumenti digitali e partecipazione dei cittadini, con l'obiettivo di creare spazi pubblici più inclusivi e capaci di funzionare come rifugi climatici.",
      lead: [
        "Questa webapp mostra la **temperatura di superficie di Bologna in estate** osservata dai satelliti: strade, tetti, piazze e vegetazione. Non è la temperatura dell'aria, ma aiuta a capire dove la città accumula più calore.",
        "La webapp è divisa in cinque sezioni, che seguono un percorso di lettura: si parte dal quadro generale della città, poi si passa ai cambiamenti nel tempo, ai fattori fisici e, alla fine, alle sintesi locali.",
      ],
      stepsAria: "Passi consigliati",
      stepsTitle: "Inizia rapidamente",
      quickSteps: [
        "**Segui il percorso in sequenza.** I pulsanti in basso accompagnano dal quadro generale della città ai cambiamenti nel tempo, alle cause e alle sintesi locali.",
        "**Usa 'Ispeziona'** per leggere i valori sulla mappa.",
        "**Apri 'Come leggerla'** per la spiegazione completa.",
      ],
      fullGuideTitle: "Mostra la guida completa",
      fullStepsTitle: "Tutti i passi consigliati",
      viewsSectionTitle: "Le cinque sezioni",
      steps: [
        "**Usa la sequenza delle sezioni come guida.** I pulsanti in basso aiutano a leggere prima il quadro urbano e poi cambiamenti, cause e sintesi locali.",
        "**Leggi prima titolo e legenda.** La legenda indica se sono visualizzate temperature, differenze, indici o anni di ricorrenza.",
        "**Usa 'Ispeziona'.** Passa sulla mappa per una lettura rapida; clicca per bloccare un punto e leggere il dettaglio.",
        "**Apri 'Come leggerla'.** Ogni layer ha una spiegazione breve e una sezione di approfondimento.",
        "**Usa il pulsante '? Aiuto'.** Apre un aiuto contestuale sulla sezione corrente e indica a cosa servono i controlli visibili in quel momento.",
        "**Usa il percorso come una progressione.** Le prime due sezioni orientano, le successive spiegano perché il pattern cambia e l'ultima offre la sintesi territoriale finale.",
        "**Accendi i valori solo quando servono.** I colori aiutano la lettura generale; i numeri aiutano nei confronti più precisi. A seconda del layer possono indicare °C, differenze dal normale, anni di ricorrenza o indici senza unità, quindi vanno letti insieme alla legenda e al pannello 'Come leggerla'.",
      ],
      importantTitle: "Tre cose importanti",
      important: [
        "**Superficie non aria.** Una strada può essere molto più calda dell'aria misurata da una stazione meteo.",
        "**Anomalo non significa con la temperatura più alta in assoluto.** Significa diverso dal comportamento abituale di quello stesso luogo.",
        "**Quartieri e aree statistiche sono sintesi.** Servono per confrontare zone, non per descrivere ogni strada o edificio.",
      ],
      guideCards: [
        {
          title: "1. Dove fa caldo",
          text: "Viene mostrato dove la temperatura di superficie è più alta nell'anno selezionato e come quel dato si confronta con la media urbana.",
        },
        {
          title: "2. Storia del caldo",
          text: "Il caldo viene letto nel tempo, distinguendo condizioni abituali, anomalie ricorrenti, caldo cronico e comportamento specifico del 2025.",
        },
        {
          title: "3. Perché succede",
          text: "L'attenzione si sposta sui fattori fisici: vegetazione, superfici chiare o assorbenti e indici sintetici. Questa lettura aiuta a capire perché aree vicine possono comportarsi in modo diverso.",
        },
        {
          title: "4. Giorno e notte",
          text: "Viene osservato quanto cambia la superficie tra giorno e notte, con pattern più ampi alla scala del quartiere invece del singolo edificio.",
        },
        {
          title: "5. Quartieri e aree statistiche",
          text: "Questa sezione finale riassume gli indicatori 2025 per aree riconoscibili, permettendo di confrontare i quartieri e poi le aree statistiche con maggiore dettaglio.",
        },
      ],
      enter: "Ho capito",
      methodology: "Apri metodologia",
      taleaCta: "Progetto Talea ↗",
    };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="modal">
        <button className="close-button" type="button" onClick={close} aria-label={copy.close}>
          <X size={19} />
        </button>
        <span className="section-kicker">{copy.kicker}</span>
        <h2 id="onboarding-title">{copy.title}</h2>
        <div className="guide-project-note">
          <span className="guide-project-kicker">{copy.projectTitle}</span>
          <RichText as="p" className="guide-project-copy" text={copy.projectNote} />
        </div>
        <div className="guide-intro">
          {copy.lead.map((item) => (
            <RichText
              key={item}
              as="p"
              className="guide-lead"
              text={item}
            />
          ))}
        </div>
        <section className="guide-steps guide-quick" aria-label={copy.stepsAria}>
          <h3>{copy.stepsTitle}</h3>
          <ol>
            {copy.quickSteps.map((item) => (
              <li key={item}><RichText as="span" text={item} /></li>
            ))}
          </ol>
        </section>
        <details className="onboarding-full-guide">
          <summary>{copy.fullGuideTitle}</summary>
          <div className="guide-layout">
            <section className="guide-steps" aria-label={copy.stepsAria}>
              <h3>{copy.fullStepsTitle}</h3>
              <ol>
                {copy.steps.map((item) => (
                  <li key={item}><RichText as="span" text={item} /></li>
                ))}
              </ol>
            </section>
            <section className="guide-callout">
              <h3>{copy.importantTitle}</h3>
              {copy.important.map((item) => (
                <RichText key={item} as="p" text={item} />
              ))}
            </section>
          </div>
          <h3 className="guide-view-title">{copy.viewsSectionTitle}</h3>
          <div className="guide-view-grid">
            {copy.guideCards.map((card) => (
              <article key={card.title}>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </details>
        <div className="guide-actions">
          <button className="primary-action" type="button" onClick={close}>{copy.enter}</button>
          <button className="text-button" type="button" onClick={() => setState({ methodologyOpen: true })}>
            <Info size={16} />
            {copy.methodology}
          </button>
          <a
            className="text-button"
            href="https://talea.comune.bologna.it"
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.taleaCta}
          </a>
        </div>
      </div>
    </div>
  );
}
