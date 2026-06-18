import { Module } from '@nestjs/common';
import { MakeupService } from './makeup.service';
import { MakeupController } from './makeup.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [PrismaModule, CouponModule],
  providers: [MakeupService],
  controllers: [MakeupController],
})
export class MakeupModule {}
