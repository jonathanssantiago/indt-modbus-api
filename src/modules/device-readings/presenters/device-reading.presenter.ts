import { ApiProperty } from '@nestjs/swagger';
import {
  DeviceReading,
  DeviceReadingType,
} from '../entities/device-reading.entity';

export class DeviceReadingPresenter {
  @ApiProperty({
    description: 'The unique identifier of the device reading',
    example: 1,
  })
  id: number;

  @ApiProperty({
    enum: DeviceReadingType,
    description: 'Endereço da leitura: VOLTAGE, CURRENT ou TEMPERATURE',
  })
  address: DeviceReadingType;

  @ApiProperty({
    description: 'The value read from the device',
    example: 23.5,
  })
  value: number;

  @ApiProperty({
    description: 'The timestamp when the reading was taken',
    example: '2024-03-10T15:30:00.000Z',
  })
  createdAt: Date;

  constructor(deviceReading: DeviceReading) {
    this.id = deviceReading.id;
    this.address = deviceReading.address;
    this.value = deviceReading.value;
    this.createdAt = deviceReading.createdAt;
  }

  static toPresenter(deviceReading: DeviceReading): DeviceReadingPresenter {
    return new DeviceReadingPresenter(deviceReading);
  }

  static toPresenterArray(
    deviceReadings: DeviceReading[],
  ): DeviceReadingPresenter[] {
    return deviceReadings.map((reading) => new DeviceReadingPresenter(reading));
  }
}
