# Architecture

## Objectif

Structure technique cible de Cookies & Coquillettes, application mobile de cahier de recettes.

## Vue d’ensemble

Application mobile (native ou hybride) avec stockage local. Pas de backend en v1. Architecture en couches : UI, logique métier, persistance.

```
[UI / écrans] ←→ [Logique / services] ←→ [Persistance locale]
```

## Composants

| Composant | Responsabilité | Technologie / emplacement |
|-----------|---------------|---------------------------|
| **Écrans** | Affichage, navigation, saisie | [ASSUMPTION] React Native / Expo ou Flutter — à décider (voir ADR). |
| **Services / logique** | CRUD recettes, recherche, filtrage | Modules applicatifs. |
| **Persistance** | Stockage des recettes | [ASSUMPTION] SQLite ou stockage clé-valeur local (AsyncStorage, Hive, etc.). |
| **Navigation** | Routage entre écrans | Stack / tab navigation selon le framework. |

## Stack technique

- **Framework mobile :** [UNCERTAIN] React Native (Expo), Flutter ou autre — décision à documenter dans ADR.
- **Langage :** TypeScript (RN) ou Dart (Flutter).
- **Persistance :** Base locale (SQLite, AsyncStorage, ou équivalent).
- **Build :** Outils du framework choisi (Expo, Flutter CLI).

## Modèle d’exécution

- Application installée sur l’appareil.
- Données stockées localement ; pas de serveur requis en v1.
- [ASSUMPTION] Fonctionne hors-ligne pour la consultation et l’édition des recettes.

## Fichiers et répertoires clés (cible)

- `src/` ou `lib/` : code source (selon framework).
- `src/screens/` : écrans (liste, détail, formulaire).
- `src/services/` : logique métier (recettes, recherche).
- `src/storage/` : couche de persistance.
- `docs/` : documentation du projet.

## Hypothèses et incertitudes

- [ASSUMPTION] Choix du framework mobile à valider ; impact sur la structure des dossiers.
- [UNCERTAIN] Stratégie de migration des données si le schéma évolue.
- [UNCERTAIN] Cible : iOS, Android ou les deux en priorité.
