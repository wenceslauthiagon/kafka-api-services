// import { Logger } from 'winston';

/**
 * Event model.
 */
export interface DefaultEvent<DATA = any> {
  name: string;
  data?: DATA;
}

/**
 * Event emitter definition.
 */
export interface DefaultEventEmitter {
  // /**
  //  * TODO: precisa alterar em todos os emitters antes de adicionar aqui!
  //  * @param id Request ID.
  //  * @param emitter Final event emitter (ex: KafkaEventEmitter).
  //  * @param logger Global logger.
  //  */
  // new (id: string, logger: Logger, emitter?: DefaultEventEmitter);

  /**
   * Fire event.
   * @param event The event.
   */
  emit(event: DefaultEvent): Promise<void> | void;
}
