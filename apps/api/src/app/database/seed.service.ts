import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InitialSeedService } from '../../database/seeds/initial-seed';

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService
  ) {}

  async onApplicationBootstrap() {
    // Only run seeds in development mode
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    
    if (environment === 'development') {
      console.log('🌱 Running development seeds...');
      
      try {
        const seedService = new InitialSeedService(this.dataSource);
        await seedService.run();
      } catch (error) {
        console.error('❌ Error during seeding:', error);
        // Don't crash the app if seeding fails
      }
    }
  }
} 