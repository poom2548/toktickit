import { describe, it, expect } from 'vitest'
import React from 'react'

describe('StaffDashboard', () => {
  it('UI-01: Component missing', async () => { 
    try {
      const path = '../../pages/staff/StaffDashboard'
      await import(/* @vite-ignore */ path)
    } catch (e: any) {
      expect(e.message).toMatch(/not implemented/i)
    } 
  })
  it('UI-02: Component missing', async () => { expect(1).toBe(2) })
  it('UI-13: staff nav missing', async () => { expect(1).toBe(2) })
})
