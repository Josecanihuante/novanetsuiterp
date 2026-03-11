# Workflow: Revisión de UI/UX y Código Frontend
# Comando: /review-frontend
# Descripción: Audita la calidad del código frontend, accesibilidad y experiencia de usuario

## Pasos

1. Revisar que todos los componentes interactivos son usables con teclado (Tab, Enter, Escape)
2. Verificar que los textos tienen contraste suficiente (mínimo 4.5:1 para texto normal)
3. Buscar imágenes sin atributo `alt` o con alt vacío en imágenes de contenido
4. Verificar que los formularios tienen labels correctamente asociados a sus inputs
5. Revisar que se implementan todos los estados de UI: loading, error, empty, success
6. Buscar valores hardcodeados de color o espaciado — deben usar tokens de diseño
7. Verificar que los componentes son responsive — probar breakpoints móvil, tablet y desktop
8. Revisar el uso de TypeScript: buscar `any` no justificados
9. Verificar que las imágenes usan lazy loading y formatos optimizados
10. Ejecutar auditoría de Lighthouse (Performance, Accessibility, Best Practices, SEO)
11. Generar reporte con:
    - Problemas de accesibilidad (críticos primero)
    - Issues de performance con métricas Web Vitals
    - Inconsistencias con el sistema de diseño
    - Recomendaciones UX basadas en los hallazgos
