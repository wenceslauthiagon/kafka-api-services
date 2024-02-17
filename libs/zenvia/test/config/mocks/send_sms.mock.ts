export function zenviaSendSmsMockSuccess() {
  return Promise.resolve({
    status: 200,
    data: {
      sendSmsResponse: {
        statusCode: '00',
        statusDescription: 'Ok',
        detailCode: '000',
        detailDescription: 'Message Sent',
      },
    },
  });
}

export function zenviaSendSmsMockFail() {
  return Promise.resolve({
    status: 200,
    data: {
      sendSmsResponse: {
        statusCode: '05',
        statusDescription: 'Blocked',
        detailCode: '140',
        detailDescription: 'Mobile number not covered',
      },
    },
  });
}
