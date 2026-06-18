import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderEmailService } from './order-email.service';
import { AddressModule } from '../address/address.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { CouponModule } from '../coupon/coupon.module';
import { WalletModule } from '../wallet/wallet.module';
import { UserWalletModule } from '../user-wallet/user-wallet.module';

@Module({
  imports: [
    AddressModule,
    PrismaModule,
    DeliveryModule,
    PaymentModule,
    CouponModule,
    WalletModule,
    UserWalletModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderEmailService],
  exports: [OrderService],
})
export class OrderModule {}
