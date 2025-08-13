const provider = {
  getBlockNumber: jest.fn(() => Promise.resolve(123456)),
  getTransaction: jest.fn(() => Promise.resolve({
    to: '',
    value: BigInt(0),
    wait: jest.fn(() => Promise.resolve({ status: 1 })),
  })),
};

module.exports = provider;
