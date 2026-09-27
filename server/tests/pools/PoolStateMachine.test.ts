import { describe, it, expect } from 'vitest';
import {
  PoolStateMachine,
  type PoolStatus,
  type PoolAction,
} from '../../src/modules/pools/domain/PoolStateMachine.js';
import { InvalidTransitionError } from '../../src/shared/errors/InvalidTransitionError.js';

describe('PoolStateMachine Domain Unit Tests', () => {
  describe('Legal transitions sequence', () => {
    it('transitions OPEN to MATCHED via accept by DRIVER', () => {
      const next = PoolStateMachine.getNextStatus('OPEN', 'accept', 'DRIVER');
      expect(next).toBe('MATCHED');
    });

    it('transitions MATCHED to DRIVER_ARRIVED via arrive by DRIVER', () => {
      const next = PoolStateMachine.getNextStatus('MATCHED', 'arrive', 'DRIVER');
      expect(next).toBe('DRIVER_ARRIVED');
    });

    it('transitions DRIVER_ARRIVED to STARTED via start by DRIVER', () => {
      const next = PoolStateMachine.getNextStatus('DRIVER_ARRIVED', 'start', 'DRIVER');
      expect(next).toBe('STARTED');
    });

    it('transitions STARTED to COMPLETED via complete by DRIVER', () => {
      const next = PoolStateMachine.getNextStatus('STARTED', 'complete', 'DRIVER');
      expect(next).toBe('COMPLETED');
    });

    it('transitions OPEN to CANCELLED via cancel by PASSENGER or SYSTEM', () => {
      expect(PoolStateMachine.getNextStatus('OPEN', 'cancel', 'PASSENGER')).toBe('CANCELLED');
      expect(PoolStateMachine.getNextStatus('OPEN', 'cancel', 'SYSTEM')).toBe('CANCELLED');
    });

    it('transitions MATCHED to CANCELLED via cancel by PASSENGER or SYSTEM', () => {
      expect(PoolStateMachine.getNextStatus('MATCHED', 'cancel', 'PASSENGER')).toBe('CANCELLED');
      expect(PoolStateMachine.getNextStatus('MATCHED', 'cancel', 'SYSTEM')).toBe('CANCELLED');
    });
  });

  describe('PRD Section 6 invalid transition examples', () => {
    it('rejects COMPLETED -> STARTED (start)', () => {
      expect(() => PoolStateMachine.getNextStatus('COMPLETED', 'start', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects COMPLETED -> CANCELLED (cancel)', () => {
      expect(() => PoolStateMachine.getNextStatus('COMPLETED', 'cancel', 'PASSENGER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects STARTED -> MATCHED (backward progression)', () => {
      expect(() => PoolStateMachine.getNextStatus('STARTED', 'accept', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
      expect(() => PoolStateMachine.getNextStatus('STARTED', 'arrive', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects CANCELLED -> STARTED (start on terminal)', () => {
      expect(() => PoolStateMachine.getNextStatus('CANCELLED', 'start', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });
  });

  describe('Skipped and out-of-order transition rejection', () => {
    it('rejects OPEN -> arrive', () => {
      expect(() => PoolStateMachine.getNextStatus('OPEN', 'arrive', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects OPEN -> start', () => {
      expect(() => PoolStateMachine.getNextStatus('OPEN', 'start', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects OPEN -> complete', () => {
      expect(() => PoolStateMachine.getNextStatus('OPEN', 'complete', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects MATCHED -> start', () => {
      expect(() => PoolStateMachine.getNextStatus('MATCHED', 'start', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects MATCHED -> complete', () => {
      expect(() => PoolStateMachine.getNextStatus('MATCHED', 'complete', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects DRIVER_ARRIVED -> complete', () => {
      expect(() => PoolStateMachine.getNextStatus('DRIVER_ARRIVED', 'complete', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects DRIVER_ARRIVED -> cancel (cancel blocked once driver arrived per ADR D10)', () => {
      expect(() => PoolStateMachine.getNextStatus('DRIVER_ARRIVED', 'cancel', 'PASSENGER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects STARTED -> cancel', () => {
      expect(() => PoolStateMachine.getNextStatus('STARTED', 'cancel', 'PASSENGER')).toThrow(
        InvalidTransitionError
      );
    });
  });

  describe('Actor role authorization enforcement', () => {
    it('rejects DRIVER attempting cancel action on OPEN pool', () => {
      expect(() => PoolStateMachine.getNextStatus('OPEN', 'cancel', 'DRIVER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects PASSENGER attempting accept action on OPEN pool', () => {
      expect(() => PoolStateMachine.getNextStatus('OPEN', 'accept', 'PASSENGER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects PASSENGER attempting arrive action on MATCHED pool', () => {
      expect(() => PoolStateMachine.getNextStatus('MATCHED', 'arrive', 'PASSENGER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects PASSENGER attempting start action on DRIVER_ARRIVED pool', () => {
      expect(() => PoolStateMachine.getNextStatus('DRIVER_ARRIVED', 'start', 'PASSENGER')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects PASSENGER attempting complete action on STARTED pool', () => {
      expect(() => PoolStateMachine.getNextStatus('STARTED', 'complete', 'PASSENGER')).toThrow(
        InvalidTransitionError
      );
    });
  });

  describe('Terminal state immutability', () => {
    const allActions: PoolAction[] = ['accept', 'arrive', 'start', 'complete', 'cancel'];

    it('ensures COMPLETED has no legal outgoing transitions', () => {
      expect(PoolStateMachine.isTerminal('COMPLETED')).toBe(true);
      expect(PoolStateMachine.getAllowedActions('COMPLETED')).toEqual([]);

      for (const action of allActions) {
        expect(PoolStateMachine.canTransition('COMPLETED', action)).toBe(false);
        expect(() => PoolStateMachine.getNextStatus('COMPLETED', action)).toThrow(
          InvalidTransitionError
        );
      }
    });

    it('ensures CANCELLED has no legal outgoing transitions', () => {
      expect(PoolStateMachine.isTerminal('CANCELLED')).toBe(true);
      expect(PoolStateMachine.getAllowedActions('CANCELLED')).toEqual([]);

      for (const action of allActions) {
        expect(PoolStateMachine.canTransition('CANCELLED', action)).toBe(false);
        expect(() => PoolStateMachine.getNextStatus('CANCELLED', action)).toThrow(
          InvalidTransitionError
        );
      }
    });
  });

  describe('Helper methods', () => {
    it('canTransition returns true only for valid transitions', () => {
      expect(PoolStateMachine.canTransition('OPEN', 'accept', 'DRIVER')).toBe(true);
      expect(PoolStateMachine.canTransition('OPEN', 'cancel', 'PASSENGER')).toBe(true);
      expect(PoolStateMachine.canTransition('OPEN', 'start')).toBe(false);
      expect(PoolStateMachine.canTransition('MATCHED', 'arrive', 'DRIVER')).toBe(true);
      expect(PoolStateMachine.canTransition('MATCHED', 'start', 'DRIVER')).toBe(false);
    });

    it('getNextDriverAction returns single next operational action for active states', () => {
      expect(PoolStateMachine.getNextDriverAction('MATCHED')).toBe('arrive');
      expect(PoolStateMachine.getNextDriverAction('DRIVER_ARRIVED')).toBe('start');
      expect(PoolStateMachine.getNextDriverAction('STARTED')).toBe('complete');
      expect(PoolStateMachine.getNextDriverAction('OPEN')).toBeNull();
      expect(PoolStateMachine.getNextDriverAction('COMPLETED')).toBeNull();
      expect(PoolStateMachine.getNextDriverAction('CANCELLED')).toBeNull();
    });

    it('isTerminal returns correct boolean', () => {
      expect(PoolStateMachine.isTerminal('OPEN')).toBe(false);
      expect(PoolStateMachine.isTerminal('MATCHED')).toBe(false);
      expect(PoolStateMachine.isTerminal('DRIVER_ARRIVED')).toBe(false);
      expect(PoolStateMachine.isTerminal('STARTED')).toBe(false);
      expect(PoolStateMachine.isTerminal('COMPLETED')).toBe(true);
      expect(PoolStateMachine.isTerminal('CANCELLED')).toBe(true);
    });

    it('getAllowedActions lists allowable actions per state', () => {
      expect(PoolStateMachine.getAllowedActions('OPEN')).toEqual(['accept', 'cancel']);
      expect(PoolStateMachine.getAllowedActions('MATCHED')).toEqual(['arrive', 'cancel']);
      expect(PoolStateMachine.getAllowedActions('DRIVER_ARRIVED')).toEqual(['start']);
      expect(PoolStateMachine.getAllowedActions('STARTED')).toEqual(['complete']);
      expect(PoolStateMachine.getAllowedActions('COMPLETED')).toEqual([]);
      expect(PoolStateMachine.getAllowedActions('CANCELLED')).toEqual([]);
    });
  });
});
