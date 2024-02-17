import { ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorDescriptionRestResponse {
  @ApiPropertyOptional({
    description: 'Descrição do erro.',
    example: null,
  })
  description?: string;
}

export class LinksRestReponse {
  @ApiPropertyOptional({
    description: 'First.',
    example: 'http://localhost:81/api/transactions/deposit?page=1',
  })
  first?: string;

  @ApiPropertyOptional({
    description: 'Last.',
    example: 'http://localhost:81/api/transactions/deposit?page=3',
  })
  last?: string;

  @ApiPropertyOptional({
    description: 'Prev.',
    example: null,
  })
  prev?: string;

  @ApiPropertyOptional({
    description: 'Next.',
    example: 'http://localhost:81/api/transactions/deposit?page=2',
  })
  next?: string;
}

export class LinkRestResponse {
  @ApiPropertyOptional({
    description: 'Url.',
    example: null,
  })
  url?: string;

  @ApiPropertyOptional({
    description: 'Label.',
    example: '&laquo; Previous',
  })
  label?: string;

  @ApiPropertyOptional({
    description: 'Active.',
    example: false,
  })
  active?: boolean;
}

export class MetaRestResponse {
  @ApiPropertyOptional({
    description: 'Current page.',
    example: 1,
  })
  current_page?: number;

  @ApiPropertyOptional({
    description: 'From page.',
    example: 1,
  })
  from?: number;

  @ApiPropertyOptional({
    description: 'Last page.',
    example: 29,
  })
  last_page?: number;

  @ApiPropertyOptional({
    description: 'Links.',
    example: [LinkRestResponse],
  })
  links?: LinkRestResponse[];

  @ApiPropertyOptional({
    description: 'Path.',
    example: 'http://localhost:81/api/transactions/deposit',
  })
  path?: string;

  @ApiPropertyOptional({
    description: 'Per page.',
    example: 15,
  })
  per_page?: number;

  @ApiPropertyOptional({
    description: 'To.',
    example: 15,
  })
  to?: number;

  @ApiPropertyOptional({
    description: 'Total.',
    example: 435,
  })
  total?: number;
}
