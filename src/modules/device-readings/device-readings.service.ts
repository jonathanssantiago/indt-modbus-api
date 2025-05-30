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

    async findLatestByAddress(address: number): Promise<DeviceReading | null> {
        return this.deviceReadingsRepository.findOne({
            where: { address },
            order: { createdAt: 'DESC' }
        });
    }

    async findHistoryByAddress(address: number): Promise<DeviceReading[]> {
        return this.deviceReadingsRepository.find({
            where: { address },
            order: { createdAt: 'DESC' },
            take: 100
        });
    }

    async findAll(): Promise<DeviceReading[]> {
        return this.deviceReadingsRepository.find();
    }
}
