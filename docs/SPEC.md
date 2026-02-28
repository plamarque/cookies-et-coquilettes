# Spécification fonctionnelle

## Objectif

**Cookies & Coquillettes** est une application mobile de cahier de recettes. Elle permet aux utilisateurs de conserver, organiser et consulter leurs recettes de cuisine sur smartphone ou tablette.

## Périmètre

- **Dans le périmètre :** Création, édition, consultation et organisation de recettes ; gestion des ingrédients et des étapes ; recherche et filtrage ; interface mobile-first.
- **Hors périmètre :** [ASSUMPTION] Pas de partage social ni de synchronisation cloud dans la première version ; pas de génération automatique de recettes ; pas de gestion de listes de courses intégrée.

## Capacités principales

1. **Créer et modifier des recettes** — Titre, ingrédients (quantités, unités), étapes de préparation, durée, nombre de parts.
2. **Consulter des recettes** — Affichage lisible et adapté au mobile.
3. **Organiser les recettes** — Catégories, tags ou collections (ex. desserts, plats principaux).
4. **Rechercher et filtrer** — Par nom, ingrédient ou catégorie.
5. **Interface mobile-first** — Navigation tactile, lisibilité sur petit écran.

## Comportement

- L’utilisateur peut ajouter une recette via un formulaire structuré.
- Les recettes sont listées (liste ou grille) avec possibilité de tri et de filtrage.
- La consultation d’une recette affiche tous les détails (ingrédients, étapes, durée, etc.).
- [ASSUMPTION] Les données sont stockées localement sur l’appareil (pas de backend obligatoire en v1).

## Limites

- **Entrées :** Saisie utilisateur (formulaires, recherche).
- **Sorties :** Affichage des recettes et listes ; [UNCERTAIN] export ou impression à définir.
- **Dépendances externes :** [ASSUMPTION] Aucune en v1 ; [UNCERTAIN] éventuelle intégration future (sync, API recettes).

## Hypothèses et incertitudes

- [ASSUMPTION] Application mobile native ou hybride (React Native, Flutter, Expo, etc.) — à valider dans ARCH.
- [ASSUMPTION] Stockage local uniquement en première version.
- [UNCERTAIN] Support hors-ligne : niveau de persistance et disponibilité sans réseau.
- [UNCERTAIN] Langue(s) cible(s) : français uniquement ou multilingue.
