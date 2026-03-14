import { test, expect } from '@playwright/test'

test.describe('Autenticación', () => {
  test('login exitoso redirecciona al dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@erp.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // Debería redirigir al Dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1', { hasText: 'Dashboard Financiero' })).toBeVisible()
  })

  test('login incorrecto muestra mensaje de error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@erp.com')
    await page.fill('input[type="password"]', 'badpass')
    await page.click('button[type="submit"]')
    
    // Verificar que aparece el mensaje de credenciales inválidas
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('logout redirecciona al login', async ({ page }) => {
    // Login primero
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@erp.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    
    // Luego probar logout en el header
    await page.click('button[title="Cerrar sesión"]')
    
    // Verificar que volvió a login
    await expect(page).toHaveURL('/login')
  })
})
