# Plan

## Phase actuelle

Exécution des slices v1 en petites livraisons verticales.

## Slices v1

| Slice | Objectif | Statut |
|-------|----------|--------|
| A | Invariants domaine + types partagés (`quantityBase`, validation, règles import/suppression) | En cours |
| B | Persistance Dexie + `recipe-service` (CRUD/favoris/scale immuable/tri) | En cours |
| C | CRUD UI (liste, détail, formulaire) avec sauvegarde explicite | En cours |
| D | Recherche et filtres (`Sucré/Salé`, favoris, texte titre+ingrédients) | En cours |
| E | Import complet + revue obligatoire + fallback draft manuel | En cours |
| F | Mode cuisine Wake Lock + fallback non bloquant | En cours |
| G | Durcissement release v1 (tests smoke E2E + cohérence erreurs/docs) | En cours |

## Definition of Done par slice

- [x] Code implémenté
- [x] Tests unitaires et/ou smoke E2E ciblés
- [x] Docs normatives et de suivi alignées
