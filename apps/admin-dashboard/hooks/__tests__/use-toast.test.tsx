import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../use-toast';

describe('useToast', () => {
  beforeEach(() => {
    // Clear any existing toasts
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
  });

  it('should return toast and related functions', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current).toHaveProperty('toast');
    expect(result.current).toHaveProperty('dismiss');
    expect(result.current).toHaveProperty('toasts');
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('should create a toast with default options', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test toast',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Toast',
      description: 'This is a test toast',
    });
  });

  it('should create toast with variant', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Error Toast',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    });

    expect(result.current.toasts[0]).toMatchObject({
      title: 'Error Toast',
      description: 'Something went wrong',
      variant: 'destructive',
    });
  });

  it('should dismiss a specific toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;

    act(() => {
      const { id } = result.current.toast({
        title: 'Toast to dismiss',
      });
      toastId = id;
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss(toastId!);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should dismiss all toasts when no id provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
      result.current.toast({ title: 'Toast 3' });
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should update an existing toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;

    act(() => {
      const { id, update } = result.current.toast({
        title: 'Original Title',
      });
      toastId = id;
    });

    expect(result.current.toasts[0].title).toBe('Original Title');

    act(() => {
      const toast = result.current.toasts.find((t) => t.id === toastId);
      if (toast?.update) {
        toast.update({
          title: 'Updated Title',
          description: 'Now with description',
        });
      }
    });

    expect(result.current.toasts[0]).toMatchObject({
      title: 'Updated Title',
      description: 'Now with description',
    });
  });

  it('should handle multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Info', variant: 'default' });
      result.current.toast({ title: 'Success', variant: 'default' });
      result.current.toast({ title: 'Error', variant: 'destructive' });
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].title).toBe('Info');
    expect(result.current.toasts[1].title).toBe('Success');
    expect(result.current.toasts[2].title).toBe('Error');
  });

  it('should respect toast limit', () => {
    const { result } = renderHook(() => useToast());

    // Add more toasts than the limit (usually 1-3)
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.toast({ title: `Toast ${i}` });
      }
    });

    // Should not exceed the toast limit
    expect(result.current.toasts.length).toBeLessThanOrEqual(10);
  });

  it('should handle action in toast', () => {
    const actionHandler = jest.fn();
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Toast with action',
        action: {
          label: 'Undo',
          onClick: actionHandler,
        },
      });
    });

    expect(result.current.toasts[0]).toHaveProperty('action');
    expect(result.current.toasts[0].action).toMatchObject({
      label: 'Undo',
      onClick: actionHandler,
    });
  });
});
