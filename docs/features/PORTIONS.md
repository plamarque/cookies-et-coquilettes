# Ajustement des portions — Slice de développement

## Slide 1 — Contexte

- Ajuster le nombre de portions d'une recette avec recalcul automatique des quantités d'ingrédients.
- Permet de cuisiner pour 2, 4, 6 personnes à partir d'une recette prévue pour X portions.

## Slide 2 — Où afficher

- **Écran détail** : input « Portions », bouton « Appliquer », bouton « Reset base » (visible uniquement si la recette a un `servingsBase`).
- **Formulaire recette** : champ « Portions de base », checkbox « Scalable » par ingrédient.

## Slide 3 — Règles métier

- Coefficient linéaire : `quantity = quantityBase × (servingsTarget / servingsBase)`.
- `quantityBase` est la référence immuable (pas de dérive cumulative).
- Ingrédients non scalables (`isScalable = false`) : quantité conservée en texte libre.
- Recalcul sur action explicite utilisateur (Appliquer).

## Slide 4 — État actuel

- Domaine : `scaleIngredientsFromBase`, `quantityBase`, `normalizeIngredient` implémentés.
- Service : `scaleRecipe` dans `recipe-service` (Dexie).
- UI : **masquée** via `FEATURE_PORTIONS_ENABLED = false` car inopérante.

## Slide 5 — À faire

1. Vérifier/corriger le flux complet : saisie `quantityBase` à la création/édition, import BFF.
2. S'assurer que `scaleRecipe` persiste correctement et que l'affichage reflète les quantités recalculées.
3. Tests E2E sur le parcours portions.
4. Réactiver l'UI via `FEATURE_PORTIONS_ENABLED = true` dans `App.vue`.

## Slide 6 — Impacts

- **DOMAIN** : `quantityBase`, `isScalable`, `servingsBase`, `servingsCurrent` (déjà définis).
- **ARCH** : `scaleRecipe`, `scaleIngredientsFromBase` (déjà en place).
- **SPEC** : capacité « Ajustement du nombre de portions » (points 7, 57-58).
