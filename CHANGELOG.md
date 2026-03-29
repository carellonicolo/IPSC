# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate in questo file.

Il formato e basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/), e questo progetto aderisce al [Semantic Versioning](https://semver.org/lang/it/).

---

## [2.0.0] - 2026-03-28

### Aggiunto

- **Chrono Check Arbitrale** — Nuovo strumento completo per il controllo Power Factor in gara
  - Procedura a 3 step fedele alla Regola IPSC 5.6.3 (Edizione Gennaio 2026)
  - Step 1: 3 colpi con media velocita (Reg. 5.6.3.3)
  - Step 2: Retest con 3 colpi aggiuntivi, media best 3 su 6 (Reg. 5.6.3.6)
  - Step 3: Ultima chance con 7deg colpo o 2deg palla piu pesante (Reg. 5.6.3.7)
  - Gauge SVG semicircolare animato con zone colorate (rosso/arancione/verde)
  - Troncamento PF senza arrotondamento (Reg. 5.6.3.5)
  - Evidenziazione visiva delle 3 velocita piu alte durante il retest
  - Soglie IPSC Handgun complete (Major >= 170, Open 9mm >= 160, Minor >= 125)
- **Tab Switcher principale** — L'app ora offre due funzionalita paritarie accessibili con un tab nell'header:
  - "Score Calculator" per il calcolo Hit Factor
  - "Chrono Check" per il controllo Power Factor arbitrale
- **Layout desktop a 2 colonne** per il Chrono Check (speculare allo Score Calculator)
- **Risultato PF grande** con badge PASS/FAIL sulla colonna destra sticky (desktop)
- **Documentazione completa della repository** — README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, CHANGELOG, SECURITY, Issue/PR templates, CI workflow

### Modificato

- **Card Power Factor** nello Score Calculator — Layout ristrutturato con titolo uppercase coerente e toggle Minor/Major full-width
- **package.json** — Aggiornati metadati progetto (nome, descrizione, autore, repository, keywords)

---

## [1.0.0] - 2025-12-01

### Aggiunto

- **Score Calculator** — Calcolatore Hit Factor IPSC completo
  - Contatori per Alpha (A), Charlie (C), Delta (D)
  - Contatori per Miss (M), No-Shoot (NS), Procedural
  - Toggle Major/Minor per adattare punteggi C e D
  - Input tempo stage in secondi
  - Calcolo Hit Factor in tempo reale
  - Punteggio minimo a zero (floor)
- **Layout responsive** — Griglia a 2 colonne (desktop) con colonna destra sticky, colonna singola (mobile) con bottom bar fissa
- **Modali informativi** — Hit Factor, Power Factor, Hits, Penalita, ciascuno con spiegazioni dettagliate
- **Manuale Tecnico IPSC integrato** con 5 sezioni a tab:
  - Sicurezza & DQ (Cap. 10)
  - Divisioni Dettagliate (App. D1-D5)
  - Equipaggiamento (Cap. 5)
  - Target & Punti (Cap. 9)
  - Procedure & RO (Reg. 8.3)
- **Download PDF** — 4 regolamenti ufficiali scaricabili:
  - IPSC Handgun Competition Rules (Jan 2026)
  - Regolamento Handgun FITDS (Gen 2024)
  - Regolamento Sportivo FITDS (2025)
  - Appendici con Quote (2025)
- **Tabella ricarica** — Esempi indicativi per 9x19/21, .40 S&W, .38 Super, .45 ACP, .38 Spc con avvertenza di sicurezza
- **Design System** — iOS-inspired glassmorphism con:
  - CSS Variables per colori, ombre, bordi, tipografia
  - Dark/Light mode automatico + toggle manuale
  - Blob animati come sfondo (backdrop blur)
  - Animazioni fadeIn e slideUp per modali
- **PWA** — Service Worker con auto-update, manifest, icone, standalone mode
- **Accessibilita** — aria-label su tutti i bottoni, chiusura modale con Escape, prevenzione scroll body

---

## Convenzioni

- **Added** per nuove funzionalita
- **Changed** per modifiche a funzionalita esistenti
- **Deprecated** per funzionalita che verranno rimosse
- **Removed** per funzionalita rimosse
- **Fixed** per correzione bug
- **Security** per vulnerabilita risolte
