import { HandleEmailDeadLetterUseCase } from '@zro/notifications/application';
import { Email, EmailRepository } from '@zro/notifications/domain';
import { Logger } from 'winston';
import {
  EmailEventEmitterController,
  EmailEventEmitterControllerImpl,
} from '@zro/notifications/interface';

type HandleEmailCreatedResponse = Pick<Email, 'id' | 'to' | 'from' | 'state'>;

type HandleEmailDeadLetterResponse = Pick<
  Email,
  'id' | 'to' | 'from' | 'state'
>;

/**
 * Create an output DTO.
 *
 * @param email The e-mail.
 * @returns Dead letter e-mail data.
 */
export function handleEmailDeadLetterPresenter(
  email: Email,
): HandleEmailCreatedResponse {
  if (!email) return null;

  const response: HandleEmailCreatedResponse = {
    id: email.id,
    to: email.to,
    from: email.from,
    state: email.state,
  };

  return response;
}

export class HandleEmailDeadLetterController {
  /**
   * Local logger instance.
   */
  private logger: Logger;

  /**
   * Handle e-mail dead letter use case.
   */
  private usecase: HandleEmailDeadLetterUseCase;

  /**
   * E-mail event used by use case.
   */
  private emailEventEmitter: EmailEventEmitterControllerImpl;

  /**
   * Default constructor.
   * @param logger System logger.
   * @param emailRepository E-mail repository.
   * @param emailEventEmitter E-mail event emitter.
   * @param logger Global logger.
   */
  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly emailEventEmitterController: EmailEventEmitterController,
    logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleEmailDeadLetterController.name,
    });

    this.emailEventEmitter = new EmailEventEmitterControllerImpl(
      this.emailEventEmitterController,
    );

    this.usecase = new HandleEmailDeadLetterUseCase(
      this.emailRepository,
      this.emailEventEmitter,
      this.logger,
    );
  }

  /**
   * Fail e-mail.
   * @param id E-mail ID.
   * @returns Failed e-mail.
   */
  async execute(id: string): Promise<HandleEmailDeadLetterResponse> {
    // Send e-mail via SMTP.
    const email = await this.usecase.execute(id);

    return handleEmailDeadLetterPresenter(email);
  }
}
