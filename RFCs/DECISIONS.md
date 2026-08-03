# DECISIONS.md

Ce document recense les décisions d'architecture validées.

## Règles

- Une décision est ajoutée uniquement après validation humaine.
- Chaque décision reçoit un identifiant unique.
- Une décision ne doit jamais être modifiée silencieusement.
- Si une décision doit évoluer, créer une nouvelle entrée indiquant qu'elle remplace la précédente.

---

## Modèle

### DEC-001 — Titre

**Date :**

**Statut :** Proposed | Accepted | Superseded

**Contexte**

...

**Décision**

...

**Conséquences**

...

**RFC concernées**

- RFC-00X

---

## Décisions

### DEC-001 — Répertoire `src/domain/` pour la logique pure partagée entre couches

**Date :** 2026-08-03

**Statut :** Accepted

**Contexte**

RFC-004 a introduit `extractPathParameterNames` et `computeParameterDiscrepancies`,
deux fonctions pures nécessaires à la fois à la validation Zod
(`src/schemas/route.ts`), à la validation métier (`src/routes/validate-route-parameters.ts`)
et à la résolution d'URL (`src/routes/resolve-route-path.ts`). Les placer dans
`src/routes/` faisait dépendre un schéma de validation (`schemas/`) d'un module
de la couche d'exécution métier (`routes/`), un sens de dépendance discutable
même en l'absence de cycle réel.

**Décision**

Créer un répertoire neutre `src/domain/` (non prévu dans l'arborescence initiale
de RFC-001) pour la logique de domaine pure, partagée sans appartenir à une
couche d'exécution précise. Premier contenu : `src/domain/routes/` (extraction
et comparaison des paramètres dynamiques d'une route).

**Conséquences**

- `schemas/route.ts`, `routes/validate-route-parameters.ts` et
  `routes/resolve-route-path.ts` dépendent tous de `domain/routes/*`, jamais
  l'inverse.
- Les futures fonctions pures de domaine partagées entre plusieurs couches
  devraient suivre le même emplacement plutôt que d'être rattachées à une
  couche d'exécution particulière.

**RFC concernées**

- RFC-004

---
