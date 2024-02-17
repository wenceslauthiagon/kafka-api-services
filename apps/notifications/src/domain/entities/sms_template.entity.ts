import { Domain } from '@zro/common';

/**
 * A message template is a schema for message sent to users.
 */
export interface SmsTemplate extends Domain<string> {
  /**
   * Replace token list.
   */
  markups?: string[];

  /**
   * Message raw body. Could have markups.
   */
  body?: string;

  /**
   * Template unique user friendly tag.
   */
  tag: string;

  /**
   * Extract a message from this template.
   * @param data Markups values.
   * @return Message extracted.
   */
  extract: (data: Record<string, string>) => SmsTemplateExtracted;
}

export type SmsTemplateExtracted = Pick<SmsTemplate, 'body'>;

export class SmsTemplateEntity implements SmsTemplate {
  id?: string;
  markups?: string[];
  body?: string;
  tag: string;

  constructor(props: Partial<SmsTemplate>) {
    Object.assign(this, props);
  }

  /**
   * Extract a message from this template.
   * @param data Markups values
   * @return Extracted message.
   */
  extract(data: Record<string, string>): SmsTemplateExtracted {
    const body = this.extractMessage(this.body, data);

    return {
      body,
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
