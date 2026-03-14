import { test, expect } from '@playwright/test'

test.describe('Balanced Scorecard (BSC)', () => {
  test.beforeEach(async ({ page }) => {
    // Simulamos estar autenticados haciendo login real o bypasseando AuthStore
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@erp.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('navegar a BSC y verificar tabs y datos', async ({ page }) => {
    await page.click('a[href="/bsc"]')
    await expect(page).toHaveURL('/bsc/rentabilidad')
    await expect(page.locator('h1', { hasText: 'Balanced Scorecard (BSC)' })).toBeVisible()

    // 6 tabs visibles
    const tabs = ['Rentabilidad', 'Liquidez', 'Endeudamiento', 'Eficiencia', 'Ciclo Efectivo', 'Estratégico']
    for (const tab of tabs) {
      await expect(page.locator(`text=${tab}`)).toBeVisible()
    }

    // Verificar que hay KPICards renderizados en el tab actual
    const cards = page.locator('.col-span-1.bg-white.rounded-xl')
    await expect(cards.first()).toBeVisible()
    
    // Cambiar de tab
    await page.click('text=Liquidez')
    await expect(page).toHaveURL('/bsc/liquidez')
    
    // Las cards de liquidez deben aparecer
    await expect(cards.first()).toBeVisible()
  })
})
