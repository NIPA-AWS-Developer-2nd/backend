import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// AWS SDK 모킹
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;
  let mockS3Client: jest.Mocked<S3Client>;

  const mockConfigValues = {
    AWS_REGION: 'ap-northeast-2',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    AWS_S3_BUCKET_NAME: 'test-bucket',
    AWS_CLOUDFRONT_DOMAIN: 'cdn.test.com',
  };

  beforeEach(async () => {
    // ConfigService 모킹
    const mockConfigService = {
      get: jest.fn((key: string) => mockConfigValues[key]),
    };

    // S3Client 모킹
    mockS3Client = {
      send: jest.fn(),
    } as any;

    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
      () => mockS3Client,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw error when required environment variables are missing', async () => {
      const mockConfigServiceWithMissingVars = {
        get: jest.fn((key: string) => {
          if (key === 'AWS_REGION') return undefined;
          return mockConfigValues[key];
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            S3Service,
            {
              provide: ConfigService,
              useValue: mockConfigServiceWithMissingVars,
            },
          ],
        }).compile(),
      ).rejects.toThrow(
        'AWS 환경변수가 설정되지 않았습니다. AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME을 확인해주세요.',
      );
    });
  });

  describe('generatePresignedUrl', () => {
    const mockPresignedUrl =
      'https://test-bucket.s3.amazonaws.com/test-key?signature=test';

    beforeEach(() => {
      (
        getSignedUrl as jest.MockedFunction<typeof getSignedUrl>
      ).mockResolvedValue(mockPresignedUrl);
    });

    it('should generate presigned URL successfully', async () => {
      const fileName = 'test-image.jpg';
      const contentType = 'image/jpeg';
      const folder = 'test-folder';

      const result = await service.generatePresignedUrl(
        fileName,
        contentType,
        folder,
      );

      expect(result).toEqual({
        uploadUrl: mockPresignedUrl,
        key: expect.stringMatching(/^test-folder\/[a-f0-9-]+\.jpg$/),
        publicUrl: expect.stringMatching(
          /^https:\/\/cdn\.test\.com\/test-folder\/[a-f0-9-]+\.jpg$/,
        ),
        expiresIn: 300,
      });

      // getSignedUrl이 올바른 인자들로 호출되었는지 확인
      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(Object), // PutObjectCommand 객체
        { expiresIn: 300 },
      );

      // 호출 횟수 확인
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('should generate presigned URL without folder', async () => {
      const fileName = 'test-image.png';
      const contentType = 'image/png';

      const result = await service.generatePresignedUrl(fileName, contentType);

      expect(result.key).toMatch(/^[a-f0-9-]+\.png$/);
      expect(result.publicUrl).toMatch(
        /^https:\/\/cdn\.test\.com\/[a-f0-9-]+\.png$/,
      );
    });

    it('should use S3 URL when CloudFront domain is not configured', async () => {
      // CloudFront 도메인이 없는 경우를 테스트하기 위해 새로운 서비스 인스턴스 생성
      const mockConfigServiceWithoutCDN = {
        get: jest.fn((key: string) => {
          if (key === 'AWS_CLOUDFRONT_DOMAIN') return undefined;
          return mockConfigValues[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: mockConfigServiceWithoutCDN,
          },
        ],
      }).compile();

      const serviceWithoutCDN = module.get<S3Service>(S3Service);

      const result = await serviceWithoutCDN.generatePresignedUrl(
        'test.jpg',
        'image/jpeg',
      );

      expect(result.publicUrl).toMatch(
        /^https:\/\/test-bucket\.s3\.ap-northeast-2\.amazonaws\.com\/[a-f0-9-]+\.jpg$/,
      );
    });

    it('should throw error for unsupported file type', async () => {
      await expect(
        service.generatePresignedUrl('test.txt', 'text/plain'),
      ).rejects.toThrow('지원하지 않는 이미지 형식입니다.');
    });

    it('should handle custom expiration time', async () => {
      const customExpiresIn = 600;

      await service.generatePresignedUrl(
        'test.jpg',
        'image/jpeg',
        undefined,
        customExpiresIn,
      );

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(Object),
        { expiresIn: customExpiresIn },
      );
    });

    it('should handle getSignedUrl error', async () => {
      const error = new Error('AWS SDK Error');
      (
        getSignedUrl as jest.MockedFunction<typeof getSignedUrl>
      ).mockRejectedValue(error);

      await expect(
        service.generatePresignedUrl('test.jpg', 'image/jpeg'),
      ).rejects.toThrow('Presigned URL 생성 실패: AWS SDK Error');
    });
  });

  describe('generateMultiplePresignedUrls', () => {
    it('should generate multiple presigned URLs', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.amazonaws.com/test-key?signature=test';
      (
        getSignedUrl as jest.MockedFunction<typeof getSignedUrl>
      ).mockResolvedValue(mockPresignedUrl);

      const fileInfos = [
        { fileName: 'image1.jpg', contentType: 'image/jpeg' },
        { fileName: 'image2.png', contentType: 'image/png' },
      ];

      const results = await service.generateMultiplePresignedUrls(
        fileInfos,
        'gallery',
      );

      expect(results).toHaveLength(2);
      expect(results[0].key).toMatch(/^gallery\/[a-f0-9-]+\.jpg$/);
      expect(results[1].key).toMatch(/^gallery\/[a-f0-9-]+\.png$/);
      expect(getSignedUrl).toHaveBeenCalledTimes(2);
    });

    it('should handle empty file array', async () => {
      const results = await service.generateMultiplePresignedUrls([]);
      expect(results).toEqual([]);
    });
  });

  describe('supported file types', () => {
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const unsupportedTypes = ['text/plain', 'application/pdf', 'video/mp4'];

    beforeEach(() => {
      (
        getSignedUrl as jest.MockedFunction<typeof getSignedUrl>
      ).mockResolvedValue('https://test-url.com');
    });

    test.each(supportedTypes)('should accept %s', async (contentType) => {
      await expect(
        service.generatePresignedUrl('test.file', contentType),
      ).resolves.toBeDefined();
    });

    test.each(unsupportedTypes)('should reject %s', async (contentType) => {
      await expect(
        service.generatePresignedUrl('test.file', contentType),
      ).rejects.toThrow('지원하지 않는 이미지 형식입니다.');
    });
  });
});
