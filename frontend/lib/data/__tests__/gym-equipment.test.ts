import { gymEquipment, equipmentCategories, allEquipment, getEquipmentType } from '../gym-equipment'

describe('Gym Equipment Data', () => {
  describe('gymEquipment', () => {
    it('should have all categories defined', () => {
      expect(gymEquipment).toBeDefined()
      expect(gymEquipment.cardio).toBeDefined()
      expect(gymEquipment.chestPress).toBeDefined()
      expect(gymEquipment.back).toBeDefined()
      expect(gymEquipment.shoulders).toBeDefined()
      expect(gymEquipment.arms).toBeDefined()
      expect(gymEquipment.legs).toBeDefined()
      expect(gymEquipment.core).toBeDefined()
      expect(gymEquipment.freeWeights).toBeDefined()
      expect(gymEquipment.functional).toBeDefined()
    })

    it('should have cardio equipment with correct type', () => {
      gymEquipment.cardio.forEach(equipment => {
        expect(equipment.type).toBe('cardio')
        expect(equipment.name).toBeDefined()
        expect(Array.isArray(equipment.brands)).toBe(true)
      })
    })

    it('should have strength equipment with correct type', () => {
      gymEquipment.chestPress.forEach(equipment => {
        expect(equipment.type).toBe('strength')
      })
      gymEquipment.legs.forEach(equipment => {
        expect(equipment.type).toBe('strength')
      })
    })

    it('should have at least 68 total equipment items', () => {
      const totalCount = Object.values(gymEquipment).reduce(
        (sum, category) => sum + category.length,
        0
      )
      expect(totalCount).toBeGreaterThanOrEqual(68)
    })
  })

  describe('equipmentCategories', () => {
    it('should have correct structure', () => {
      equipmentCategories.forEach(category => {
        expect(category).toHaveProperty('value')
        expect(category).toHaveProperty('label')
        expect(typeof category.value).toBe('string')
        expect(typeof category.label).toBe('string')
      })
    })

    it('should have 9 categories', () => {
      expect(equipmentCategories.length).toBe(9)
    })
  })

  describe('allEquipment', () => {
    it('should flatten all equipment into single array', () => {
      expect(Array.isArray(allEquipment)).toBe(true)
      expect(allEquipment.length).toBeGreaterThan(0)
    })

    it('should include category and displayName for each item', () => {
      allEquipment.forEach(equipment => {
        expect(equipment).toHaveProperty('name')
        expect(equipment).toHaveProperty('type')
        expect(equipment).toHaveProperty('brands')
        expect(equipment).toHaveProperty('category')
        expect(equipment).toHaveProperty('displayName')
      })
    })

    it('should format displayName correctly', () => {
      const withBrands = allEquipment.find(e => e.brands.length > 0)
      const withoutBrands = allEquipment.find(e => e.brands.length === 0)

      if (withBrands) {
        expect(withBrands.displayName).toContain('(')
        expect(withBrands.displayName).toContain(')')
      }

      if (withoutBrands) {
        expect(withoutBrands.displayName).toBe(withoutBrands.name)
      }
    })
  })

  describe('getEquipmentType', () => {
    it('should return correct type for treadmill', () => {
      expect(getEquipmentType('Treadmill')).toBe('cardio')
    })

    it('should return correct type for chest press', () => {
      expect(getEquipmentType('Chest Press Machine')).toBe('strength')
    })

    it('should return correct type for TRX', () => {
      expect(getEquipmentType('TRX Suspension Training')).toBe('functional')
    })

    it('should return null for non-existent equipment', () => {
      expect(getEquipmentType('Non Existent Equipment')).toBeNull()
    })

    it('should be case-sensitive', () => {
      expect(getEquipmentType('treadmill')).toBeNull()
      expect(getEquipmentType('Treadmill')).toBe('cardio')
    })
  })
})
