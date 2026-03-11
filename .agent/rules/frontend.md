---
description: >
  Reglas pasivas del Developer Frontend/UI-UX. Se aplican automáticamente
  al generar o editar componentes, estilos y código de interfaz de usuario.
globs:
  - "src/components/**/*"
  - "src/pages/**/*"
  - "src/app/**/*"
  - "*.tsx"
  - "*.jsx"
  - "*.css"
  - "*.scss"
alwaysApply: false
---

# Reglas de Desarrollo Frontend y UI/UX

Cuando escribes o revisas código de frontend, aplica siempre estas reglas:

## Accesibilidad (no negociable)
- Todo elemento interactivo debe ser usable con teclado
- Contraste mínimo de color: 4.5:1 para texto normal
- Imágenes de contenido deben tener atributo `alt` descriptivo
- Focus visible siempre presente — nunca `outline: none` sin reemplazo

## Código
- TypeScript estricto — nunca usar `any`
- Usar tokens de diseño (variables CSS) — nunca valores hardcoded de color o espaciado
- Componentes deben manejar todos los estados: loading, error, empty, success
- Tamaño mínimo de área táctil: 44x44px

## Performance
- Lazy loading para componentes pesados o rutas secundarias
- Imágenes en formato WebP/AVIF con `loading="lazy"` por defecto
- No usar `useMemo`/`useCallback` sin evidencia de problema de performance

## Diseño
- Mobile-first siempre — estilos base para móvil, media queries para escalar
- Seguir el sistema de diseño establecido — no inventar tokens nuevos
- Skeleton screens en lugar de spinners para loading de contenido
