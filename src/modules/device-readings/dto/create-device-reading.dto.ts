import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { DeviceReadingType } from '../entities/device-reading.entity';

export class CreateDeviceReadingDto {
  @ApiProperty({
    enum: DeviceReadingType,
  })
  @IsEnum(DeviceReadingType)
  type: DeviceReadingType;

  @ApiProperty({
    description: 'The reading value',
    example: 23.5,
  })
  @IsNumber()
  value: number;
}
