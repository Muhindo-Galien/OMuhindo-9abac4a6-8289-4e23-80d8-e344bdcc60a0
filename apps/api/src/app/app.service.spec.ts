import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return hello message with ok status', () => {
      const result = service.getHello();

      expect(result).toEqual({
        status: 'ok',
        message: 'Secure Task Management API is running successfully!',
      });
    });

    it('should always return status as ok', () => {
      const result = service.getHello();
      expect(result.status).toBe('ok');
    });
  });

  describe('getHealth', () => {
    it('should return health status with ok status', () => {
      const result = service.getHealth();

      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return a valid ISO timestamp', () => {
      const result = service.getHealth();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return current timestamp within reasonable range', () => {
      const before = new Date().getTime();
      const result = service.getHealth();
      const after = new Date().getTime();
      const resultTime = new Date(result.timestamp).getTime();

      expect(resultTime).toBeGreaterThanOrEqual(before);
      expect(resultTime).toBeLessThanOrEqual(after);
    });
  });
});
