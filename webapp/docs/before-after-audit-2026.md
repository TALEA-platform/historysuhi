# Confronto con il sito pubblicato — 10 settembre 2026

Confrontati i file effettivamente serviti da `https://talea.comune.bologna.it/historysuhi/`
con il checkout e il server locale `http://127.0.0.1:5173/historysuhi/`.
Il browser non risulta collegato: questa verifica riguarda risorse HTTP, codice,
geometrie e valori, non screenshot o interazioni visuali.

## I due link forniti

Entrambi contengono `yc`, che seleziona il 2025. Il secondo contiene inoltre
`n` (valori visibili), `o2s` (opacita 100%) e una posizione/zoom esplicita.
Per confrontare la stessa presentazione usare lo stesso hash su entrambi i siti.
Il 2026 locale si seleziona con `yd`: `/historysuhi/#2.v1.yd.l0`.

## Risultati verificati

- Tutti i 13 GeoTIFF annuali LST 2013–2025 sono identici al sito pubblicato
  tramite SHA-256. Il confine differisce come file ma ha geometria identica
  (differenza geometrica nulla).
- LST media 2025 invariata: circa 39,6011 °C. L'anomalia passa da circa
  −0,7618 a −0,8032 °C; gli hotspot dal 2,3914% al 2,2993%: cambiano perche
  la baseline include ora il 2026. Il 2026 ha LST media 40,9388 °C,
  anomalia +0,5344 °C e hotspot 7,0917%.
- Confermati 14 anni, 90 aree, sei quartieri e persistenze massime 14/6.
- L'NDVI pubblicato aveva pixel 10 m nonostante il nome `30m`.
  Il pacchetto importato conteneva invece un derivato realmente 30 m:
  era una perdita di dettaglio della mappa autonoma, ora corretta.
  `build_ndvi_display.py` ritaglia la sorgente 2026 nativa a 10 m senza
  ricampionamento: griglia 1514 × 1628, 1.407.929 pixel validi, tutti identici
  alla sorgente nelle celle conservate. Il server locale serve questo file.
  NDVI 30 m resta l'input degli indici termici e dello scatter.
- La scala giorno/notte 2025 (5,98–12,01 °C) era rimasta nel codice.
  Le 185 celle visualizzate 2026 coprono 4,9473–9,1655 °C: ora la scala
  condivisa da mappa e scatter copre 4,9–9,2 °C.
- Corrette le spiegazioni scatter che assumevano una correlazione negativa
  albedo/escursione: la correlazione 2026 e positiva (circa +0,545).
  I testi ora invitano a leggere la retta osservata senza dedurre causalita.
- Corrette la falsa descrizione della scala albedo come quantili e la
  metodologia che dichiarava 30 m come massimo dettaglio. Il layer annuale
  cronico/anomalo incrocia il top 5% 2026 con le anomalie 2026, non una
  classificazione cronica pluriennale. Inserita la nota MODIS provvisorio.
- Le scale continue degli altri indici restano domini di visualizzazione:
  i valori oltre gli estremi sono saturati cromaticamente, non eliminati.
  Nessun filtro arbitrario applicato agli outlier albedo.

Verificati 85 percorsi dati e la copertura cromatica di tutte le celle scatter.
Lint e build rieseguiti dopo le correzioni. Per la verifica visiva completa
resta necessario un browser collegato alla sessione.

## Successivo controllo visivo in Chrome

Collegamento browser riuscito. Aperte pubblicazione e localhost in due schede
con lo stesso hash iniziale 2025. Confrontate tramite screenshot LST 2025,
NDVI e giorno/notte; visitate tutte le cinque sezioni locali.
Il dettaglio NDVI a 10 m risulta visibile. Verificati nel DOM il filtro anomalie
con massimo 6, la selezione 2026 tramite tastiera sullo slider, 40,9 °C e
7,09% nella scheda annuale, i sei quartieri e le 90 aree con paginazione.
La selezione San Donato-San Vitale aggiorna mappa e scheda (1,72; 43,2 °C;
+0,46 °C; 7,8%). Provato il cambio IT/EN nella vista aree statistiche.
Ortofoto visibile sul 2026 dopo caricamento e riduzione dell'opacita del
raster; il primo sfondo bianco era transitorio. Nessun errore nei log console
raccolti durante il percorso. Nessuna nuova modifica al codice in questo
controllo. Non costituisce un test esaustivo di ogni layer o del layout mobile.
