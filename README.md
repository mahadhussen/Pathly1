# Habee — din personliga att-göra-lista

En att-göra-lista som känns gjord **just för dig**. Du väljer namn, färg och
utseende, och appen hälsar på dig, recolour:ar sig efter din smak och håller
ordning på allt — utan konto, utan server, utan spårning.

**Gratis för alla. Ingen inloggning, inga API-nycklar, ingen molnlagring.** Allt
körs i webbläsaren och sparas lokalt på din enhet (`localStorage`). Det gör
Habee till en helt statisk sida som vem som helst kan hosta gratis. Din data är
din — exportera den till en fil när du vill, eller importera den på en annan
enhet.

> Byggd i samma anda som [Dugsi](https://github.com/mahadhussen/Dugsi): fri,
> klient-sida, ärlig och testad.

---

## De bästa funktionerna från de bästa apparna — samlade

Habee plockar russinen ur kakan från de mest älskade att-göra-apparna och
väver ihop dem till en upplevelse som känns personlig:

| Funktion | Inspiration |
| --- | --- |
| **Snabbtillägg med naturligt språk** — `Ring mamma imorgon kl 18 #Familj @viktigt !1` tolkas till datum, tid, projekt, etikett och prioritet medan du skriver | Todoist |
| **Smarta vyer** — Idag, Kommande, Inkorg, Alla, Klart | Things 3 |
| **Projekt, etiketter & filter** | Todoist |
| **Prioriteter P1–P4** med färgkodning | Todoist |
| **Deluppgifter & anteckningar** per uppgift | Things 3 |
| **Återkommande uppgifter** — varje dag, vardagar, vecka, månad (rullar framåt när du bockar av) | Todoist / Things |
| **Vanor & streaks** med 7-dagars rutnät | TickTick / Habitica |
| **Pomodoro-fokustimer** (25/5) | TickTick |
| **Daglig planering & framstegsmätare** | Microsoft To Do |
| **Statistik / "karma"** — klart idag, försenat, per projekt och prioritet | Todoist |
| **Personlig hälsning** som följer klockan, **eget färgtema** & **mörkt läge** | det som gör den till *din* |
| **Lokalt först & privat** — din data lämnar aldrig enheten, export/import ingår | — |

### Snabbtillägg: vad Habee förstår

Skriv på svenska eller engelska:

- **Datum:** `idag`, `imorgon`, `övermorgon`, `måndag`…`söndag`, `om 3 dagar`,
  `nästa vecka`
- **Tid:** `kl 14`, `kl 9:30`, `18:00`
- **Prioritet:** `!1`–`!4` (eller `p1`–`p4`)
- **Projekt:** `#Projektnamn` &nbsp;•&nbsp; **Etikett:** `@etikett`
- **Upprepning:** `varje dag`, `vardagar`, `varje vecka`, `varje måndag`,
  `varje månad`

Resten blir uppgiftens titel.

---

## Arkitektur

Ren separation mellan logik (testad, ren) och gränssnitt (React-klientkod).

```
app/
  page.tsx                Laddar appen (klient-sida, ingen server)
  layout.tsx              Sidhuvud + typsnitt
  globals.css             Tema-variabler (ljus/mörk) + accentfärg
components/
  TodoApp.tsx             Orkestrerar state, persistens & navigation
  Onboarding.tsx          Första start: namn, färg, utseende
  Sidebar.tsx             Vyer, projekt, etiketter, sektioner
  QuickAdd.tsx            Naturligt-språk-inmatning med live-förhandsvisning
  TaskItem.tsx            Uppgift: prioritet, deluppgifter, datum, upprepning
  Habits.tsx              Vanor & streaks
  Stats.tsx               Produktivitetspanel
  FocusTimer.tsx          Pomodoro-timer
  SettingsPanel.tsx       Namn, tema, export/import, rensa
lib/
  types.ts                Domäntyper (ren data → enkel att spara/exportera)
  nlp.ts                  Tolkar snabbtillägg (svenska + engelska)
  date.ts                 Datumhjälp (lokala "YYYY-MM-DD", tidszonssäkert)
  recurrence.ts           Nästa förekomst för återkommande uppgifter
  filters.ts              Vyer, sortering, räknare, framsteg
  personalize.ts          Hälsning, teman, dagens rad, streaks
  store.ts                localStorage: spara/läs, standardvärden, startdata
test/
  *.test.ts               Enhetstester för all ren logik
```

All logik som spelar roll — språktolkning, datummatte, upprepningar, vyer,
streaks — ligger i `lib/` som rena funktioner och täcks av tester.

---

## Kör lokalt

```bash
npm install
npm run dev      # http://localhost:3000
```

### Tester

```bash
npm test
```

Täcker språktolkning, datumhantering, återkommande uppgifter, vyfiltrering och
personalisering (hälsningar, teman, streaks).

### Bygg statiskt

```bash
npm run build    # genererar out/ — en helt statisk sida
```

Deploys till GitHub Pages sker automatiskt från `main` via
`.github/workflows/deploy.yml` (sätter `GITHUB_PAGES=true` för rätt `basePath`).

---

## Integritet

Habee skickar ingenting någonstans. Det finns ingen backend och inga
analysverktyg. Vill du flytta din data tar du en export; vill du börja om
rensar du allt med ett klick.
