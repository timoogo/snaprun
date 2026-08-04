# SnapRun

Outil de scan et de capture d'écran automatisé d'applications Next.js. Détecte les routes
d'un projet App Router / Pages Router, puis les capture (PNG) avec un navigateur Chromium
réel (Playwright), avec authentification par formulaire, runs ordonnés, et démarrage
automatique de l'application si besoin.

## Prérequis

- Node.js 20+
- pnpm
- Un navigateur Chromium Playwright installé (`pnpm exec playwright install chromium`)

## Installation

```bash
pnpm install
pnpm exec playwright install chromium
pnpm build
```

Le binaire `snaprun` est exposé par `package.json` (`bin.snaprun`) ; après `pnpm build`,
utilisez-le via `pnpm exec snaprun` (ou installez-le globalement/liez-le dans un projet
consommateur).

## Démarrage rapide

```bash
cd mon-projet-nextjs
pnpm exec snaprun scan              # détecte les routes, écrit snaprun.config.json
# éditez snaprun.config.json : activez des routes, renseignez baseUrl, etc.
pnpm exec snaprun                   # capture tout ce qui est activé
```

Un exemple de configuration complet (users, route publique, route dynamique, deux runs
ordonnés) est fourni dans [`examples/snapshot.config.json`](./examples/snapshot.config.json).

## Fichier de configuration

Recherché dans le répertoire courant, dans cet ordre : `snaprun.config.json`,
`snapshot.config.json`, `settings.json` (ou un chemin explicite via `--config`).

```jsonc
{
  "project": {
    "root": ".", // relatif au fichier de configuration
    "workingDirectory": ".", // relatif à project.root ; résout .env/.env.local
    "baseUrl": "http://localhost:3000", // requis pour capturer (pas pour scan)
    "startCommand": "pnpm dev", // requis si autoStart: true
    "autoStart": false, // lance startCommand si baseUrl ne répond pas
  },
  "output": {
    "directory": "./snapshots", // résolu par rapport à project.root
    "fullPage": true,
  },
  "auth": {/* optionnel, voir "Authentification" */},
  "routes": [/* voir "Routes" */],
  "runs": [/* voir "Runs" */],
}
```

Seule la section `project` est obligatoire (toutes ses valeurs ont un défaut sûr, sauf
`baseUrl`/`startCommand`, requis selon la commande exécutée).

### Secrets (`${VARIABLE}`)

Toute valeur de configuration peut référencer une variable d'environnement :
`"password": "${MEMBER_PASSWORD}"`. Résolution, dans l'ordre de priorité :

1. `process.env`
2. `.env.local` (dans `project.workingDirectory`)
3. `.env`

Une valeur sans `${...}` est utilisée littéralement, sans jamais lire l'environnement ni le
disque. Une variable référencée mais introuvable lève `ENV_VARIABLE_MISSING`. Les secrets ne
sont **jamais** écrits dans les messages d'erreur ni les logs.

## `snaprun scan`

Détecte les routes du projet (App Router et/ou Pages Router, coexistence supportée) et met à
jour `routes` dans le fichier de configuration — ajout uniquement, jamais de suppression
automatique (les routes disparues sont signalées comme « potentiellement obsolètes »).
Préserve toujours, pour une route déjà connue : `id`, `enableSnapshot`, `user`, `parameters`,
`snapshotPath`.

```bash
snaprun scan                    # nouvelles routes : enableSnapshot: false (défaut)
snaprun scan --default=enabled  # nouvelles routes : enableSnapshot: true
```

`--default=enabled` ne s'applique jamais aux routes dynamiques nouvellement découvertes :
leurs paramètres valent `"REPLACE_ME"` tant qu'ils ne sont pas renseignés manuellement, donc
elles restent toujours désactivées à la découverte, quelle que soit l'option. Les segments
catch-all (`[...slug]`) sont détectés mais jamais ajoutés automatiquement (non configurables
sans intervention).

## Routes

```jsonc
{ "id": "member-calendar", "path": "/member/calendar", "enableSnapshot": true, "user": "member" }
```

Route dynamique :

```jsonc
{
  "id": "member-stay",
  "path": "/member/stays/[stayId]",
  "isDynamic": true,
  "parameters": { "stayId": "seed-stay-123" },
  "enableSnapshot": true,
  "user": "member",
}
```

- `snapshotPath` (optionnel) : remplace uniquement l'URL finale visitée (utile pour un id
  produit par un seed différent de la valeur affichée) ; la cohérence `path`/`parameters`
  reste toujours validée, même quand `snapshotPath` est fourni.
- `enableSnapshot: false` : la route n'est jamais capturée, ni seule ni via un run.
- `user` (optionnel) : utilisateur (clé de `auth.users`) requis pour capturer cette route.
- `id` doit être unique dans `routes`.

## Runs

```jsonc
{ "runName": "member", "user": "member", "order": 1, "routes": ["member-calendar", "member-stay"] }
```

- `order` détermine l'ordre d'exécution des runs entre eux ; à égalité, l'ordre du fichier.
- L'ordre du tableau `routes` est l'ordre exact des captures au sein du run, numéroté
  `01-`, `02-`, ... dans le nom de fichier.
- Conflit entre le `user` du run et le `user` d'une route qu'il référence (tous deux
  définis et différents) : erreur `USER_CONFLICT`.
- Chaque run s'exécute dans un `BrowserContext` Playwright isolé (sessions jamais
  partagées entre runs).
- Une route activée (`enableSnapshot: true`) mais référencée par aucun run est capturée
  isolément (« standalone »).

### Sortie des captures

```text
<output.directory>/<runName>/<NN>-<routeId>.png   # route d'un run, numérotée
<output.directory>/standalone/<routeId>.png       # route hors run, sans préfixe
```

`output.directory` est résolu par rapport à `project.root` (donc, par rapport au
répertoire du fichier de configuration seulement quand `project.root` vaut `"."`, sa
valeur par défaut). `output.fullPage` contrôle la capture pleine page ou seulement la
zone visible.

## Authentification

```jsonc
{
  "loginRoute": "/login",
  "selectors": {
    "email": "input[name='email']",
    "password": "input[name='password']",
    "submit": "button[type='submit']",
  },
  "successUrl": "**/dashboard", // et/ou successSelector ; au moins un requis
  "users": { "member": { "email": "member@example.com", "password": "${MEMBER_PASSWORD}" } },
}
```

Formulaire de connexion générique (indépendant de tout fournisseur — Better Auth, NextAuth,
maison...). Un utilisateur n'est authentifié qu'une fois par `BrowserContext` (session
réutilisée pour toutes les routes d'un même run) ; un contexte différent (run différent, ou
route hors run) déclenche une nouvelle authentification indépendante. Un échec
d'authentification ne marque jamais le contexte comme authentifié (nouvelle tentative
possible). Les identifiants ne sont jamais journalisés.

## Démarrage automatique (`autoStart`)

Avant de capturer, `baseUrl` est testé : s'il répond (quel que soit le code de statut), ce
serveur est réutilisé tel quel — **jamais arrêté**, qu'il ait été démarré par SnapRun ou par
autre chose. S'il ne répond pas et que `autoStart: true`, `startCommand` est lancé depuis
`project.workingDirectory`, SnapRun attend sa disponibilité, capture, puis arrête
**uniquement** le processus qu'il a lui-même créé (jamais un serveur externe). stdout/stderr
sont capturés (diagnostic en cas d'échec), les signaux (SIGINT/SIGTERM) et l'arrêt du groupe
de processus complet sont gérés pour ne jamais laisser de processus orphelin.

## Commande de capture (`snaprun`)

```bash
snaprun                                          # tous les runs, plus les routes standalone
snaprun --config ./snapshot.config.json          # chemin de configuration explicite
snaprun --runName member                         # un seul run
snaprun --runName member --partial               # voir note ci-dessous
snaprun --route /member/calendar --user member    # une route isolée, hors run
snaprun --runName member --route /member/calendar # une route précise, au sein d'un run
snaprun --debug                                  # pile d'appels + cause en cas d'erreur
```

- Sans option : tous les runs (dans l'ordre de `order`), puis les routes standalone.
- `--runName <name>` : uniquement ce run (ses routes explicitement référencées et
  activées).
- `--partial` : nécessite `--runName`. En V1, sans modèle de dépendances entre routes,
  un run ne capture déjà que ses routes explicitement référencées et activées — `--partial`
  est donc accepté mais **strictement identique** au mode normal.
- `--route <path>` : capture une seule route (identifiée par son **chemin**, pas son id).
  Hors run par défaut ; force `enableSnapshot: true` pour cette capture (la sélection CLI
  explicite prime sur le drapeau de configuration).
- `--user <name>` : utilisateur pour `--route` utilisée hors run ; l'emporte sur le `user`
  éventuellement configuré sur la route. Incompatible avec `--runName` (le user d'un run
  vient de la configuration).
- `--runName <name> --route <path>` : une seule route au sein d'un run donné (doit être
  référencée par ce run, sinon `ROUTE_NOT_FOUND`).
- `--debug` : option globale (disponible aussi sur `scan`) — affiche la pile d'appels et la
  cause d'origine en plus du message d'erreur. Ne change jamais le code de sortie.

Combinaisons interdites, rejetées explicitement (`CLI_OPTION_CONFLICT`) avant tout accès
disque ou navigateur : `--partial` sans `--runName`, `--user` sans `--route`, `--user`
combiné à `--runName`.

### Codes de sortie

`0` : succès complet. Non nul (`1`) : configuration invalide, option en conflit, ou rapport
contenant au moins une capture en échec (fail-fast : les captures déjà réussies avant
l'échec restent présentes dans le rapport affiché).

## Erreurs

| Code                        | Signification                                                              |
| --------------------------- | -------------------------------------------------------------------------- |
| `CONFIG_NOT_FOUND`          | Aucun fichier de configuration trouvé                                      |
| `CONFIG_INVALID`            | JSON invalide, ou structure ne respectant pas le schéma                    |
| `ENV_VARIABLE_MISSING`      | `${VARIABLE}` référencée introuvable                                       |
| `ROUTE_NOT_FOUND`           | Route inconnue (par id ou par chemin selon le contexte)                    |
| `DYNAMIC_PARAMETER_MISSING` | Segment `[param]` sans valeur dans `parameters`                            |
| `DYNAMIC_PARAMETER_UNKNOWN` | Clé de `parameters` non référencée dans `path`                             |
| `RUN_NOT_FOUND`             | `--runName` (ou une référence de run) ne correspond à aucun run            |
| `USER_CONFLICT`             | `user` du run et `user` de la route tous deux définis et différents        |
| `USER_NOT_FOUND`            | Utilisateur absent de `auth.users`                                         |
| `AUTHENTICATION_FAILED`     | La stratégie de succès du formulaire n'est jamais atteinte                 |
| `SNAPSHOT_FAILED`           | Échec de capture d'une route (navigation, authentification, écriture PNG)  |
| `BASE_URL_MISSING`          | `project.baseUrl` requis pour capturer, absent de la configuration         |
| `APPLICATION_START_FAILED`  | `startCommand` absent, ou le processus lancé quitte avant d'être joignable |
| `APPLICATION_UNREACHABLE`   | `baseUrl` injoignable (autoStart désactivé, ou délai de démarrage dépassé) |
| `CLI_OPTION_CONFLICT`       | Combinaison d'options CLI incompatibles                                    |

## Limites connues (V1)

Non implémentés, volontairement hors périmètre : viewports multiples, thèmes clair/sombre,
navigateurs autres que Chromium, génération assistée par IA, export PDF/vidéo, comparaison
visuelle entre captures, tableau de bord, exécution cloud, exploration (« crawl »)
intelligente des routes, système de plugins. `--partial` n'a aucun effet différencié du mode
normal en V1 (pas de modèle de dépendances entre routes). Comportement de l'arrêt de
processus (`autoStart`) validé sur POSIX ; non testé sous Windows.

## Scripts

| Script           | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm build`     | Compile le projet TypeScript         |
| `pnpm typecheck` | Vérifie les types sans émettre de JS |
| `pnpm lint`      | Analyse statique du code (ESLint)    |
| `pnpm test`      | Exécute les tests (Vitest)           |
| `pnpm format`    | Formate le code (Prettier)           |

## Génération de version

`src/generated/version.ts` (ignoré par Git) est régénéré automatiquement à partir de
`package.json` avant chaque `build`, `typecheck`, `lint` et `test` (scripts `pre*` et hook
`prepare`). Le CLI n'effectue ainsi aucune lecture de `package.json` au runtime.

## Documentation

La spécification complète du projet est consignée dans [`RFCs/`](./RFCs), à commencer par
[`RFCs/README.md`](./RFCs/README.md). Les décisions d'architecture validées sont consignées
dans [`RFCs/DECISIONS.md`](./RFCs/DECISIONS.md).
