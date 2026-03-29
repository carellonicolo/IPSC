# Security Policy

## Versioni Supportate

| Versione | Supportata |
|----------|-----------|
| 2.x.x   | Si        |
| 1.x.x   | No        |

## Segnalare una Vulnerabilita

Questo progetto e una **Progressive Web App client-side** che non gestisce dati sensibili, autenticazione, o comunicazioni server-side. Tuttavia, prendiamo la sicurezza seriamente.

### Come segnalare

Se scopri una vulnerabilita di sicurezza, **non aprire una Issue pubblica**. Invece:

1. Invia un'email a **security@nicolocarello.it** con:
   - Descrizione della vulnerabilita
   - Passi per riprodurla
   - Impatto potenziale
   - Eventuale fix suggerito

2. Riceverai una conferma entro **48 ore**
3. Lavoreremo insieme alla risoluzione prima della disclosure pubblica

### Ambito

Vulnerabilita rilevanti per questo progetto includono:

- **XSS (Cross-Site Scripting)** — Iniezione di codice tramite input non sanitizzati
- **Dipendenze compromesse** — Vulnerabilita note nelle dipendenze npm
- **Service Worker** — Comportamenti inattesi del caching PWA
- **PDF scaricabili** — Integrita dei file regolamento distribuiti

### Fuori ambito

- Attacchi che richiedono accesso fisico al dispositivo
- Social engineering
- Denial of Service su hosting di terze parti
- Bug nei browser stessi

## Best Practice Implementate

- Nessun dato utente viene trasmesso a server esterni
- Tutti i calcoli avvengono client-side
- Nessun utilizzo di `eval()`, `innerHTML` o pattern pericolosi
- Dipendenze aggiornate regolarmente
- Content Security Policy applicata tramite meta tag

## Ringraziamenti

Ringraziamo chiunque segnali responsabilmente vulnerabilita di sicurezza. I segnalatori verranno accreditati (con il loro consenso) nel CHANGELOG.
