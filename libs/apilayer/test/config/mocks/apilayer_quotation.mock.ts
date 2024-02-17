import { faker } from '@faker-js/faker/locale/pt_BR';

export function apilayerQuotationMockSuccess(source: string, currency: string) {
  return () =>
    Promise.resolve({
      status: 200,
      data: {
        success: true,
        terms: 'https://zrobank.com.br/terms',
        privacy: 'https://zrobank.com.br/privacy',
        timestamp: Math.floor(Date.now() / 1000),
        source: source,
        quotes: {
          [`${source}${currency}`]: faker.datatype.number(1000) / 100,
        },
      },
    });
}

export function apilayerQuotationMockOfflineFail() {
  return Promise.reject(new Error('Mock APILAYER Offline'));
}

export function apilayerQuotationMockUnexpectedFail() {
  return Promise.resolve({
    status: 200,
    data: {
      success: false,
    },
  });
}
