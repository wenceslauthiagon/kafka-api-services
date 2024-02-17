import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Logger } from 'winston';
import { Event, Request } from '@bugsnag/js';
import { catchError, throwError } from 'rxjs';
import { BugReportService, InjectLogger } from '../modules';
import { DefaultException, ProtocolType } from '../helpers';
import { NotImplementedException } from '../exceptions';

type BugsnagError = Event['errors'][0];
type BugsnagStackFrame = BugsnagError['stacktrace'][0];

@Injectable()
export class BugReportInterceptor implements NestInterceptor {
  constructor(
    @InjectLogger() private logger: Logger,
    private bugReportService: BugReportService,
  ) {
    this.logger = logger.child({ context: BugReportInterceptor.name });
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      return this.interceptHttp(context, next);
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }
  }

  async interceptHttp(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const { id, ip, originalUrl, method, headers } = req;
    const userAgent = req.get('user-agent') || 'NO_AGENT';

    const request: Request = {
      id,
      userAgent,
      clientIp: ip,
      headers,
      httpMethod: method,
      url: originalUrl.split('?')[0],
    };

    if (req.user) {
      request.userId = req.user.uuid ?? req.user.id;
    }

    request.headers = Object.assign({}, headers, {
      authorization: 'Protected',
    });

    request.userId = request.userId ?? '-';
    request.clientIp = request.headers['cf-connecting-ip'] ?? ip;
    request.nonce = request.headers['nonce'] ?? '-';

    // Start bug report session.
    req.bugReportSession = await this.bugReportService.startSession();

    return next.handle().pipe(
      catchError((error) => {
        let unhandled: Event['unhandled'] = true;
        let severity: Event['severity'] = 'error';
        const context = `${method} ${request.url}`;
        let groupingHash = `${method}|${request.url}`;

        // Check if a default exception happened due to user input.
        if (error instanceof DefaultException) {
          if (error.isUserError()) {
            severity = 'info';
          }
          unhandled = false;
          groupingHash += '|' + error.code;
        }

        // Check if a http exception happened due to user input.
        if (error instanceof HttpException) {
          if (error.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR) {
            severity = 'warning';
          }
          unhandled = false;
          groupingHash += '|HTTP|' + error.getStatus();
        }

        // No, it is our error... :(
        // Report bug.
        req.bugReportSession.notify(error, (event: Event) => {
          event.setUser(request.userId);
          event.context = context;
          event.severity = severity;
          event.request = request;
          event.groupingHash = groupingHash;
          event.unhandled = unhandled;

          if (error instanceof DefaultException) {
            try {
              const stackedErrors = this.parseStackTrace(error);
              stackedErrors.reverse().forEach((e) => event.errors.push(e));
            } catch (err) {
              this.logger.error('Error in parseStackTrace.', {
                stack: err.stack,
              });
            }

            event.addMetadata('Default Exception', {
              code: error.code,
              message: error.message,
            });
            event.unhandled = false;
          }

          if (error instanceof HttpException) {
            event.addMetadata('Http Exception', {
              status: error.getStatus(),
              message: error.message,
            });
            event.unhandled = false;
          }

          this.logger.debug('Http bug report event.', { event });
        });

        this.logger.debug('Notify http bug report.', { request, error });

        return throwError(() => error);
      }),
    );
  }

  private parseStackTrace(exception: DefaultException): BugsnagError[] {
    return exception.causedByStack.map((errorStackTrace): BugsnagError => {
      const errorStack = errorStackTrace.split('\n');
      this.logger.debug('Stack', { stack: errorStack });

      const [errorClass, errorMessage] = errorStack[0]
        ?.split(':')
        .map((s) => s.trim());

      const stacktrace = errorStack
        .slice(1, errorStack.length)
        .filter((errorTrace) => errorTrace)
        .map((errorTrace): BugsnagStackFrame => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [method, path] = errorTrace
            .trim()
            .substring('at'.length)
            .trim()
            .split(' ');

          const [webpack, source, line, column] = path
            ?.substring(1, path.length - 1)
            ?.split(':');

          return {
            code: null,
            columnNumber: column && parseInt(column),
            file: [webpack, source].filter((x) => x).join(':'),
            inProject: true,
            lineNumber: line && parseInt(line),
            method,
          };
        });

      return {
        errorClass,
        errorMessage,
        stacktrace,
        type: 'nodejs',
      };
    });
  }
}
