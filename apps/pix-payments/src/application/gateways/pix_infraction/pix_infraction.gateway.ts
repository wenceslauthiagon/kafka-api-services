import { CreateInfractionPixInfractionPspGateway } from './create_infraction.gateway';
import { CancelInfractionPixInfractionPspGateway } from './cancel_infraction.gateway';
import { CloseInfractionPixInfractionPspGateway } from './close_infraction.gateway';
import { GetInfractionPixInfractionPspGateway } from './get_infractions.gateway';

export type PixInfractionGateway = CreateInfractionPixInfractionPspGateway &
  CancelInfractionPixInfractionPspGateway &
  CloseInfractionPixInfractionPspGateway &
  GetInfractionPixInfractionPspGateway;
