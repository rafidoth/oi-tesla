export interface PoolProps {
  id: string;
  pickupLocationId: number;
  status: string;
  driverId?: string | null;
  vehicleId?: string | null;
  capacity: number;
  occupiedSeats: number;
  createdAt: Date;
  updatedAt?: Date;
}

export class Pool {
  constructor(private readonly props: PoolProps) {}

  get id(): string {
    return this.props.id;
  }

  get pickupLocationId(): number {
    return this.props.pickupLocationId;
  }

  get status(): string {
    return this.props.status;
  }

  get driverId(): string | null {
    return this.props.driverId ?? null;
  }

  get vehicleId(): string | null {
    return this.props.vehicleId ?? null;
  }

  get capacity(): number {
    return this.props.capacity;
  }

  get occupiedSeats(): number {
    return this.props.occupiedSeats;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt ?? this.props.createdAt;
  }

  canJoin(seats: number): boolean {
    return (
      (this.props.status === 'OPEN' || this.props.status === 'MATCHED') &&
      this.props.occupiedSeats + seats <= this.props.capacity
    );
  }

  canAccept(vehicleCapacity: number): boolean {
    return this.props.status === 'OPEN' && vehicleCapacity >= this.props.occupiedSeats;
  }
}

export default Pool;
