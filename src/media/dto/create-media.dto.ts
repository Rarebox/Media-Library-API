import { ApiProperty } from '@nestjs/swagger';

export class CreateMediaDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
