# Modèle de domaine v1

## Objectif

Définir le vocabulaire métier et les règles de gestion pour la centralisation, la consultation et l’adaptation de recettes.

## Valeurs et énumérations

- `RecipeCategory = SUCRE | SALE`
- `ImportType = MANUAL | SHARE | URL | SCREENSHOT | TEXT`

## Entités

### Recipe

Recette utilisateur persistée localement.

Attributs principaux :
- `id`
- `title`
- `category`
- `favorite`
- `servingsBase` (optionnel)
- `servingsCurrent` (optionnel)
- `ingredients: IngredientLine[]`
- `steps: InstructionStep[]`
- `prepTimeMin` (optionnel)
- `cookTimeMin` (optionnel)
- `imageId` (optionnel)
- `source: ImportSource` (optionnel)
- `createdAt`
- `updatedAt`

### IngredientLine

Ligne d’ingrédient affichée et exploitable pour le recalcul des portions.

Attributs principaux :
- `id`
- `label` (nom lisible)
- `quantity` (optionnelle, valeur affichée courante)
- `quantityBase` (optionnelle, référence immuable pour scaling)
- `unit` (optionnelle)
- `isScalable` (booléen)
- `rawText` (optionnel, garde la forme source)

### InstructionStep

Étape ordonnée de préparation.

Attributs :
- `id`
- `order`
- `text`

### RecipeImage

Image de recette associée à une vignette et/ou à un détail.

Attributs :
- `id`
- `mimeType`
- `width`
- `height`
- `sizeBytes`
- `createdAt`

### ImportSource

Trace de provenance d’une recette importée.

Attributs :
- `type: ImportType`
- `url` (optionnel)
- `capturedAt`

## Relations

1. Une `Recipe` contient `N` `IngredientLine`.
2. Une `Recipe` contient `N` `InstructionStep`.
3. Une `Recipe` peut référencer `0..1` `RecipeImage`.
4. Une `Recipe` peut référencer `0..1` `ImportSource`.

## Règles du domaine

1. Une recette doit contenir un `title`.
2. Une recette doit contenir au moins un ingrédient ou au moins une étape.
3. Les étapes sont ordonnées strictement par `order`.
4. Les ingrédients non quantifiables sont conservés en texte libre (`rawText`/`label`) et peuvent être marqués `isScalable = false`.
5. Le recalcul des portions utilise un coefficient linéaire :
   - `coefficient = servingsTarget / servingsBase`.
   - la quantité recalculée doit toujours dériver de `quantityBase` si présent.
6. Les arrondis doivent rester culinaires et lisibles :
   - unités “œuf/oeuf/pièce/unité” arrondies à l’entier,
   - grammes/ml arrondis raisonnablement,
   - unités non numériques inchangées.
7. L’utilisateur peut revenir aux quantités de base via reset des portions.
8. “Sans changer les grammages” signifie : pas de transformation implicite de la recette importée sans action explicite.
9. Suppression d’une recette : définitive après confirmation utilisateur.
10. Import fallback : en cas d’échec parsing/BFF, un draft minimal éditable est créé avec `source`.
