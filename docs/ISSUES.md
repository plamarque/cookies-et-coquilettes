# Issues

## Bugs

Aucun bug bloquant documenté.

## Limitations

- `share_target` PWA non pris en charge par Safari (iOS/macOS) et Firefox ; fallback manuel via collage/presse-papiers requis.

## Différé

- Ajustement des portions : UI masquée car inopérante ; slice K, voir `docs/features/PORTIONS.md`.
- Cache BFF pour images d'ingrédients générées : mutualiser les images entre utilisateurs pour limiter les appels DALL-E ; impact architecture (stockage serveur, ex. fichier ou Redis) — à réfléchir plus tard.
