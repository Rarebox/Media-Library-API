import { IsMongoId, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionsDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;

  @ApiProperty({ enum: ['add', 'remove'] })
  @IsIn(['add', 'remove'])
  action: string;
}
