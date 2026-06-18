import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiLoggingInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    if (!req) return next.handle();

    const method: string = req.method ?? '';
    const path: string = req.originalUrl ?? req.url ?? '';
    const ip: string =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      '';
    const userAgent: string = (req.headers?.['user-agent'] as string) ?? '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(ctx, method, path, ip, userAgent, startTime, req),
        error: () => this.log(ctx, method, path, ip, userAgent, startTime, req),
      }),
    );
  }

  private log(
    ctx: ReturnType<ExecutionContext['switchToHttp']>,
    method: string,
    path: string,
    ip: string,
    userAgent: string,
    startTime: number,
    req: any,
  ) {
    const res = ctx.getResponse();
    const statusCode: number = res?.statusCode ?? 0;
    const duration = Date.now() - startTime;
    const userId: number | null = req.user?.userId ?? null;

    // Fire-and-forget: không block response
    this.prisma.api_logs
      .create({
        data: {
          method: method.substring(0, 10),
          path: path.substring(0, 2048),
          status_code: statusCode,
          user_id: userId,
          ip: ip.substring(0, 64),
          user_agent: userAgent.substring(0, 512),
          duration_ms: duration,
        },
      })
      .catch(() => {
        // Silent fail: không để lỗi logging phá vỡ ứng dụng
      });
  }
}
