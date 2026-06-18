import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ProfileModule } from './profile/profile.module';
import { MessagesModule } from './messages/messages.module';
import { MakeupModule } from './makeup/makeup.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { HttpModule } from '@nestjs/axios';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { DataInitModule } from './data-init/data-init.module';
import { ShopModule } from './shop/shop.module';
import { OrderModule } from './order/order.module';
import { AddressModule } from './address/address.module';
import { DeliveryModule } from './delivery/delivery.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UsersModule } from './users/users.module';
import { RangeRequestMiddleware } from './middleware/range-request.middleware';
import { SearchModule } from './search/search.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentController } from './payment/payment.controller';
import { PaymentModule } from './payment/payment.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SoftDeleteCleanupService } from './common/tasks/soft-delete-cleanup.service';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ApiLoggingInterceptor } from './common/interceptors/api-logging.interceptor';
import { ApiLogsModule } from './api-logs/api-logs.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CouponModule } from './coupon/coupon.module';
import { WalletModule } from './wallet/wallet.module';
import { UserWalletModule } from './user-wallet/user-wallet.module';
import { TrashModule } from './trash/trash.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    AuthModule,
    MailerModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
      useFactory: async (ConfigService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: ConfigService.get<string>('EMAIL_USER'),
            pass: ConfigService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: '"No Reply" <no-reply@localhost>',
        },
        preview: true,
        template: {
          dir: process.cwd() + '/template/',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    ProfileModule,
    MessagesModule,
    MakeupModule,
    NotificationsModule,
    ChatModule,
    ProductModule,
    CartModule,
    DataInitModule,
    OrderModule,
    AddressModule,
    SearchModule,
    ReviewsModule,

    HttpModule.register({
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024,
    }),
    ShopModule,
    DeliveryModule,
    AnalyticsModule,
    UsersModule,
    PaymentModule,
    ChatbotModule,
    ApiLogsModule,
    CouponModule,
    WalletModule,
    UserWalletModule,
    TrashModule,
  ],
  controllers: [AppController, PaymentController],
  providers: [
    AppService,
    PrismaService,
    SoftDeleteCleanupService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiLoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RangeRequestMiddleware).forRoutes('uploads/*');
  }
}
