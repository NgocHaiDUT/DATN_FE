import { Module } from '@nestjs/common';
import { ApiLogsController } from './api-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ApiLogsController],
})
export class ApiLogsModule {}
