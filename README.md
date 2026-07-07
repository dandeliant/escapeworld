# ◉ EscapeWorld

**Językowa gra terenowa, w której każdy spacer jest misją.**
*Ucz się języków, ruszaj się i odkrywaj świat, zanim zrobią to obcy.*

Terenowa gra językowo-przygodowa: mapa + GPS + nauka języków (EN/FR/DE/RU) + fabuła sci-fi/detektywistyczna + mechanika escape roomu. Frontend bez backendu — cały postęp i kampanie zapisują się lokalnie (localStorage), gotowe do późniejszego podłączenia serwera.

## Uruchomienie

Wymagany Node.js (dowolna aktualna wersja) — bez instalowania zależności:

```
node server.js
```

Następnie otwórz **http://localhost:8123** w przeglądarce (najlepiej Chrome/Edge — pełne wsparcie TTS i rozpoznawania mowy).

> Mapa (OpenStreetMap) i czcionki ładują się z internetu — potrzebne jest połączenie sieciowe.

## Co jest w środku

### Tryb gracza
- **Mapa** (Leaflet + OpenStreetMap, ciemny motyw) z pozycją gracza i punktami: misje 📡, pamiętniki 📔, artefakty 💠, apteczki ⛑️, nadajniki 📶, portale 🌀, bezpieczne strefy 🛡️, fałszywe tropy ❓, NPC 🕵️, bazy obcych 👁️
- **Symulacja GPS** (d‑pad, suwak prędkości, klik na mapie = marsz) + przełącznik na **prawdziwy GPS**
- **Limit prędkości 30 km/h** — za szybko = punkt się nie aktywuje
- **Misje z 3 pytaniami** (wybór / wpisanie / prawda‑fałsz) w wybranym języku nauki
- **Porażka = magiczny trop znika**, pojawia się w innym miejscu — wróć do bezpiecznej strefy po nowe wytyczne
- **Zadania ruchowe** (np. przejdź 700 m po apteczkę)
- **Klikalne zdania**: ▶ wymowa (TTS z wyborem głosu i tempa 50–125%), 🌍 tłumaczenie (−100 🪙), 📖 dodaj do nauki, ⭐ ulubione, 🔎 analiza gramatyczna (−150 🪙)
- **Notatnik + powtórki** (1/7/30 dni, nagrody 200/250/400 🪙), pisemnie lub **głosem** (Web Speech Recognition, ocena podobieństwa)
- **Coins = Lingua Energy**: nagrody za dystans (100 m/500 m/1 km/5 km), odpowiedzi, misje, słowa, serie, rozdziały
- **Sklep** (sprzęt, pomoc językowa, kosmetyka), **ekwipunek**, **artefakty z rzadkością**, **osiągnięcia**, **odkrywana historia**

### Tryb administratora
- **Edytor mapy**: klik = nowy punkt, przeciąganie markerów, lista punktów
- **Kreator misji**: typ, rozdział, promień aktywacji, limit prędkości, zadanie ruchowe, wymagane przedmioty, kary, nagrody, punkty odsłaniane, treści w **EN/FR/DE/RU + PL** (zakładki językowe), edytor pytań
- **Podgląd gracza** — admin widzi dokładnie to co gracz i może przetestować własny punkt jednym kliknięciem
- **Kampania**: nazwa, środek mapy, rozdziały
- **Dane**: eksport/import kampanii JSON, reset kampanii/postępu
- **Tryb testowy**: +coins, +energia, leczenie, odblokowanie wszystkiego, log zdarzeń

## Struktura projektu

```
index.html          – szkielet aplikacji (ekran startowy, gracz, admin, modale)
css/styles.css      – motyw sci-fi (ciemny, neonowe akcenty, responsywny)
js/
  i18n.js           – języki nauki, typy punktów, rzadkości, helper EW.t()
  data.js           – domyślna kampania (rozdział 1, 13 punktów, 4 wersje językowe), sklep, osiągnięcia
  state.js          – stan gry + zapis localStorage + osiągnięcia + toasty
  speech.js         – TTS, rozpoznawanie mowy, ocena podobieństwa wypowiedzi
  map.js            – Leaflet, markery, symulacja/prawdziwy GPS, pomiar prędkości
  game.js           – aktywacja punktów, misje, pytania, nagrody/kary, sklep, powtórki
  ui-player.js      – HUD i widoki gracza
  ui-admin.js       – panel administratora
  app.js            – start i nawigacja trybów
server.js           – lokalny serwer statyczny (bez zależności)
```

## Rozbudowa

- **Nowe treści**: dodawaj punkty i rozdziały w panelu admina — wszystko zapisuje się w localStorage i eksportuje do JSON (`escapeworld-kampania.json`).
- **Google Maps / Mapbox**: warstwa mapy jest odizolowana w `js/map.js` (stałe `TILES`/`ATTR` + funkcje init) — podmiana wymaga zmiany tylko tego modułu.
- **Backend**: stan gracza i kampania to dwa obiekty JSON (`EW.state.player`, `EW.state.campaign`) serializowane w `state.js` — gotowe do wysyłki na API.
