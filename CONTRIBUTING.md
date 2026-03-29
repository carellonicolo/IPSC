# Contribuire a IPSC Score

Grazie per il tuo interesse nel contribuire a **IPSC Score**! Ogni contributo, che sia una segnalazione di bug, una richiesta di funzionalita, un miglioramento alla documentazione o del codice, e benvenuto e apprezzato.

## Sommario

- [Codice di Condotta](#codice-di-condotta)
- [Come posso contribuire?](#come-posso-contribuire)
  - [Segnalare un Bug](#segnalare-un-bug)
  - [Proporre una Funzionalita](#proporre-una-funzionalita)
  - [Contribuire con Codice](#contribuire-con-codice)
  - [Migliorare la Documentazione](#migliorare-la-documentazione)
- [Setup dell'Ambiente di Sviluppo](#setup-dellambiente-di-sviluppo)
- [Linee Guida per il Codice](#linee-guida-per-il-codice)
- [Processo di Review](#processo-di-review)

---

## Codice di Condotta

Questo progetto adotta il [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Partecipando, ti impegni a mantenere un ambiente rispettoso e inclusivo per tutti.

---

## Come posso contribuire?

### Segnalare un Bug

Hai trovato un bug? Apri una [Issue](https://github.com/nicolocarello/IPSC/issues/new?template=bug_report.md) utilizzando il template "Bug Report" e includi:

1. **Descrizione chiara** del problema
2. **Passi per riprodurlo** (step-by-step)
3. **Comportamento atteso** vs. **comportamento effettivo**
4. **Screenshot** se applicabile
5. **Ambiente**: browser, sistema operativo, versione dell'app

### Proporre una Funzionalita

Hai un'idea per migliorare l'app? Apri una [Issue](https://github.com/nicolocarello/IPSC/issues/new?template=feature_request.md) con il template "Feature Request" e descrivi:

1. **Il problema** che la funzionalita risolverebbe
2. **La soluzione proposta** con quanti piu dettagli possibili
3. **Alternative considerate** (se ce ne sono)
4. **Contesto aggiuntivo** — sei un tiratore, un arbitro, un armiere?

### Contribuire con Codice

1. **Cerca** nelle [Issues](https://github.com/nicolocarello/IPSC/issues) aperte per assicurarti che qualcuno non stia gia lavorando sulla stessa cosa
2. **Forka** la repository
3. **Crea un branch** dal `main`:
   ```bash
   git checkout -b feature/nome-funzionalita
   # oppure
   git checkout -b fix/nome-bug
   ```
4. **Implementa** le modifiche seguendo le [Linee Guida per il Codice](#linee-guida-per-il-codice)
5. **Testa** che tutto funzioni:
   ```bash
   npm run lint
   npm run build
   ```
6. **Committa** con un messaggio descrittivo:
   ```bash
   git commit -m "feat: aggiungi calcolatore Virginia Count"
   ```
7. **Pusha** il branch e apri una **Pull Request**

### Migliorare la Documentazione

La documentazione e fondamentale. Puoi contribuire:

- Correggendo errori grammaticali o di battitura
- Migliorando le spiegazioni delle regole IPSC
- Aggiungendo traduzioni (l'app e attualmente in italiano)
- Aggiornando il README con nuove funzionalita

---

## Setup dell'Ambiente di Sviluppo

### Prerequisiti

- **Node.js** >= 18.0
- **npm** >= 9.0
- Un editor con supporto ESLint (consigliato: VS Code)

### Installazione

```bash
# Forka e clona la repository
git clone https://github.com/TUO-USERNAME/IPSC.git
cd IPSC

# Installa le dipendenze
npm install

# Avvia il dev server
npm run dev
```

### Struttura del Progetto

```
src/
├── App.jsx              # Componente principale + modali + tab switcher
├── index.css            # Design system (variabili CSS, layout, animazioni)
├── main.jsx             # Entry point
├── components/
│   ├── HitCounter.jsx   # Contatore +/- per hits e penalita
│   ├── ChronoCheck.jsx  # Chrono Check arbitrale completo
│   └── Modal.jsx        # Modale riutilizzabile
└── utils/
    └── scoring.js       # Logica calcolo IPSC
```

---

## Linee Guida per il Codice

### Stile Generale

- **React funzionale** — Usa solo componenti funzionali con Hooks
- **Inline styles** — L'app usa prevalentemente inline styles con variabili CSS. Mantieni questo pattern per coerenza
- **Naming** — Componenti in PascalCase, funzioni/variabili in camelCase
- **Accessibilita** — Aggiungi sempre `aria-label` sui bottoni icon-only
- **Responsive** — Testa sempre sia su mobile (<768px) che desktop (>=768px)

### Convenzioni di Commit

Seguiamo la convenzione [Conventional Commits](https://www.conventionalcommits.org/):

| Prefisso | Utilizzo |
|----------|----------|
| `feat:` | Nuova funzionalita |
| `fix:` | Correzione bug |
| `docs:` | Modifiche alla documentazione |
| `style:` | Formattazione, CSS (nessun cambio logico) |
| `refactor:` | Refactoring del codice |
| `perf:` | Miglioramenti performance |
| `test:` | Aggiunta/modifica test |
| `chore:` | Modifiche a build, CI, dipendenze |

### Regolamento IPSC

Se modifichi la logica di scoring o del chrono check, **cita sempre la regola IPSC specifica** nel commento del commit e nella PR. Esempio:

```
fix: correggi calcolo PF per troncamento decimali (Reg. 5.6.3.5)
```

### Checklist Pre-PR

- [ ] `npm run lint` passa senza errori
- [ ] `npm run build` compila correttamente
- [ ] Testato su mobile (o DevTools responsive)
- [ ] Testato su desktop
- [ ] Testato in dark mode e light mode
- [ ] Nessuna regressione nelle funzionalita esistenti

---

## Processo di Review

1. Ogni PR richiede almeno **1 review approvata** prima del merge
2. La CI deve passare (lint + build)
3. Le PR vengono mergiate con **squash merge** per mantenere la storia pulita
4. Il reviewer puo richiedere modifiche — rispondi ai commenti e aggiorna il branch

---

## Riconoscimenti

Ogni contributore verra aggiunto alla sezione Contributors del progetto. Il tuo contributo, grande o piccolo, fa la differenza!

---

<p align="center">
  <sub>Grazie per rendere IPSC Score migliore per tutta la comunita del Tiro Dinamico!</sub>
</p>
