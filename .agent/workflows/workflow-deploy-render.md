# Workflow: Deploy a Render + Neon
# Comando: /deploy-render
# Descripción: Prepara y ejecuta el despliegue completo del ERP en Render.com con BD en Neon

## Pasos

1. Verificar que render.yaml existe en backend/ con rootDir, buildCommand y startCommand correctos
2. Verificar que requirements.txt incluye psycopg2-binary, uvicorn[standard] y todas las dependencias
3. Verificar que app/db/session.py tiene connect_args={"sslmode":"require"} para conexiones a Neon
4. Verificar que el endpoint GET /health existe en main.py y responde {"status":"ok"}
5. Verificar que CORS en main.py incluye la URL exacta del frontend en Vercel
6. Verificar que no hay archivos .env commiteados — revisar con `git ls-files | grep .env`
7. Confirmar que las variables de entorno están configuradas en el dashboard de Render:
   - DATABASE_URL (con ?sslmode=require al final)
   - SECRET_KEY (mínimo 32 caracteres)
   - DEBUG=false
   - ALLOWED_ORIGINS con la URL de Vercel
8. Hacer push a main y verificar que el build de Render inicia automáticamente
9. Monitorear los logs de build en Render — el build debe completar sin errores
10. Verificar el deploy haciendo GET a https://erp-financiero-api.onrender.com/health — debe responder 200
11. Verificar que los endpoints protegidos devuelven 401 sin token
12. Si el deploy falla: ir a Render → Deployments → último deploy exitoso → Redeploy
13. Generar deployment.md con: versión desplegada, fecha, variables configuradas y resultado de verificación
