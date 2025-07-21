import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { FieldAccessInterceptor, FieldFilterService } from '../interceptors/field-access.interceptor';
import { CaslAbilityFactory } from '../factories/casl-ability.factory';
import { Reflector } from '@nestjs/core';

describe('FieldAccessInterceptor', () => {
  let interceptor: FieldAccessInterceptor;
  let caslAbilityFactory: CaslAbilityFactory;
  let reflector: Reflector;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockAbility = {
    can: jest.fn(),
    fieldPermissions: new Map([
      ['Product', {
        readable: ['id', 'name', 'price'],
        denied: ['costPrice', 'profitMargin'],
      }],
      ['Customer', {
        readable: ['id', 'name', 'email'],
        denied: ['ssn', 'creditScore'],
      }],
    ]),
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: mockUser,
        organizationId: 'org-123',
        query: { organizationId: 'org-123' },
      }),
    }),
    getHandler: () => jest.fn(),
  } as unknown as ExecutionContext;

  const mockCallHandler: CallHandler = {
    handle: () => of(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldAccessInterceptor,
        {
          provide: CaslAbilityFactory,
          useValue: {
            createForUser: jest.fn().mockResolvedValue(mockAbility),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<FieldAccessInterceptor>(FieldAccessInterceptor);
    caslAbilityFactory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('intercept', () => {
    it('should not filter when field permissions not enabled', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(false);
      
      const testData = { id: 1, name: 'Test', secret: 'hidden' };
      mockCallHandler.handle = () => of(testData);

      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ).toPromise();

      expect(result).toEqual(testData);
      expect(caslAbilityFactory.createForUser).not.toHaveBeenCalled();
    });

    it('should filter single object based on field permissions', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('Product');
      
      const product = {
        id: 'prod-1',
        name: 'Test Product',
        price: 99.99,
        costPrice: 50.00, // Should be filtered
        profitMargin: 0.5, // Should be filtered
        description: 'A test product',
      };
      
      mockCallHandler.handle = () => of(product);

      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ).toPromise();

      expect(result).toEqual({
        id: 'prod-1',
        name: 'Test Product',
        price: 99.99,
      });
      
      expect(result).not.toHaveProperty('costPrice');
      expect(result).not.toHaveProperty('profitMargin');
    });

    it('should filter array of objects', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('Customer');
      
      const customers = [
        {
          id: 'cust-1',
          name: 'John Doe',
          email: 'john@example.com',
          ssn: '123-45-6789', // Should be filtered
          creditScore: 750, // Should be filtered
        },
        {
          id: 'cust-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          ssn: '987-65-4321', // Should be filtered
          creditScore: 800, // Should be filtered
        },
      ];
      
      mockCallHandler.handle = () => of(customers);

      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ).toPromise();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'cust-1',
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(result[1]).toEqual({
        id: 'cust-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
      });
    });

    it('should handle nested response structures', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('Product');
      
      const response = {
        data: {
          id: 'prod-1',
          name: 'Test Product',
          price: 99.99,
          costPrice: 50.00, // Should be filtered
        },
        meta: {
          total: 1,
        },
      };
      
      mockCallHandler.handle = () => of(response);

      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ).toPromise();

      // The interceptor filters the data property
      expect(result.data).toEqual({
        id: 'prod-1',
        name: 'Test Product',
        price: 99.99,
      });
      expect(result.meta).toEqual({ total: 1 });
    });

    it('should store ability in request for downstream use', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('Product');
      
      const request = {
        user: mockUser,
        organizationId: 'org-123',
        query: { organizationId: 'org-123' },
      };
      
      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => jest.fn(),
      } as unknown as ExecutionContext;

      await interceptor.intercept(context, mockCallHandler).toPromise();

      expect(request).toHaveProperty('caslAbility');
      expect(request['caslAbility']).toBe(mockAbility);
    });
  });
});

describe('FieldFilterService', () => {
  let service: FieldFilterService;
  let caslAbilityFactory: CaslAbilityFactory;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockAbility = {
    can: jest.fn(),
    fieldPermissions: new Map([
      ['Product', {
        writable: ['name', 'price', 'description'],
        denied: ['id', 'costPrice'],
      }],
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldFilterService,
        {
          provide: CaslAbilityFactory,
          useValue: {
            createForUser: jest.fn().mockResolvedValue(mockAbility),
          },
        },
      ],
    }).compile();

    service = module.get<FieldFilterService>(FieldFilterService);
    caslAbilityFactory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
  });

  describe('filterFieldsForWrite', () => {
    it('should filter fields based on write permissions', async () => {
      const data = {
        id: 'prod-1', // Should be filtered (denied)
        name: 'Updated Product',
        price: 199.99,
        description: 'Updated description',
        costPrice: 100, // Should be filtered (denied)
        extraField: 'value', // Should be filtered (not in writable)
      };

      const result = await service.filterFieldsForWrite(
        mockUser,
        'org-123',
        'Product',
        data,
      );

      expect(result).toEqual({
        name: 'Updated Product',
        price: 199.99,
        description: 'Updated description',
      });
    });

    it('should return all non-denied fields when writable not specified', async () => {
      const abilityWithoutWritable = {
        can: jest.fn(),
        fieldPermissions: new Map([
          ['Customer', {
            denied: ['ssn', 'creditScore'],
          }],
        ]),
      };

      jest.spyOn(caslAbilityFactory, 'createForUser').mockResolvedValue(abilityWithoutWritable as any);

      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        ssn: '123-45-6789', // Should be filtered
        creditScore: 750, // Should be filtered
      };

      const result = await service.filterFieldsForWrite(
        mockUser,
        'org-123',
        'Customer',
        data,
      );

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
      });
    });
  });

  describe('canReadFields', () => {
    it('should check read permissions for specific fields', async () => {
      const readableAbility = {
        can: jest.fn(),
        fieldPermissions: new Map([
          ['Product', {
            readable: ['id', 'name', 'price'],
            denied: ['costPrice'],
          }],
        ]),
      };

      jest.spyOn(caslAbilityFactory, 'createForUser').mockResolvedValue(readableAbility as any);

      const fields = ['id', 'name', 'price', 'costPrice', 'description'];
      const result = await service.canReadFields(
        mockUser,
        'org-123',
        'Product',
        fields,
      );

      expect(result).toEqual([
        { field: 'id', allowed: true },
        { field: 'name', allowed: true },
        { field: 'price', allowed: true },
        { field: 'costPrice', allowed: false },
        { field: 'description', allowed: false }, // Not in readable list
      ]);
    });

    it('should allow all fields when no permissions specified', async () => {
      const noPermAbility = {
        can: jest.fn(),
        fieldPermissions: new Map(),
      };

      jest.spyOn(caslAbilityFactory, 'createForUser').mockResolvedValue(noPermAbility as any);

      const fields = ['id', 'name', 'anyField'];
      const result = await service.canReadFields(
        mockUser,
        'org-123',
        'SomeResource',
        fields,
      );

      expect(result).toEqual([
        { field: 'id', allowed: true },
        { field: 'name', allowed: true },
        { field: 'anyField', allowed: true },
      ]);
    });
  });
});