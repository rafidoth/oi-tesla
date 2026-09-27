import { InvalidTransitionError } from '../../../shared/errors/InvalidTransitionError.js';

export type PoolStatus =
  | 'OPEN'
  | 'MATCHED'
  | 'DRIVER_ARRIVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PoolAction = 'accept' | 'arrive' | 'start' | 'complete' | 'cancel';

export type ActorRole = 'DRIVER' | 'PASSENGER' | 'SYSTEM';

interface TransitionDefinition {
  targetStatus: PoolStatus;
  allowedRoles: ActorRole[];
}

const TRANSITIONS: Record<PoolStatus, Partial<Record<PoolAction, TransitionDefinition>>> = {
  OPEN: {
    accept: { targetStatus: 'MATCHED', allowedRoles: ['DRIVER'] },
    cancel: { targetStatus: 'CANCELLED', allowedRoles: ['PASSENGER', 'SYSTEM'] },
  },
  MATCHED: {
    arrive: { targetStatus: 'DRIVER_ARRIVED', allowedRoles: ['DRIVER'] },
    cancel: { targetStatus: 'CANCELLED', allowedRoles: ['PASSENGER', 'SYSTEM'] },
  },
  DRIVER_ARRIVED: {
    start: { targetStatus: 'STARTED', allowedRoles: ['DRIVER'] },
  },
  STARTED: {
    complete: { targetStatus: 'COMPLETED', allowedRoles: ['DRIVER'] },
  },
  COMPLETED: {},
  CANCELLED: {},
};

export class PoolStateMachine {
  static getNextStatus(
    currentStatus: PoolStatus,
    action: PoolAction,
    actorRole?: ActorRole
  ): PoolStatus {
    const transition = this.lookupTransition(currentStatus, action);
    this.assertActorAuthorized(currentStatus, action, transition, actorRole);
    return transition.targetStatus;
  }

  static canTransition(
    currentStatus: PoolStatus,
    action: PoolAction,
    actorRole?: ActorRole
  ): boolean {
    const transition = TRANSITIONS[currentStatus]?.[action];
    if (!transition) {
      return false;
    }
    if (actorRole && !transition.allowedRoles.includes(actorRole)) {
      return false;
    }
    return true;
  }

  static getAllowedActions(currentStatus: PoolStatus): PoolAction[] {
    const actionsMap = TRANSITIONS[currentStatus];
    return actionsMap ? (Object.keys(actionsMap) as PoolAction[]) : [];
  }

  static isTerminal(status: PoolStatus): boolean {
    return status === 'COMPLETED' || status === 'CANCELLED';
  }

  static getNextDriverAction(currentStatus: PoolStatus): PoolAction | null {
    switch (currentStatus) {
      case 'MATCHED':
        return 'arrive';
      case 'DRIVER_ARRIVED':
        return 'start';
      case 'STARTED':
        return 'complete';
      default:
        return null;
    }
  }

  private static lookupTransition(
    currentStatus: PoolStatus,
    action: PoolAction
  ): TransitionDefinition {
    const transition = TRANSITIONS[currentStatus]?.[action];
    if (!transition) {
      throw new InvalidTransitionError(
        'INVALID_STATE_TRANSITION',
        `Invalid transition from ${currentStatus} via action '${action}'`,
        {
          currentStatus,
          action,
          allowedActions: this.getAllowedActions(currentStatus),
        }
      );
    }
    return transition;
  }

  private static assertActorAuthorized(
    currentStatus: PoolStatus,
    action: PoolAction,
    transition: TransitionDefinition,
    actorRole?: ActorRole
  ): void {
    if (actorRole && !transition.allowedRoles.includes(actorRole)) {
      throw new InvalidTransitionError(
        'INVALID_STATE_TRANSITION',
        `Actor role '${actorRole}' is not permitted to execute '${action}' from ${currentStatus}`,
        {
          currentStatus,
          action,
          actorRole,
          allowedRoles: transition.allowedRoles,
        }
      );
    }
  }
}

export default PoolStateMachine;
