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
import { DeviceReadingPresenter } from './presenters/device-reading.presenter';

@ApiTags('device-readings')
@Controller('device-readings')
export class DeviceReadingsController {
  constructor(private readonly deviceReadingsService: DeviceReadingsService) {}

  @Get('last-reading')
  @ApiOperation({ summary: 'Obter a última leitura' })
  @ApiResponse({
    status: 200,
    description: 'Última leitura retornada com sucesso.',
    type: DeviceReadingPresenter
  })
  async getLastReading(): Promise<DeviceReadingPresenter | null> {
    const reading = await this.deviceReadingsService.findLatest();
    return reading ? DeviceReadingPresenter.toPresenter(reading) : null;
  }

  @Get('history')
  @ApiOperation({ summary: 'Obter histórico de leituras' })
  @ApiResponse({
    status: 200,
    description: 'Histórico de leituras retornado com sucesso.',
    type: [DeviceReadingPresenter]
  })
  async getHistory(): Promise<DeviceReadingPresenter[]> {
    const readings = await this.deviceReadingsService.findAll();
    return DeviceReadingPresenter.toPresenterArray(readings);
  }

  @Get('status')
  @ApiOperation({ summary: 'Obter status da conexão' })
  @ApiResponse({
    status: 200,
    description: 'Status da conexão retornado com sucesso.',
    type: 'object'
  })
  getStatus(): { status: string } {
    return { status: 'ok' };
  }
} 