# IPSC Score

> Calcolatore Hit Factor e Chrono Check per il tiro sportivo IPSC/FITDS

[![Licenza MIT](https://img.shields.io/badge/Licenza-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Installabile-5a0fc8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Website](https://img.shields.io/badge/Live-ipsc.nicolocarello.it-green)](https://ipsc.nicolocarello.it)
[![GitHub stars](https://img.shields.io/github/stars/carellonicolo/IPSC?style=social)](https://github.com/carellonicolo/IPSC)
[![GitHub issues](https://img.shields.io/github/issues/carellonicolo/IPSC)](https://github.com/carellonicolo/IPSC/issues)

## Panoramica

IPSC Score e una Progressive Web App dedicata al tiro sportivo dinamico (IPSC/FITDS). L'applicazione offre due strumenti fondamentali per tiratori e direttori di gara: un calcolatore di Hit Factor conforme al regolamento IPSC 2026 e un tool di verifica cronografica per il controllo del fattore di potenza delle munizioni.

Essendo una PWA, l'applicazione e installabile su qualsiasi dispositivo e funziona completamente offline, rendendola ideale per l'uso in poligono dove la connettivita potrebbe essere limitata.

Disponibile all'indirizzo [ipsc.nicolocarello.it](https://ipsc.nicolocarello.it).

## Funzionalita Principali

- **Calcolatore Hit Factor** — Calcolo rapido del Hit Factor (punti/tempo) con supporto per tutte le divisioni IPSC
- **Chrono Check** — Verifica cronografica per il controllo del fattore di potenza (Minor/Major) secondo regolamento IPSC 2026
- **Modalita offline** — Funzionamento completo senza connessione internet grazie alla tecnologia PWA
- **Installabile** — Aggiungibile alla schermata home di qualsiasi dispositivo mobile
- **Interfaccia ottimizzata** — Design pensato per l'uso rapido in campo gara con pulsanti grandi e leggibilita elevata
- **Responsive** — Adattabile a smartphone, tablet e desktop

## Tech Stack

| Tecnologia | Utilizzo |
|:--|:--|
| ![React](https://img.shields.io/badge/React_19-61dafb?logo=react&logoColor=white) | Framework UI |
| ![TypeScript](https://img.shields.io/badge/TypeScript_5-3178c6?logo=typescript&logoColor=white) | Linguaggio tipizzato |
| ![Vite](https://img.shields.io/badge/Vite_5-646cff?logo=vite&logoColor=white) | Build tool |
| ![PWA](https://img.shields.io/badge/PWA-5a0fc8) | Offline e installabilita |
| ![Lucide](https://img.shields.io/badge/Lucide_React-f56565) | Iconografia |

## Requisiti

- **Node.js** >= 18
- **npm** >= 9 (oppure bun)

## Installazione

```bash
git clone https://github.com/carellonicolo/IPSC.git
cd IPSC
npm install
npm run dev
```

L'applicazione sara disponibile su `http://localhost:5173`.

## Utilizzo

1. **Hit Factor** — Inserisci il punteggio e il tempo per ottenere il calcolo del Hit Factor
2. **Chrono Check** — Inserisci i dati cronografici (velocita, peso proiettile) per verificare il fattore di potenza

## Struttura del Progetto

```
IPSC/
├── src/
│   ├── components/     # Componenti React (calcolatori, UI)
│   ├── pages/          # Pagine dell'applicazione
│   ├── lib/            # Logica di calcolo IPSC
│   └── hooks/          # Custom hooks
├── public/             # Asset statici e manifest PWA
├── index.html          # Entry point HTML
└── vite.config.ts      # Configurazione Vite + PWA
```

## Deploy

```bash
npm run build
```

La cartella `dist/` e deployabile su Cloudflare Pages, Netlify o qualsiasi hosting statico. La configurazione PWA e inclusa automaticamente nel build.

## Contribuire

I contributi sono benvenuti! Consulta le [linee guida per contribuire](CONTRIBUTING.md) per maggiori dettagli.

## Licenza

Distribuito con licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli completi.

## Autore

**Nicolo Carello**
- GitHub: [@carellonicolo](https://github.com/carellonicolo)
- Website: [nicolocarello.it](https://nicolocarello.it)

---

<sub>Sviluppato con l'ausilio dell'intelligenza artificiale.</sub>

## Progetti Correlati

Questo progetto fa parte di una collezione di strumenti didattici e applicazioni open-source:

| Progetto | Descrizione |
|:--|:--|
| [DFA Visual Editor](https://github.com/carellonicolo/AFS) | Editor visuale per automi DFA |
| [Turing Machine](https://github.com/carellonicolo/Turing-Machine) | Simulatore di Macchina di Turing |
| [Scheduler](https://github.com/carellonicolo/Scheduler) | Simulatore di scheduling CPU |
| [Subnet Calculator](https://github.com/carellonicolo/Subnet) | Calcolatore subnet IPv4/IPv6 |
| [Base Converter](https://github.com/carellonicolo/base-converter) | Suite di conversione multi-funzionale |
| [Gioco del Lotto](https://github.com/carellonicolo/giocodellotto) | Simulatore Lotto e SuperEnalotto |
| [MicroASM](https://github.com/carellonicolo/microasm) | Simulatore assembly |
| [Flow Charts](https://github.com/carellonicolo/flow-charts) | Editor di diagrammi di flusso |
| [Cypher](https://github.com/carellonicolo/cypher) | Toolkit di crittografia |
| [Snake](https://github.com/carellonicolo/snake) | Snake game retro |
| [Pong](https://github.com/carellonicolo/pongcarello) | Pong game |
| [Calculator](https://github.com/carellonicolo/calculator-carello) | Calcolatrice scientifica |
| [Quiz](https://github.com/carellonicolo/quiz) | Piattaforma quiz scolastici |
| [Carello Hub](https://github.com/carellonicolo/carello-hub) | Dashboard educativa |
| [Prof Carello](https://github.com/carellonicolo/prof-carello) | Gestionale lezioni private |
| [DOCSITE](https://github.com/carellonicolo/DOCSITE) | Piattaforma documentale |
