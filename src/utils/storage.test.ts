import { afterEach, describe, expect, it, vi } from 'vitest';

import { Get, Remove, Set } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('local storage helpers', () => {
  it('sets, gets, and removes namespaced values', () => {
    Set('token', 'secret');
    expect(Get('token')).toBe('secret');
    Remove('token');
    expect(Get('token')).toBeNull();
  });

  it('returns safely when local storage is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('blocked');
      },
    });

    expect(Get('token')).toBeNull();
    expect(Set('token', 'secret')).toBeUndefined();
    expect(Remove('token')).toBeUndefined();

    if (descriptor) Object.defineProperty(window, 'localStorage', descriptor);
  });

  it('treats quota errors as available only when storage already has entries', () => {
    let length = 0;
    const storage = {
      get length() {
        return length;
      },
      setItem: vi.fn(() => {
        throw new DOMException('full', 'QuotaExceededError');
      }),
      getItem: vi.fn(() => 'stored'),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });
    expect(Get('token')).toBeNull();

    length = 1;
    expect(Get('token')).toBe('stored');
    expect(storage.setItem).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['legacy Firefox quota code', 1014, 'UnknownError'],
    ['quota exception name', 0, 'QuotaExceededError'],
    ['Firefox quota exception name', 0, 'NS_ERROR_DOM_QUOTA_REACHED'],
  ])('accepts %s when storage contains data', (_label, code, name) => {
    const error = new DOMException('full');
    Object.defineProperty(error, 'code', { value: code });
    Object.defineProperty(error, 'name', { value: name });
    const storage = {
      length: 1,
      setItem: vi.fn(() => {
        throw error;
      }),
      getItem: vi.fn(() => 'stored'),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });

    expect(Get('token')).toBe('stored');
  });
});
