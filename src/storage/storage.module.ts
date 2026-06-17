import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_STRATEGY } from './constants/storage.constants';
import { LocalStorageStrategy } from './strategies/local-storage.strategy';
import { S3StorageStrategy } from './strategies/s3-storage.strategy';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_STRATEGY,
      useFactory: (configService: ConfigService) => {
        const driver = configService.get<string>('STORAGE_DRIVER', 'local');

        switch (driver) {
          case 's3':
            return new S3StorageStrategy(configService);
          case 'local':
          default:
            return new LocalStorageStrategy(configService);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_STRATEGY],
})
export class StorageModule {}