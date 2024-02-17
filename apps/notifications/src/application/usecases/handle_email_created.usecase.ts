import { MissingDataException } from '@zro/common';
import { Email, EmailRepository, EmailState } from '@zro/notifications/domain';
import { Logger } from 'winston';
import {
  EmailNotFoundException,
  EmailEventEmitter,
  SmtpGateway,
} from '@zro/notifications/application';

export class HandleEmailCreatedUseCase {
  constructor(
    private emailRepository: EmailRepository,
    private emailEventEmitter: EmailEventEmitter,
    private smtpGateway: SmtpGateway,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: HandleEmailCreatedUseCase.name });
  }

  async execute(id: string): Promise<Email> {
    this.logger.debug('Sending email', { id });

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

    // Send e-mail
    await this.smtpGateway.send(email);

    // Set e-mail was sent.
    email.state = EmailState.SENT;

    // Update e-mail
    await this.emailRepository.update(email);

    // Fire e-mail sent event.
    await this.emailEventEmitter.emitSentEvent(email);

    return email;
  }
}
