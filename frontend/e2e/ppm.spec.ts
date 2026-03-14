import { test, expect } from '@playwright/test'

test.describe('PPM (Pagos Provisionales Mensuales)', () => {
  test.beforeEach(async ({ page }) => {
    // Autenticación via session
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@erp.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('seleccionar mes/año valida el monto', async ({ page }) => {
    await page.click('a[href="/ppm"]')
    await expect(page).toHaveURL('/ppm')
    await expect(page.locator('h1', { hasText: 'Cálculo de PPM' })).toBeVisible()

    // En Header existe el selector de mes y año
    // Simulamos un cambio para ver reacción (usando los select del componente header/ppm)
    await page.selectOption('select.w-28', { label: 'Febrero' }) // mes
    await page.selectOption('select.w-20', { label: '2025' })    // año
    
    // El texto "Monto a Pagar" debe estar visible en la tarjeta principal
    await expect(page.locator('text=Monto a Pagar')).toBeVisible()
    await expect(page.locator('.text-4xl.font-bold')).toBeVisible()

    // La tabla histórica debe tener registros
    const tableRows = page.locator('table tbody tr')
    await expect(tableRows.first()).toBeVisible()
  })
})
