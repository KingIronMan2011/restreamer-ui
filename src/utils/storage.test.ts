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
});
