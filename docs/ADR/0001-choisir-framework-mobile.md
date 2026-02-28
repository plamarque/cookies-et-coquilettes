# ADR 0001 — Choix du framework mobile

## Statut

Décidé

## Contexte

Cookies & Coquillettes est une application de cahier de recettes à usage mobile. Le besoin principal est d’importer rapidement des recettes (partage, URL, screenshot, texte) puis de les consulter hors-ligne avec une UX simple.

## Options envisagées

1. **PWA Vue + TypeScript**
2. **React Native (Expo)**
3. **Flutter**

## Décision

Choisir **PWA Vue + TypeScript**.

La PWA répond au besoin de distribution iOS/Android via navigateur + installation, réduit le temps d’initialisation, et permet une itération rapide avec une stack TypeScript homogène front/BFF.

## Conséquences

1. Architecture web mobile-first avec manifest PWA et stratégie offline-first.
2. Utilisation des APIs web (Wake Lock, Share Target) avec fallback obligatoire en cas de non-support.
3. Persistance principale en `IndexedDB` via `Dexie`.
4. Introduction d’un BFF Node/TypeScript pour OCR/parsing cloud et protection des clés API.
5. Monorepo recommandé :
   - `apps/web`
   - `apps/bff`
   - `packages/domain`
