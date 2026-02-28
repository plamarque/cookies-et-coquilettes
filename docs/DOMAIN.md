# Modèle de domaine

## Objectif

Vocabulaire et concepts du domaine « cahier de recettes » pour Cookies & Coquillettes : recettes, ingrédients, étapes, organisation.

## Termes clés

| Terme | Définition |
|-------|------------|
| **Recette** | Une préparation culinaire avec titre, ingrédients, étapes, durée et nombre de parts. |
| **Ingrédient** | Un élément utilisé dans une recette, avec quantité (optionnelle) et unité (optionnelle). |
| **Étape** | Une instruction de préparation, ordonnée dans la recette. |
| **Catégorie** | Un regroupement de recettes (ex. dessert, entrée, plat principal). |
| **Tag** | Mot-clé optionnel pour filtrer ou organiser les recettes. |

## Entités et relations

- **Recette :** titre, liste d’ingrédients, liste d’étapes, durée (en minutes), nombre de parts, catégorie(s), tags, date de création/modification.
- **Ingrédient :** nom, quantité (nombre ou texte), unité (g, ml, cuillère, etc.).
- **Étape :** ordre, texte descriptif.
- **Catégorie :** nom, éventuellement hiérarchie. [ASSUMPTION] Une recette peut avoir une ou plusieurs catégories.
- **Relation :** Une recette contient N ingrédients et N étapes ; une recette appartient à une ou plusieurs catégories ; une recette peut avoir N tags.

## Règles du domaine

1. Une recette a au moins un titre.
2. Les étapes sont ordonnées (numérotation ou ordre explicite).
3. Les ingrédients peuvent être sans quantité ni unité (texte libre).
4. [ASSUMPTION] Les catégories sont prédéfinies ou créées par l’utilisateur — à préciser.

## Hypothèses et incertitudes

- [UNCERTAIN] Gestion des unités : liste fixe ou saisie libre.
- [UNCERTAIN] Adaptation des quantités (ex. recette pour 4 parts, affichage pour 6) — hors scope v1 ou à inclure.
