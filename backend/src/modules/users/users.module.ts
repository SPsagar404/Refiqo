import { Module } from '@nestjs/common';
import { SkillsModule } from '../skills/skills.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SkillsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
