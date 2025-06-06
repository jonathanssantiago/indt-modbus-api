import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { DeviceReadingType } from '../entities/device-reading.entity';

export class ReadingDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: 1,
  })
  @IsNumber()
  id!: number;

  @ApiProperty({
    enum: DeviceReadingType,
    description: 'VOLTAGE, CURRENT ou TEMPERATURE',
  })
  type: DeviceReadingType;

  @ApiProperty({
    description: 'Reading value',
    example: 23.5,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-03-10T15:30:00Z',
  })
  createdAt: Date;
}
