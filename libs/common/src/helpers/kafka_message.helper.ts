import { KafkaContext } from '@nestjs/microservices';

/**
 * Message sent through kafka cluster.
 */
export abstract class KafkaMessage<T = any> {
  /**
   * Kafka message key.
   */
  private _key?: string;

  get key(): string {
    return this._key;
  }

  set key(key: string) {
    this._key = key;
  }

  /**
   * Kafka message headers.
   */
  private _headers?: any = {};

  get headers(): any {
    return this._headers;
  }

  set headers(headers: any) {
    this._headers = headers ?? {};
  }

  /**
   * Kafka message value.
   */
  private _value?: string;

  get value(): T {
    return JSON.parse(this._value);
  }

  set value(value: T) {
    this._value = JSON.stringify(value ?? {});
  }
}

export type KafkaResponse<T = any> = {
  value: T;
  ctx: KafkaContext;
};
