import type { RidesRepository } from './rides.repository.js';
import type { LocationsService } from '../locations/locations.service.js';
import type { FareCalculator } from '../pools/domain/FareCalculator.js';
import type { RequestRideDto, EstimateResponseDto } from './rides.types.js';

export class RidesService {
  constructor(
    private readonly ridesRepo: RidesRepository,
    private readonly locationsService: LocationsService,
    private readonly fareCalculator: FareCalculator
  ) {}

  async calculateEstimate(dto: RequestRideDto): Promise<EstimateResponseDto> {
    const distanceM = await this.locationsService.getDistance(
      dto.pickupLocationId,
      dto.destLocationId
    );

    const soloFarePaisa = this.fareCalculator.calculateSoloFare(distanceM);

    return {
      pickupLocationId: dto.pickupLocationId,
      destLocationId: dto.destLocationId,
      distanceM,
      seats: dto.seats,
      soloFarePaisa,
      currency: 'BDT',
    };
  }
}

export default RidesService;
