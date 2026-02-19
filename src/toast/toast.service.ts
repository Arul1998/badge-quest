/**
 * @file toast.service.ts
 * @description A lightweight, framework-friendly Angular service for displaying
 * toast/snackbar notifications. Uses RxJS BehaviorSubject so any number of
 * components can subscribe to the notification stream.
 *
 * Usage:
 *   // In a component or another service:
 *   this.toastService.success('Saved successfully!');
 *   this.toastService.error('Something went wrong.', 8000);
 *
 * @author Arul Cornelious
 * @license MIT
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { tap } from 'rxjs/operators';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  /** Unique identifier generated at creation time. */
  id: string;
  /** Notification message to display. */
  message: string;
  /** Visual variant controlling colour and icon. */
  type: ToastType;
  /** Auto-dismiss duration in milliseconds. 0 = never auto-dismiss. */
  duration: number;
  /** ISO timestamp of when the toast was created. */
  createdAt: string;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 4000,
  info:    5000,
  warning: 6000,
  error:   8000,
};

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts$ = new BehaviorSubject<Toast[]>([]);

  /** Observable stream of currently active toasts. */
  readonly toasts$: Observable<Toast[]> = this._toasts$.asObservable();

  // ─── Public API ───────────────────────────────────────────────────────

  /** Show a success toast. */
  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  /** Show an error toast. */
  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  /** Show a warning toast. */
  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  /** Show an informational toast. */
  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  /**
   * Dismisses the toast with the given ID immediately.
   * Safe to call even if the ID no longer exists.
   */
  dismiss(id: string): void {
    this._toasts$.next(
      this._toasts$.getValue().filter(t => t.id !== id)
    );
  }

  /** Dismisses all active toasts at once. */
  dismissAll(): void {
    this._toasts$.next([]);
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  private show(message: string, type: ToastType, duration?: number): void {
    const resolvedDuration = duration ?? DEFAULT_DURATION[type];
    const toast: Toast = {
      id:        this.generateId(),
      message,
      type,
      duration:  resolvedDuration,
      createdAt: new Date().toISOString(),
    };

    this._toasts$.next([...this._toasts$.getValue(), toast]);

    if (resolvedDuration > 0) {
      timer(resolvedDuration)
        .pipe(tap(() => this.dismiss(toast.id)))
        .subscribe();
    }
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}
