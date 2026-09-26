export type DerivedRideStatus =
  | 'REQUESTED'
  | 'MATCHED'
  | 'DRIVER_ARRIVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface RideProps {
  id: string;
  rideRequestId: string;
  passengerId: string;
  poolId: string;
  seats: number;
  farePaisa: number | null;
  cancelledAt: Date | null;
  cancelReason?: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  poolStatus: string;
}

export class Ride {
  constructor(private readonly props: RideProps) {}

  get id(): string {
    return this.props.id;
  }

  get rideRequestId(): string {
    return this.props.rideRequestId;
  }

  get passengerId(): string {
    return this.props.passengerId;
  }

  get poolId(): string {
    return this.props.poolId;
  }

  get seats(): number {
    return this.props.seats;
  }

  get farePaisa(): number | null {
    return this.props.farePaisa;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get cancelReason(): string | null | undefined {
    return this.props.cancelReason;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get poolStatus(): string {
    return this.props.poolStatus;
  }

  get status(): DerivedRideStatus {
    if (this.props.cancelledAt !== null) {
      return 'CANCELLED';
    }

    switch (this.props.poolStatus) {
      case 'OPEN':
        return 'REQUESTED';
      case 'MATCHED':
        return 'MATCHED';
      case 'DRIVER_ARRIVED':
        return 'DRIVER_ARRIVED';
      case 'STARTED':
        return 'STARTED';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'REQUESTED';
    }
  }

  get isCancellable(): boolean {
    return this.status === 'REQUESTED' || this.status === 'MATCHED';
  }
}

export default Ride;
