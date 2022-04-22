import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config } from './orm.config';
import { LandModule } from './land/land.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(config),
    LandModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
