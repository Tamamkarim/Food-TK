# Opiskelijaravintolat - Suomen opiskelijaravintoloiden ruokalista-sovellus

Modernilla TypeScriptillä toteutettu web-sovellus, joka näyttää Suomen opiskelijaravintoloiden päivittäiset ja viikoittaiset ruokalistat.

## ✨ Ominaisuudet

### Perusominaisuudet (Arvosana 1)

- ✅ **Ravintolalista**: Ravintolat näytetään selkeästi ja loogisesti
- ✅ **Ruokalistat**: Käyttäjä voi valita päivän tai viikon ruokalistan
- ✅ **Ruokalistojen näyttö**: Valitut ruokalistat näytetään käyttäjälle

### Laajennetut ominaisuudet (Korkeammat arvosanat)

- ✅ **Käyttäjän rekisteröityminen ja kirjautuminen**
- ✅ **Suosikkiravintolan valinta**
- ✅ **Käyttäjätietojen päivittäminen**
- ✅ **Profiilikuvan lisääminen**
- ✅ **Ravintolafiltteröinti** (kaupunki, palveluntarjoaja)
- ✅ **Kartalla näkymä** ravintoloista
- ✅ **Lähin ravintola** korostettuna
- ✅ **Hakutoiminto** ravintolan nimellä
- ✅ **Sijainnin käyttö** etäisyyksien laskemiseen

## 🛠️ Tekninen toteutus

### Teknologiat

- **Frontend**: Vanilla TypeScript (ES6+)
- **CSS**: Mukautetut tyylit (ei frameworkkeja)
- **Kartat**: Leaflet.js
- **Build**: TypeScript Compiler
- **API**: Restaurant API (https://media1.edu.metropolia.fi/restaurant)

### Arkkitehtuuri

```
src/
├── types.ts          # TypeScript-tyyppimäärittelyt
├── api-service.ts    # API-yhteyksiä hoitava palvelu
├── user-service.ts   # Käyttäjähallinta
├── map-service.ts    # Kartta-toiminnallisuus
├── menu-service.ts   # Ruokalistojen hallinta
└── main.ts          # Pääsovellus ja UI-logiikka
```

### Tietorakenteet

- **Restaurant**: Ravintolan perustiedot ja sijainti
- **DailyMenu/WeeklyMenu**: Ruokalistadatat
- **User**: Käyttäjätiedot ja suosikit
- **RestaurantFilter**: Suodatusasetukset

## 🚀 Asennus ja käyttö

### Vaatimukset

- Node.js (v14 tai uudempi)
- Moderni web-selain
- Internet-yhteys API-kutsuille

### Asennus

1. Kloonaa repositorio:

```bash
git clone <repository-url>
cd Food-TK
```

2. Asenna riippuvuudet:

```bash
npm install
```

3. Käännä TypeScript:

```bash
npm run build
```

4. Käynnistä kehityspalvelin:

```bash
npm start
```

Jos portti 8000 on käytössä, kokeile:

```bash
npm run start:alt
```

5. Avaa selaimessa: http://localhost:8000

### Käytettävissä olevat npm-komennot

```bash
npm start        # Käännä ja käynnistä palvelin (portti 8000)
npm run start:alt # Käännä ja käynnistä palvelin (portti 3000)
npm run build    # Käännä vain TypeScript
npm run dev      # TypeScript watch mode (automaattinen kääntäminen)
npm run serve    # Käynnistä vain palvelin (ilman kääntämistä)
```

### Käyttö

1. **Rekisteröidy** tai **kirjaudu sisään**
2. **Selaa ravintoloita** listalta tai kartalta
3. **Suodata** ravintolat kaupungin tai palveluntarjoajan mukaan
4. **Valitse ravintola** nähdäksesi ruokalistan
5. **Vaihda näkymä** päivän ja viikon ruokalistojen välillä
6. **Valitse suosikkiravintola** profiilissasi

## 📱 Toiminnallisuudet

### Käyttäjähallinta

- Rekisteröityminen sähköpostilla ja salasanalla
- Kirjautuminen
- Profiilin muokkaus
- Profiilikuvan lataus
- Suosikkiravintolan valinta

### Ravintolahaku ja -filtteröinti

- Hakutoiminto nimellä
- Suodatus kaupungin mukaan
- Suodatus palveluntarjoajan mukaan
- Etäisyysjärjestys (sijainti käytössä)

### Karttanäkymä

- Interaktiivinen kartta Leaflet.js:llä
- Ravintolat merkittynä kartalle
- Popup-ikkunat ravintolatiedoilla
- Lähin ravintola korostettuna

### Ruokalistat

- Päivittäiset ruokalistat
- Viikoittaiset ruokalistat
- Ruoka-allergia- ja ruokavaliotiedot
- Hintatiedot

## 🎨 UI/UX

- **Responsiivinen design** (mobiili + desktop)
- **Moderni flat design**
- **Värimaailma**: Vihreä teema (ekologisuus)
- **Käyttäjäystävällinen navigaatio**
- **Loading-animaatiot**
- **Ilmoitusjärjestelmä**

## 🔧 Kehittäjän huomiot

### TypeScript-ominaisuudet

- Strict TypeScript -asetukset
- Interface-määrittelyt kaikille datamalleille
- Union types ja enum-tyypit
- Optional properties ja type guards
- Module system (ES6 imports/exports)

### Koodin laatu

- **Looginen nimeäminen**: Selkeät funktio- ja muuttujanimet
- **Modulaarinen rakenne**: Eri vastuualueet erillisiin tiedostoihin
- **Error handling**: Try-catch-lohkot ja fallback-datat
- **Kommentointi**: JSDoc-tyylinen dokumentaatio
- **Konsistentit sisennykset**: 2 space indentation

### Offline-tuki

- Mock-data API:n ollessa alhaalla
- LocalStorage käyttäjädatan tallentamiseen
- Graceful degradation ilman sijaintidataa

## 🐛 Tiedossa olevat rajoitukset

1. **API-riippuvuus**: Sovellus käyttää mock-dataa jos API ei ole käytettävissä
2. **Autentikointi**: Yksinkertainen client-side toteutus (ei turvallinen tuotantokäyttöön)
3. **Kuvien tallennus**: Profiilikuvat tallennetaan Base64-muodossa localStorageen

## 🎨 Uudet UI/UX -parannukset

### 🌙 Tumma/Vaalea teema

- **Automaattinen teeman tunnistus**: Seuraa käyttöjärjestelmän asetuksia
- **Manuaalinen vaihtaminen**: Teemapainike oikeassa yläkulmassa
- **Tallentuu LocalStorageen**: Käyttäjän valinta muistetaan

### 📱 Responsiivinen suunnittelu

- **Mobile-first lähestymistapa**: Optimoitu mobiililaitteille
- **Adaptiivinen typografia**: Skaalautuvat fontit ja välit
- **Grid/Flexbox järjestelmä**: Modernit layout-tekniikat
- **Breakpointit**: 480px, 768px, 1024px, 1200px, 1600px

### ♿ Saavutettavuus (Accessibility)

- **Semanttinen HTML5**: Oikeat elementit ja roolit
- **ARIA-merkinnät**: Ruudunlukijoiden tuki
- **Näppäimistönavigaatio**: Täydellinen näppäimistökäyttö
- **Kontrastisuhde**: WCAG 2.1 AA -vaatimusten mukainen
- **Focus-indikaattorit**: Selkeät kohdistusmerkit

### 🎯 Visuaalinen hierarkia

- **CSS Custom Properties**: Teemoitukseen ja yhtenäisyyteen
- **Animaatiot ja siirtymät**: Sujuvat hover-efektit
- **Typografinen skaala**: Harmoninen fonttikokojärjestelmä
- **Väripaletti**: Laadukas ja yhtenäinen värimaailma

### 🔧 Tekninen laatu

- **Puhdas koodi**: Modulaarinen TypeScript-arkkitehtuuri
- **Tyyppiturvallisus**: Strict TypeScript -asetukset
- **Error handling**: Kattava virheenkäsittely
- **Performance**: Optimoidut renderöinti ja latausajat

## 📄 Lisenssi

Tämä projekti on tehty oppilaitostyönä Metropolia Ammattikorkeakouluun.

## 👥 Kehittäjä

**Tamam Karim** - _Alkuperäinen kehittäjä ja UI/UX-parannukset_

---

_Sovellus täyttää kurssin vaatimukset vanilla TypeScript -toteutuksesta ilman front-end frameworkkeja tai CSS-frameworkkeja, ja sisältää modernit UI/UX -parannukset._
