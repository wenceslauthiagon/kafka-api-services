import * as sanitizeHtml from 'sanitize-html';
import { Transform } from 'class-transformer';

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'a',
    'area',
    'b',
    'br',
    'div',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'i',
    'img',
    'li',
    'map',
    'ol',
    'p',
    's',
    'span',
    'strong',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tfoot',
    'tr',
    'u',
  ],
  allowedAttributes: {},
};

/**
 * Sanitize HTML Safe List
 * @returns string
 */
export function SanitizeHtml(): PropertyDecorator {
  return Transform((params) => {
    if (!params || !params.value) return params?.value;

    const { value } = params;
    const valueCleared = value.replace(/&(gt;?|lt;?)/g, '');

    return sanitizeHtml(valueCleared, options)
      .replace(/(&lt;)/g, '<')
      .replace(/(&gt;)/g, '>')
      .replace(/(&amp;)/g, '&');
  });
}
