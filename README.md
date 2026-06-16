# Moji Recepti – Mobile App

Mobilna aplikacija za projekt **Moji Recepti**, zgrajena z **Expo + React Native + TypeScript**.

Aplikacija deluje kot mobilni klient za ločen **Node.js REST API backend** in uporablja **JWT avtentikacijo** z access in refresh tokenom.

Projekt je namenjen preprostemu, preglednemu upravljanju:

* receptov,
* sestavin receptov,
* inventarja,
* nakupovalnih listkov,
* postavk na nakupovalnih listkih.

Mobilna aplikacija je zasnovana kot funkcionalen MVP, ki sledi strukturi obstoječega web clienta in omogoča uporabo na Android telefonu prek Expo Go ali prek APK builda.

---
## Prenos aplikacije

Zadnjo Android APK verzijo je mogoče prenesti pod zavihkom **Releases**:

```txt
https://github.com/puhi0210/moji-recepti_app/releases
```
---

## Povezani repozitoriji

Backend API:

```txt
https://github.com/puhi0210/moji-recepti_backend
```

Web client:

```txt
https://github.com/puhi0210/moji-recepti_web
```

Mobile app:

```txt
https://github.com/puhi0210/moji-recepti_app
```

---

## Tehnološki stack

* Expo
* React Native
* TypeScript
* React Navigation

  * bottom tabs
  * native stack navigation
* Axios

  * API client
  * JWT Authorization header
  * refresh token interceptor
* Zustand

  * auth/global state
* TanStack Query

  * server state
  * caching
  * loading/error state
  * query invalidation po CRUD operacijah
* Expo SecureStore

  * varno shranjevanje access in refresh tokena
  * shranjevanje izbranega API server URL-ja
* EAS Build

  * priprava APK builda za enostavno Android namestitev

---

## Funkcionalnosti

### Avtentikacija

* prijava uporabnika
* JWT access token
* JWT refresh token
* varno shranjevanje tokenov v Expo SecureStore
* avtomatsko dodajanje `Authorization: Bearer <token>` headerja
* avtomatski refresh access tokena ob `401`
* logout
* prikaz prijavljenega uporabnika v headerju
* možnost spremembe API server URL-ja na login screen-u

### Recepti

* seznam receptov
* iskanje receptov
* paginacija
* podrobnosti recepta
* prikaz opisa, navodil, časa priprave, časa kuhanja, porcij in vidnosti
* prikaz sestavin recepta
* dodajanje recepta
* urejanje recepta
* brisanje recepta
* dodajanje sestavine recepta
* urejanje sestavine recepta
* brisanje sestavine recepta

### Inventar

* seznam zalog/sestavin
* iskanje po inventarju
* paginacija
* podrobnosti zaloge
* dodajanje zaloge
* urejanje zaloge
* brisanje zaloge
* prikaz lokacije, količine, enote, minimalne količine in roka uporabe
* low-stock badge, kadar je `quantity <= minQuantity`
* filter za prikaz samo nizkih zalog

### Nakupovalni listki

* seznam nakupovalnih listkov
* iskanje listkov
* paginacija
* podrobnosti listka
* status listka:

  * `active`
  * `done`
  * `archived`
* dodajanje listka
* urejanje listka
* brisanje listka
* dodajanje postavke
* urejanje postavke
* brisanje postavke
* označevanje postavk kot kupljene / nekupljene
* prikaz števila kupljenih postavk
* brisanje oziroma čiščenje kupljenih postavk

---

## Okoljske spremenljivke

V root projekta dodaj datoteko `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Za uporabo na telefonu prek Expo Go ali APK builda praviloma ne uporabljaj `localhost`, ampak IP naslov računalnika oziroma strežnika v lokalnem omrežju:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:3000
```

Aplikacija omogoča tudi ročno spremembo server URL-ja na login screen-u. Izbrani URL se shrani v SecureStore in se uporablja pri naslednjih API klicih.

---

## Zagon v development okolju

### 1. Namestitev odvisnosti

```bash
npm install
```

### 2. Priprava `.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:3000
```

### 3. Zagon Expo development strežnika

```bash
npx expo start -c
```

Aplikacijo lahko odpreš z aplikacijo **Expo Go** na Android telefonu.

---

## Android APK build za enostavno namestitev

Za pripravo APK builda se uporablja EAS Build.

### 1. Namestitev EAS CLI

```bash
npm install -g eas-cli
```

### 2. Prijava v Expo račun

```bash
eas login
```

### 3. Konfiguracija EAS builda

```bash
eas build:configure
```

### 4. Primer `eas.json`

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 5. Build APK

```bash
eas build -p android --profile preview
```

Po uspešnem buildu EAS izpiše povezavo, kjer je možno prenesti APK oziroma aplikacijo namestiti na Android napravo.

---

## Avtentikacija – tehnične podrobnosti

Tokeni se shranjujejo v Expo SecureStore:

```txt
moji_recepti_access_token
moji_recepti_refresh_token
```

API server URL se shrani pod ključem:

```txt
moji_recepti_server_url
```

Axios interceptor:

* pred vsakim requestom prebere trenutni server URL,
* doda `Authorization` header, če obstaja access token,
* ob `401` kliče `/auth/refresh`,
* shrani nove tokene,
* ponovi prvotni request,
* ob neuspešnem refreshu izbriše tokene in uporabnika odjavi.


---

## Struktura projekta

```txt
src/
  api/
    client.ts
    auth.api.ts
    recipes.api.ts
    inventory.api.ts
    shoppingLists.api.ts

  auth/
    auth.store.ts
    tokenStorage.ts

  navigation/
    AppNavigator.tsx
    RecipesStack.tsx
    InventoryStack.tsx
    ShoppingListsStack.tsx

  screens/
    auth/
      LoginScreen.tsx

    recipes/
      RecipesListScreen.tsx
      RecipeDetailScreen.tsx
      RecipeFormScreen.tsx
      RecipeIngredientFormScreen.tsx

    inventory/
      InventoryListScreen.tsx
      InventoryDetailScreen.tsx
      InventoryFormScreen.tsx

    shoppingLists/
      ShoppingListsScreen.tsx
      ShoppingListDetailScreen.tsx
      ShoppingListFormScreen.tsx
      ShoppingListItemFormScreen.tsx

  components/
    FormActions.tsx
    FormTextInput.tsx

  hooks/
    useDebounce.ts

  types/
    auth.types.ts
    recipe.types.ts
    inventory.types.ts
    shoppingList.types.ts

  utils/
    env.ts
    serverUrlStorage.ts
```

---

## Git workflow

Primer dela na novi veji:

```bash
git checkout -b feature/some-feature
git add .
git commit -m "Add some feature"
git push -u origin feature/some-feature
```

Merge v `main` je priporočljivo narediti prek Pull Requesta na GitHubu.

---

## Namen projekta

Aplikacija je študijski oziroma osebni projekt za mobilni dostop do sistema **Moji Recepti**. Fokus je na čistem API flowu, uporabnem MVP-ju in enostavni nadgradljivosti.
