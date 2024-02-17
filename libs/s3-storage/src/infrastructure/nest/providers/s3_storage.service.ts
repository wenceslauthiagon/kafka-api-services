import { S3Client } from '@aws-sdk/client-s3';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { InjectLogger, MissingEnvVarException } from '@zro/common';
import {
  S3StorageGateway,
  S3GatewayConfig,
} from '@zro/s3-storage/infrastructure';

@Injectable()
export class S3StorageService {
  private readonly awsAccessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly bucketName: string;
  private readonly regionName: string;
  private readonly s3: S3Client;

  constructor(
    private readonly configService: ConfigService<S3GatewayConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.awsAccessKeyId = this.configService.get<string>(
      'APP_AWS_ACCESS_KEY_ID',
    );
    this.secretAccessKey = this.configService.get<string>(
      'APP_AWS_SECRET_ACCESS_KEY',
    );

    this.bucketName = this.configService.get<string>('APP_AWS_BUCKET_NAME');

    this.regionName = this.configService.get<string>('APP_AWS_REGION_NAME');

    if (
      !this.awsAccessKeyId ||
      !this.secretAccessKey ||
      !this.bucketName ||
      !this.regionName
    ) {
      throw new MissingEnvVarException([
        ...(!this.awsAccessKeyId ? ['APP_AWS_ACCESS_KEY_ID'] : []),
        ...(!this.secretAccessKey ? ['APP_AWS_SECRET_ACCESS_KEY'] : []),
        ...(!this.bucketName ? ['APP_AWS_BUCKET_NAME'] : []),
        ...(!this.regionName ? ['APP_AWS_REGION_NAME'] : []),
      ]);
    }

    this.s3 = new S3Client({
      region: this.regionName,
      credentials: {
        accessKeyId: this.awsAccessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  getS3StorageGateway(logger?: Logger): S3StorageGateway {
    return new S3StorageGateway(
      logger ?? this.logger,
      this.bucketName,
      this.s3,
    );
  }
}
