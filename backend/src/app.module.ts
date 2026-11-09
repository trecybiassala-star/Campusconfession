import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CampusesModule } from './campuses/campuses.module';
import { CommentsModule } from './comments/comments.module';
import { ConfessionsModule } from './confessions/confessions.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReactionsModule } from './reactions/reactions.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [PrismaModule, ConfessionsModule, ReactionsModule, CommentsModule, ReportsModule, CampusesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
