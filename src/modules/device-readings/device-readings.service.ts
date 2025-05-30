import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceReading } from './entities/device-reading.entity';
import { CreateDeviceReadingDto } from './dto/create-device-reading.dto';

@Injectable()
export class DeviceReadingsService {
    constructor(
        @InjectRepository(DeviceReading)
        private deviceReadingsRepository: Repository<DeviceReading>,
    ) {}

    async create(createDeviceReadingDto: CreateDeviceReadingDto): Promise<DeviceReading> {
        return this.deviceReadingsRepository.save(createDeviceReadingDto);
    }

    async findAll(): Promise<DeviceReading[]> {
        return await this.deviceReadingsRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async findLatest(): Promise<DeviceReading | null> {
        const readings = await this.deviceReadingsRepository.find({
            order: { createdAt: 'DESC' },
            take: 1
        });
        return readings.length > 0 ? readings[0] : null;
    }
}
