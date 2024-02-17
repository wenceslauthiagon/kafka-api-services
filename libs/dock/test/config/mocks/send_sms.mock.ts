export function dockSendSmsMockSuccess() {
  return Promise.resolve({
    status: 200,
  });
}

export function dockSendSmsMockFail() {
  return Promise.reject(new Error('Mock APILAYER Offline'));
}
