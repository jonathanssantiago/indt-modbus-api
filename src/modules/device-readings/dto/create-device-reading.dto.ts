import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateDeviceReadingDto {
  @ApiProperty({
    description: 'The Modbus device address',
  })
  @IsNumber()
  address: number;

  @ApiProperty({
    description: 'The reading value',
    example: 23.5,
  })
  @IsNumber()
  value: number;
} 