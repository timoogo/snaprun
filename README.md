# SnapRun

Outil de scan et de snapshot automatisé d'applications Next.js.

> Statut : RFC-001 (initialisation du socle technique). Aucune logique métier n'est encore implémentée.

## Prérequis

- Node.js 20+
- pnpm

## Installation

```bash
pnpm install
```

## Scripts

| Script           | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm build`     | Compile le projet TypeScript         |
| `pnpm typecheck` | Vérifie les types sans émettre de JS |
| `pnpm lint`      | Analyse statique du code (ESLint)    |
| `pnpm test`      | Exécute les tests (Vitest)           |
| `pnpm format`    | Formate le code (Prettier)           |

## Utilisation du CLI

Après build :

```bash
pnpm build
pnpm exec snaprun --help
pnpm exec snaprun --version
```

## Génération de version

`src/generated/version.ts` (ignoré par Git) est régénéré automatiquement à partir de
`package.json` avant chaque `build`, `typecheck`, `lint` et `test` (scripts `pre*` et hook
`prepare`). Le CLI n'effectue ainsi aucune lecture de `package.json` au runtime.

## Documentation

La spécification du projet est consignée dans [`RFCs/`](./RFCs), à commencer par [`RFCs/README.md`](./RFCs/README.md).
