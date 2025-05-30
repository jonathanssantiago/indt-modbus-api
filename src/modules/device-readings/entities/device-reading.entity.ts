import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('device_readings')
export class DeviceReading {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  address: number;

  @ApiProperty()
  @Column('float')
  value: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
} 