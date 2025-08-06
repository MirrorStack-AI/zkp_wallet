import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import EventDispatcherService, { 
  type CustomEventDetail, 
  type EventConfig 
} from '../EventDispatcherService'

describe('EventDispatcherService', () => {
  let eventService: EventDispatcherService

  beforeEach(() => {
    // Reset the singleton instance
    ;(EventDispatcherService as any).instance = undefined
    
    // Create fresh instance
    eventService = EventDispatcherService.getInstance()
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock window event system for test environment
    const listeners = new Map<string, Set<{ callback: EventListenerOrEventListenerObject, once?: boolean }>>()
    
    vi.spyOn(window, 'addEventListener').mockImplementation((eventName: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set())
      }
      const once = typeof options === 'object' ? options?.once : false
      listeners.get(eventName)!.add({ callback, once })
    })
    
    vi.spyOn(window, 'removeEventListener').mockImplementation((eventName: string, callback: EventListenerOrEventListenerObject) => {
      if (listeners.has(eventName)) {
        const listenerSet = listeners.get(eventName)!
        for (const listener of listenerSet) {
          if (listener.callback === callback) {
            listenerSet.delete(listener)
            break
          }
        }
      }
    })
    
    vi.spyOn(window, 'dispatchEvent').mockImplementation((event: Event) => {
      const eventName = event.type
      if (listeners.has(eventName)) {
        const listenerSet = listeners.get(eventName)!
        const toRemove: Array<{ callback: EventListenerOrEventListenerObject, once?: boolean }> = []
        
        listenerSet.forEach(listener => {
          if (typeof listener.callback === 'function') {
            listener.callback(event)
            if (listener.once) {
              toRemove.push(listener)
            }
          }
        })
        
        // Remove one-time listeners after calling them
        toRemove.forEach(listener => {
          listenerSet.delete(listener)
        })
      }
      return true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EventDispatcherService.getInstance()
      const instance2 = EventDispatcherService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('dispatchEvent', () => {
    it('should dispatch custom event successfully', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const eventName = 'test-event'
      const detail = { test: 'value' }

      eventService.dispatchEvent(eventName, detail)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: eventName,
          detail: detail,
          bubbles: true,
          cancelable: true
        })
      )
    })

    it('should dispatch event without detail', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const eventName = 'test-event'

      eventService.dispatchEvent(eventName)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: eventName,
          detail: {},
          bubbles: true,
          cancelable: true
        })
      )
    })

    it('should handle dispatch errors gracefully', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      dispatchEventSpy.mockImplementation(() => {
        throw new Error('Dispatch error')
      })

      expect(() => eventService.dispatchEvent('test-event')).not.toThrow()
    })
  })

  describe('dispatchAuthenticationUpdate', () => {
    it('should dispatch authentication update event', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const status = 'completed'
      const requestId = 'test-request-123'

      eventService.dispatchAuthenticationUpdate(status, requestId)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MirrorStackWalletAuthUpdate',
          detail: {
            status: status,
            requestId: requestId,
            timestamp: expect.any(Number)
          }
        })
      )
    })

    it('should include timestamp in authentication update', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const beforeTime = Date.now()

      eventService.dispatchAuthenticationUpdate('pending', 'test-request')

      const afterTime = Date.now()
      const dispatchedEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent
      const timestamp = dispatchedEvent.detail.timestamp

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('dispatchSecurityCheckUpdate', () => {
    it('should dispatch security check update event', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const status = 'completed'
      const data = { checkType: 'crypto', result: 'passed' }

      eventService.dispatchSecurityCheckUpdate(status, data)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MirrorStackWalletSecurityCheckUpdate',
          detail: {
            status: status,
            data: data,
            timestamp: expect.any(Number)
          }
        })
      )
    })

    it('should dispatch security check update without data', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const status = 'completed'

      eventService.dispatchSecurityCheckUpdate(status)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MirrorStackWalletSecurityCheckUpdate',
          detail: {
            status: status,
            data: undefined,
            timestamp: expect.any(Number)
          }
        })
      )
    })
  })

  describe('dispatchNavigationEvent', () => {
    it('should dispatch navigation event', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const view = 'settings'
      const data = { previousView: 'main' }

      eventService.dispatchNavigationEvent(view, data)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MirrorStackWalletNavigation',
          detail: {
            view: view,
            data: data,
            timestamp: expect.any(Number)
          }
        })
      )
    })

    it('should dispatch navigation event without data', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const view = 'main'

      eventService.dispatchNavigationEvent(view)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MirrorStackWalletNavigation',
          detail: {
            view: view,
            data: undefined,
            timestamp: expect.any(Number)
          }
        })
      )
    })
  })

  describe('addEventListener', () => {
    it('should add event listener successfully', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const callback = vi.fn()
      const eventName = 'test-event'

      eventService.addEventListener(eventName, callback)

      expect(addEventListenerSpy).toHaveBeenCalledWith(eventName, callback, undefined)
    })

    it('should add event listener with options', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const callback = vi.fn()
      const eventName = 'test-event'
      const options = { capture: true, once: true }

      eventService.addEventListener(eventName, callback, options)

      expect(addEventListenerSpy).toHaveBeenCalledWith(eventName, callback, options)
    })

    it('should handle addEventListener errors gracefully', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      addEventListenerSpy.mockImplementation(() => {
        throw new Error('AddEventListener error')
      })

      expect(() => eventService.addEventListener('test-event', vi.fn())).not.toThrow()
    })
  })

  describe('removeEventListener', () => {
    it('should remove event listener successfully', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const callback = vi.fn()
      const eventName = 'test-event'

      eventService.removeEventListener(eventName, callback)

      expect(removeEventListenerSpy).toHaveBeenCalledWith(eventName, callback, undefined)
    })

    it('should remove event listener with options', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const callback = vi.fn()
      const eventName = 'test-event'
      const options = { capture: true }

      eventService.removeEventListener(eventName, callback, options)

      expect(removeEventListenerSpy).toHaveBeenCalledWith(eventName, callback, options)
    })

    it('should handle removeEventListener errors gracefully', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      removeEventListenerSpy.mockImplementation(() => {
        throw new Error('RemoveEventListener error')
      })

      expect(() => eventService.removeEventListener('test-event', vi.fn())).not.toThrow()
    })
  })

  describe('waitForEvent', () => {
    it('should wait for event successfully', async () => {
      const eventName = 'test-event'
      const eventDetail = { test: 'value' }

      // Start waiting for event
      const waitPromise = eventService.waitForEvent(eventName, 1000)

      // Dispatch event immediately
      eventService.dispatchEvent(eventName, eventDetail)

      const event = await waitPromise

      expect(event.detail).toEqual(eventDetail)
    })

    it('should handle multiple events correctly', async () => {
      const eventName = 'test-event'
      const eventDetail1 = { test: 'value1' }
      const eventDetail2 = { test: 'value2' }

      // Start waiting for first event
      const waitPromise1 = eventService.waitForEvent(eventName, 1000)
      
      // Dispatch first event
      eventService.dispatchEvent(eventName, eventDetail1)

      const event1 = await waitPromise1
      expect(event1.detail).toEqual(eventDetail1)

      // Start waiting for second event
      const waitPromise2 = eventService.waitForEvent(eventName, 1000)
      
      // Dispatch second event
      eventService.dispatchEvent(eventName, eventDetail2)

      const event2 = await waitPromise2
      expect(event2.detail).toEqual(eventDetail2)
    })

    it('should use default timeout when not specified', async () => {
      const eventName = 'test-event'
      const eventDetail = { test: 'value' }

      // Start waiting for event with default timeout
      const waitPromise = eventService.waitForEvent(eventName)

      // Dispatch event
      eventService.dispatchEvent(eventName, eventDetail)

      const event = await waitPromise

      expect(event.detail).toEqual(eventDetail)
    })

    it('should add one-time event listener', async () => {
      const eventName = 'test-event'
      const callback = vi.fn()

      // Add one-time listener
      eventService.addEventListener(eventName, callback, { once: true })

      // Dispatch event
      eventService.dispatchEvent(eventName, { test: 'value' })

      expect(callback).toHaveBeenCalledTimes(1)

      // Dispatch again - should not be called
      eventService.dispatchEvent(eventName, { test: 'value2' })

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should remove listener after first event', async () => {
      const eventName = 'test-event'
      const callback = vi.fn()

      // Add one-time listener
      eventService.addEventListener(eventName, callback, { once: true })

      // Dispatch event
      eventService.dispatchEvent(eventName, { test: 'value' })

      // Dispatch again - should not be called since listener was automatically removed
      eventService.dispatchEvent(eventName, { test: 'value2' })

      // Should only be called once
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should call original callback when event occurs', async () => {
      const eventName = 'test-event'
      const eventDetail = { test: 'value' }
      const callback = vi.fn()

      // Add listener
      eventService.addEventListener(eventName, callback)

      // Dispatch event
      eventService.dispatchEvent(eventName, eventDetail)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: eventName,
          detail: eventDetail,
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle dispatchEvent errors gracefully', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      dispatchEventSpy.mockImplementation(() => {
        throw new Error('Dispatch error')
      })

      expect(() => eventService.dispatchEvent('test-event')).not.toThrow()
    })

    it('should handle addEventListener errors gracefully', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      addEventListenerSpy.mockImplementation(() => {
        throw new Error('AddEventListener error')
      })

      expect(() => eventService.addEventListener('test-event', vi.fn())).not.toThrow()
    })

    it('should handle removeEventListener errors gracefully', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      removeEventListenerSpy.mockImplementation(() => {
        throw new Error('RemoveEventListener error')
      })

      expect(() => eventService.removeEventListener('test-event', vi.fn())).not.toThrow()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete event lifecycle', async () => {
      const eventName = 'test-event'
      const eventDetail = { test: 'value' }
      const callback = vi.fn()

      // Add listener
      eventService.addEventListener(eventName, callback)

      // Dispatch event
      eventService.dispatchEvent(eventName, eventDetail)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: eventName,
          detail: eventDetail,
        })
      )

      // Remove listener
      eventService.removeEventListener(eventName, callback)
    })

    it('should handle multiple event types', async () => {
      const authCallback = vi.fn()
      const securityCallback = vi.fn()
      const navigationCallback = vi.fn()

      // Add listeners
      eventService.addEventListener('auth-event', authCallback)
      eventService.addEventListener('security-event', securityCallback)
      eventService.addEventListener('navigation-event', navigationCallback)

      // Dispatch events
      eventService.dispatchEvent('auth-event', { status: 'success' })
      eventService.dispatchEvent('security-event', { level: 'high' })
      eventService.dispatchEvent('navigation-event', { route: '/home' })

      expect(authCallback).toHaveBeenCalled()
      expect(securityCallback).toHaveBeenCalled()
      expect(navigationCallback).toHaveBeenCalled()
    })

    it('should handle one-time event listeners correctly', async () => {
      const eventName = 'test-event'
      const callback = vi.fn()

      // Add one-time listener
      eventService.addOneTimeEventListener(eventName, callback)

      // Wait a bit for the listener to be added
      await new Promise(resolve => setTimeout(resolve, 10))

      // Dispatch event
      eventService.dispatchEvent(eventName, { test: 'value' })

      // Wait for the event to be processed
      await new Promise(resolve => setTimeout(resolve, 10))

      // Callback should only be called once
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: eventName,
          detail: { test: 'value' },
        })
      )
    })

    it('should handle event waiting with timeout', async () => {
      const eventName = 'test-event'
      const eventDetail = { test: 'value' }

      // Start waiting for event
      const waitPromise = eventService.waitForEvent(eventName, 1000)

      // Wait a bit for the listener to be added
      await new Promise(resolve => setTimeout(resolve, 10))

      // Dispatch event
      eventService.dispatchEvent(eventName, eventDetail)

      const event = await waitPromise

      expect(event.detail).toEqual(eventDetail)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty event name', () => {
      expect(() => eventService.dispatchEvent('')).not.toThrow()
    })

    it('should handle null/undefined detail', () => {
      expect(() => eventService.dispatchEvent('test-event', null as any)).not.toThrow()
      expect(() => eventService.dispatchEvent('test-event', undefined as any)).not.toThrow()
    })

    it('should handle complex event detail objects', () => {
      const complexDetail = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        },
        date: new Date(),
        nullValue: null,
        undefinedValue: undefined
      }

      expect(() => eventService.dispatchEvent('test-event', complexDetail)).not.toThrow()
    })

    it('should handle very long event names', () => {
      const longEventName = 'a'.repeat(1000)
      expect(() => eventService.dispatchEvent(longEventName)).not.toThrow()
    })

    it('should handle very large event details', () => {
      const largeDetail = {
        data: 'x'.repeat(10000)
      }

      expect(() => eventService.dispatchEvent('test-event', largeDetail)).not.toThrow()
    })
  })
}) 