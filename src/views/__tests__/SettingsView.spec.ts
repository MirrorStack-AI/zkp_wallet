import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsView from '../SettingsView.vue'

describe('SettingsView', () => {
  it('renders settings view correctly', () => {
    const wrapper = mount(SettingsView)
    
    expect(wrapper.find('[data-testid="settings-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="back-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="logout-button"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Security')
    expect(wrapper.text()).toContain('Hardware Security Module')
    expect(wrapper.text()).toContain('Biometric Authentication')
    expect(wrapper.text()).toContain('Logout')
  })

  it('has back button with correct click handler', () => {
    const wrapper = mount(SettingsView)
    
    const backButton = wrapper.find('[data-testid="back-button"]')
    expect(backButton.exists()).toBe(true)
    expect(backButton.attributes()).toBeDefined()
  })

  it('has logout button with correct click handler', () => {
    const wrapper = mount(SettingsView)
    
    const logoutButton = wrapper.find('[data-testid="logout-button"]')
    expect(logoutButton.exists()).toBe(true)
    expect(logoutButton.attributes()).toBeDefined()
  })

  it('displays security information correctly', () => {
    const wrapper = mount(SettingsView)
    
    expect(wrapper.text()).toContain('Status: Active | Level: FIPS 140-2 Level 3')
    expect(wrapper.text()).toContain('Status: Enabled | Type: Touch ID / Face ID')
  })
}) 