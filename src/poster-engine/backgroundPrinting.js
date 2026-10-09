// Fundos completos para folhas de cartazes, sem depender de produtos cadastrados.
export const MAX_BACKGROUND_SHEETS = 50
export function normalizeBackgroundSheetCount(value) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) ? Math.max(1, Math.min(MAX_BACKGROUND_SHEETS, parsed)) : 1
}
export function createBackgroundSlots(format) {
  return Array.from({ length: Math.max(1, format.postersPerSheet) }, (_, index) => ({
    id: `background-slot-${index}`,
    description: '', subdescription: '', complement: '', unit: '', price: '',
  }))
}
