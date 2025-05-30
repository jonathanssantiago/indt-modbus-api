import {
  Controller,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DeviceReadingsService } from './device-readings.service';
import { DeviceReading } from './entities/device-reading.entity';

@ApiTags('device-readings')
@Controller('device-readings')
export class DeviceReadingsController {
  constructor(private readonly deviceReadingsService: DeviceReadingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all device readings' })
  @ApiResponse({ status: 200, description: 'Return all device readings.' })
  async findAll(): Promise<DeviceReading[]> {
    return this.deviceReadingsService.findAll();
  }

} 