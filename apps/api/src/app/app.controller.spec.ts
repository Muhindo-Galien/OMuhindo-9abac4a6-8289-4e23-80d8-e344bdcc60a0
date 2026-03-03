import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  const mockAppService = {
    getHello: jest.fn(),
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHello', () => {
    it('should return hello message from service', () => {
      const expectedResult = {
        status: 'ok',
        message: 'Secure Task Management API is running successfully!',
      };

      mockAppService.getHello.mockReturnValue(expectedResult);

      const result = controller.getHello();

      expect(service.getHello).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getHealth', () => {
    it('should return health status from service', () => {
      const expectedResult = {
        status: 'ok',
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      mockAppService.getHealth.mockReturnValue(expectedResult);

      const result = controller.getHealth();

      expect(service.getHealth).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});
