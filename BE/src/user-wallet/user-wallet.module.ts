import { Module } from '@nestjs/common';
import { UserWalletService } from './user-wallet.service';
import { UserWalletController } from './user-wallet.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VnpayModule } from 'nestjs-vnpay';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    VnpayModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        vnpayHost:
          configService.get<string>('VNPAY_URL') ||
          'https://sandbox.vnpayment.vn',
        tmnCode:
          configService.get<string>('VNPAY_TMN_CODE') || 'DEFAULT_TMN_CODE',
        secureSecret:
          configService.get<string>('VNPAY_HASH_SECRET') ||
          'DEFAULT_HASH_SECRET',
        testMode: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UserWalletService],
  controllers: [UserWalletController],
  exports: [UserWalletService],
})
export class UserWalletModule {}
