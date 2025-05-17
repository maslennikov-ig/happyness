import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/module.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RequestsModule } from './modules/requests/requests.module';
import { ContractorsModule } from './modules/contractors/contractors.module';

@Module({
  imports: [
    // Загрузка переменных окружения
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Ядро приложения
    CoreModule.forRoot({
      isGlobal: true,
      coreVersion: '1.0.0',
      modulesPath: 'modules',
      autoloadModules: false,
    }),

    // Модули приложения
    AuthModule,
    UsersModule,
    ProjectsModule,
    RequestsModule,
    ContractorsModule,
  ],
})
export class AppModule {}
