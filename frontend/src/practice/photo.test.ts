import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearPhoto, loadPhoto, photoSize, PHOTO_KEY, savePhoto } from './photo'
import { SETTINGS_EVENT } from './store'

afterEach(() => localStorage.clear())

const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

describe('photo store', () => {
  it('startsEmpty', () => expect(loadPhoto()).toBeNull())

  it('roundTripsAndClears', () => {
    savePhoto(JPEG)
    expect(loadPhoto()).toBe(JPEG)
    clearPhoto()
    expect(loadPhoto()).toBeNull()
  })

  it('ignoresAnythingThatIsNotAJpegDataUrl', () => {
    localStorage.setItem(PHOTO_KEY, 'https://evil.example/x.jpg')
    expect(loadPhoto()).toBeNull()
    localStorage.setItem(PHOTO_KEY, 'data:text/html;base64,PHNjcmlwdD4=')
    expect(loadPhoto()).toBeNull()
    localStorage.setItem(PHOTO_KEY, 'data:image/jpeg;base64,' + 'A'.repeat(700_000))
    expect(loadPhoto()).toBeNull()
  })

  it('tellsPagesWhenThePhotoChanges', () => {
    const listener = vi.fn()
    window.addEventListener(SETTINGS_EVENT, listener)
    savePhoto(JPEG)
    clearPhoto()
    window.removeEventListener(SETTINGS_EVENT, listener)
    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe('photoSize', () => {
  it('shrinksTheLongSideToTheLimitKeepingTheShape', () => {
    expect(photoSize(4000, 3000, 480)).toEqual({ w: 480, h: 360 })
    expect(photoSize(1000, 2000, 480)).toEqual({ w: 240, h: 480 })
  })

  it('neverEnlarges', () => {
    expect(photoSize(200, 100, 480)).toEqual({ w: 200, h: 100 })
  })
})
