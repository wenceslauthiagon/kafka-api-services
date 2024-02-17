import { MissingDataException } from '@zro/common';
import {
  Email,
  EmailEntity,
  EmailRepository,
  EmailState,
  EmailTemplateRepository,
} from '@zro/notifications/domain';
import { User } from '@zro/users/domain';
import { Logger } from 'winston';
import {
  EmailTemplateTagNotFoundException,
  EncryptProvider,
  EmailEventEmitter,
} from '@zro/notifications/application';

/**
 * Send e-mail from a template.
 */
export class CreateEmailUseCase {
  /**
   * Default constructor.
   * @param logger System logger.
   * @param emailRepository E-mail repository.
   * @param emailTemplateRepository Template repository.
   * @param encryptProvider
   * @param emailEventEmitter Event emitter.
   */
  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly emailTemplateRepository: EmailTemplateRepository,
    private readonly emailEventEmitter: EmailEventEmitter,
    private readonly encryptProvider: EncryptProvider,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: CreateEmailUseCase.name });
  }

  /**
   * Create and schedule an e-mail to be sent.
   *
   * @param id User defined ID.
   * @param to Destination e-mail.
   * @param from From e-mail.
   * @param tag E-mail template tag.
   * @param data E-mail template data.
   * @param user Destination user.
   * @param issuedBy Requester UUID.
   * @returns Create e-mail.
   */
  async execute(
    id: string,
    to: string,
    from: string,
    tag: string,
    data?: Record<string, string>,
    user?: User,
    issuedBy?: string,
  ): Promise<Email> {
    this.logger.debug('Creating email', {
      id,
      to,
      tag,
      user: user?.uuid,
      issuedBy,
    });

    // Check inputs
    if (!id || !to || !from || !tag) {
      throw new MissingDataException([
        ...(!id ? ['id'] : []),
        ...(!to ? ['to'] : []),
        ...(!from ? ['from'] : []),
        ...(!tag ? ['tag'] : []),
      ]);
    }

    // Search if there is an e-mail with the same ID.
    const foundEmail = await this.emailRepository.getById(id);

    if (foundEmail) {
      this.logger.warn('Indepotent e-mail creation.', {
        id,
        to: foundEmail.to,
        from: foundEmail.from,
      });

      return foundEmail;
    }

    // Search email template by tag.
    const template = await this.emailTemplateRepository.getByTag(tag);

    if (!template) {
      throw new EmailTemplateTagNotFoundException(tag);
    }

    // Extract e-mail message from tempĺate.
    let { title, body, html } = template.extract(data);

    // Encrypts possible sensitive data.
    title = title && this.encryptProvider.encrypt(title);
    body = body && this.encryptProvider.encrypt(body);
    html = html && this.encryptProvider.encrypt(html);

    const email = new EmailEntity({
      id,
      to,
      from,
      title,
      body,
      html,
      template,
      user,
      issuedBy,
      state: EmailState.PENDING,
    });

    // Store email on repository.
    await this.emailRepository.create(email);

    this.logger.info('Email created', { to, issuedBy, emailId: email.id });

    // Fire created event.
    await this.emailEventEmitter.emitCreatedEvent(email);

    return email;
  }
}
