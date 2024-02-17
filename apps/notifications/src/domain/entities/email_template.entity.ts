import { Domain } from '@zro/common';

/**
 * A message template is a schema for message sent to users.
 */
export interface EmailTemplate extends Domain<string> {
  /**
   * Replace token list.
   */
  markups?: string[];

  /**
   * Message title. Could have markups.
   */
  title?: string;

  /**
   * Message raw body. Could have markups.
   */
  body?: string;

  /**
   * Message HTML body. Could have markups.
   */
  html?: string;

  /**
   * Template unique user friendly tag.
   */
  tag: string;

  /**
   * Extract a message from this template.
   * @param data Markups values.
   * @return Message extracted.
   */
  extract: (data: Record<string, string>) => EmailTemplateExtracted;
}

export type EmailTemplateExtracted = Pick<
  EmailTemplate,
  'title' | 'body' | 'html'
>;

export class EmailTemplateEntity implements EmailTemplate {
  id?: string;
  markups?: string[];
  title?: string;
  body?: string;
  html?: string;
  tag: string;

  constructor(props: Partial<EmailTemplate>) {
    Object.assign(this, props);
  }

  /**
   * Extract a message from this template.
   * @param data Markups values
   * @return Extracted message.
   */
  extract(data: Record<string, string>): EmailTemplateExtracted {
    const title = this.extractMessage(this.title, data);
    const body = this.extractMessage(this.body, data);
    const html = this.extractMessage(this.html, data);

    return {
      title,
      body,
      html,
    };
  }

  /**
   * Extract a message from template.
   * @param template Template message.
   * @param data Markups values;
   * @return Extracted message.
   */
  private extractMessage(
    template?: string,
    data?: Record<string, string>,
  ): string {
    if (!template || !data) {
      return null;
    }

    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{ *${key} *}}`, 'g');
      template = template.replace(regex, data[key]);
    });

    return template;
  }
}
