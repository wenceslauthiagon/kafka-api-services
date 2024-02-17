import { IsOptional, IsString, IsUUID } from 'class-validator';
import { FiltersRequest, TFiltersRequest } from './default';

type TTransactionExportsRequest = TFiltersRequest;

export class TransactionExportsRequest
  extends FiltersRequest
  implements TTransactionExportsRequest
{
  @IsUUID(4)
  @IsOptional()
  uuid?: string;

  @IsOptional()
  @IsString()
  end_to_end?: string;

  constructor(props: TTransactionExportsRequest) {
    super(props);
  }
}
