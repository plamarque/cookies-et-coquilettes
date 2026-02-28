# Plan

## Phase actuelle

Tranche 2 (modèle de données et persistance) prête à démarrer.

## Tranches

| Tranche | Objectif | Statut |
|---------|----------|--------|
| 0 | Gouvernance documentaire | Fait |
| 1 | Choix du framework et structure de base | Fait |
| 2 | Modèle de données et persistance | En cours |
| 3 | Écrans CRUD recettes (liste, détail, formulaire) | À faire |
| 4 | Recherche et filtrage | À faire |
| 5 | Organisation (catégories, tags) | À faire |

## Tâches (Tranche 1)

- [x] Décision framework : PWA Vue + TypeScript (ADR 0001)
- [x] Initialisation du projet
- [x] Structure des dossiers de base
- [x] Configuration de développement

## Tâches (Tranche 2)

- [x] Types domaine partagés (`Recipe`, `IngredientLine`, `InstructionStep`, etc.)
- [x] Contrats de services (`recipe-service`, `import-service`, `cooking-mode-service`)
- [x] Base locale IndexedDB via Dexie (squelette)
- [x] Pipeline de déploiement push-based (GitHub Pages + Render)
- [x] Scripts utilitaires de base (`start-dev.sh`, E2E, screenshots stores)
- [x] Documentation publication stores (setup consoles)
- [ ] Implémentation complète CRUD + filtres + écrans
