import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Check application health',
    description:
      'Returns the health status of the application, including database and Modbus connection status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application health status retrieved successfully.',
    type: Object,
  })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.healthService.checkDatabase(),
      () => this.healthService.checkModbus(),
    ]);
  }
}
