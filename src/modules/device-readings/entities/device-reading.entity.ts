import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum DeviceReadingType {
  VOLTAGE = 'VOLTAGE',
  CURRENT = 'CURRENT',
  TEMPERATURE = 'TEMPERATURE',
}

@Entity('device_readings')
export class DeviceReading {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    enum: DeviceReadingType,
    description: 'VOLTAGE|CURRENT|TEMPERATURE',
  })
  @Column({
    type: 'varchar',
    enum: DeviceReadingType,
    // Para PostgreSQL usar enum, para SQLite usar varchar
    transformer: {
      to: (value: DeviceReadingType) => value,
      from: (value: string) => value as DeviceReadingType,
    },
  })
  address: DeviceReadingType;

  @ApiProperty()
  @Column('float')
  value: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
