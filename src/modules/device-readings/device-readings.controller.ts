import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DeviceReadingsService } from './device-readings.service';
import { DeviceReadingPresenter } from './presenters/device-reading.presenter';
import { ModbusStatusPresenter } from './presenters/modbus-status.presenter';

@ApiTags('device-readings')
@Controller('device-readings')
export class DeviceReadingsController {
  constructor(private readonly deviceReadingsService: DeviceReadingsService) {}

  @Get('last-reading')
  @ApiOperation({ summary: 'Obter a última leitura' })
  @ApiResponse({
    status: 200,
    description: 'Última leitura retornada com sucesso.',
    type: DeviceReadingPresenter,
  })
  async getLastReading(): Promise<DeviceReadingPresenter | null> {
    const reading = await this.deviceReadingsService.findLatest();
    return reading ? DeviceReadingPresenter.toPresenter(reading) : null;
  }

  @Get('history')
  @ApiOperation({ summary: 'Obter histórico de leituras' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de itens por página (padrão: 10, máximo: 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de leituras retornado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/DeviceReadingPresenter' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total de registros' },
            page: { type: 'number', description: 'Página atual' },
            limit: { type: 'number', description: 'Itens por página' },
            totalPages: { type: 'number', description: 'Total de páginas' },
          },
        },
      },
    },
  })
  async getHistory(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<{
    data: DeviceReadingPresenter[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const { readings, total } =
      await this.deviceReadingsService.findAllPaginated(
        pageNumber,
        limitNumber,
      );

    const totalPages = Math.ceil(total / limitNumber);

    return {
      data: DeviceReadingPresenter.toPresenterArray(readings),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
      },
    };
  }

  @Get('modbus-status')
  @ApiOperation({
    summary: 'Obter status da conexão',
    description:
      'Retorna o status atual da conexão Modbus, incluindo informações sobre a conectividade do dispositivo',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da conexão retornado com sucesso.',
    type: ModbusStatusPresenter,
  })
  @ApiResponse({
    status: 503,
    description: 'Serviço Modbus indisponível',
  })
  async getStatus(): Promise<ModbusStatusPresenter> {
    const statusService =
      await this.deviceReadingsService.statusModbusService();
    return statusService;
  }
}
