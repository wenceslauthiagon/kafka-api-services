import { MissingDataException } from '@zro/common';
import { Email, EmailRepository, EmailState } from '@zro/notifications/domain';
import { Logger } from 'winston';
import {
  EmailNotFoundException,
  EmailEventEmitter,
} from '@zro/notifications/application';

export class HandleEmailDeadLetterUseCase {
  constructor(
    private emailRepository: EmailRepository,
    private emailEventEmitter: EmailEventEmitter,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: HandleEmailDeadLetterUseCase.name });
  }

  async execute(id: string): Promise<Email> {
    this.logger.debug('Failing e-mail', { id });

    if (!id) {
      throw new MissingDataException(['id']);
    }

    // Get e-mail data.
    const email = await this.emailRepository.getById(id);

    // Sanity check.
    if (!email) {
      throw new EmailNotFoundException(id);
    }

    // Check if e-mail state is final.
    if (email.isSent() || email.isFailed()) {
      this.logger.debug('Email is already sent or failed', { email });
      return email;
    }

    // Set e-mail was failed.
    email.state = EmailState.FAILED;

    // Update e-mail
    await this.emailRepository.update(email);

    // Fire e-mail sent event.
    await this.emailEventEmitter.emitFailedEvent(email);

    return email;
  }
}
