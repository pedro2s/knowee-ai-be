import { Module } from '@nestjs/common';
import { DrizzleService } from './drizzle';

@Module({
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class DatabaseModule {}
