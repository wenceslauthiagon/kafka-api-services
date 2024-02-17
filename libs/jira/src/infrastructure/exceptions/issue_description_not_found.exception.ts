import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'ISSUE_DESCRIPTION_NOT_FOUND')
export class IssueDescriptionNotFoundException extends DefaultException {
  constructor(description: string) {
    super({
      message: 'Issue Description Not Found.',
      type: ExceptionTypes.SYSTEM,
      code: 'ISSUE_DESCRIPTION_NOT_FOUND',
      data: { description },
    });
  }
}
