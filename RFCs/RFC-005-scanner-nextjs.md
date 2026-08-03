# RFC-005 — Scanner Next.js basé sur next-list

## Objectif
Détecter les pages d’un projet Next.js. SnapRun est spécifique à Next.js.

Utiliser `next-list` comme moteur principal, encapsulé dans un adaptateur. Aucun type brut `next-list` hors de cet adaptateur.

Flux : `next-list → normalisation → DiscoveredRoute[]`.

Fallback isolé sur `app/`, `src/app/`, `pages/`, `src/pages`.

Détecter App Router, Pages Router si possible, `[id]`, `[...slug]`, `[[...slug]]`; ignorer route groups dans l’URL ; exclure API, route handlers et fichiers non capturables ; dédupliquer et trier de façon déterministe.

Conserver une interface interne légère de scanner, sans architecture multi-framework.

## Critères d’acceptation
Fixtures App Router, Pages Router si supporté, groupes, dynamiques, API exclues, fallback, sortie stable.

## Règles communes

- Un seul commit pour cette RFC.
- Ne pas implémenter les RFC suivantes par anticipation.
- TypeScript strict.
- Aucun `any`.
- Éviter `as unknown as`.
- Tous les types métier doivent rester dans `src/types/`.
- Les schémas de validation doivent rester dans `src/schemas/`.
- Pas de dépendance circulaire.
- Pas de gros fichiers mélangeant plusieurs responsabilités.
- Ajouter ou mettre à jour les tests du périmètre.
- Exécuter les validations disponibles.
- Fournir les fichiers modifiés, décisions, tests, résultats exacts, limites restantes et un message de commit proposé.

EOP
