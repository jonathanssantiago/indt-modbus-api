import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ReadingDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: 1,
  })
  @IsNumber()
  id!: number;

  @ApiProperty({
    description: 'Modbus device address',
    example: 1,
  })
  @IsNumber()
  address: number;

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
