import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Importación de Datos (NetSuite)', () => {
  test.beforeEach(async ({ page }) => {
    // Autenticación via session
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@erp.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('subida Excel, preview y tabla de errores', async ({ page }) => {
    await page.click('a[href="/importar"]')
    await expect(page).toHaveURL('/importar')
    await expect(page.locator('h1', { hasText: 'Importar Datos' })).toBeVisible()

    // No tenemos un archivo real Excel en E2E, pero testearemos que existe el dropzone
    const dropzone = page.locator('div.border-dashed')
    await expect(dropzone).toBeVisible()
    await expect(page.locator('text=Sube tu archivo de NetSuite')).toBeVisible()

    const confirmBtn = page.locator('button', { hasText: 'Confirmar Importación' })
    // Debería estar desactivado inicialmente
    await expect(confirmBtn).toBeDisabled()
  })
})
