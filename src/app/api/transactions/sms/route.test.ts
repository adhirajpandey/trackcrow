import prisma from '@/lib/prisma';
import { parseTransactionMessage } from '@/common/sms-parser';
import { POST } from './route';
import {
  makeJsonRequest,
  makeRequest,
  parseJson,
} from '@/test/api-test-helpers';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/common/sms-parser', () => ({
  parseTransactionMessage: jest.fn(),
}));

type PrismaSmsMock = {
  user: { findFirst: jest.Mock };
  transaction: { create: jest.Mock };
};

const prismaMock = prisma as unknown as PrismaSmsMock;
const parseTransactionMessageMock = parseTransactionMessage as jest.Mock;

describe('POST /api/transactions/sms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if auth header is missing', async () => {
    const response = await POST(
      makeJsonRequest('http://localhost/api/transactions/sms', 'POST', {
        data: { message: 'test' },
        metadata: { location: null },
      })
    );

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('returns 401 for invalid auth header format', async () => {
    const response = await POST(
      makeJsonRequest(
        'http://localhost/api/transactions/sms',
        'POST',
        { data: { message: 'test' }, metadata: { location: null } },
        { authorization: 'Bearer abc' }
      )
    );

    expect(response.status).toBe(401);
  });

  it('returns 401 if token does not map to a user', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);

    const response = await POST(
      makeJsonRequest(
        'http://localhost/api/transactions/sms',
        'POST',
        { data: { message: 'test' }, metadata: { location: null } },
        { authorization: 'Token abc' }
      )
    );

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid JSON body', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({ uuid: 'u1', email: 'u@x.com' });

    const response = await POST(
      makeRequest('http://localhost/api/transactions/sms', {
        method: 'POST',
        headers: { authorization: 'Token abc', 'content-type': 'application/json' },
        body: '{bad-json',
      })
    );

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid JSON body');
  });

  it('returns 400 for invalid payload schema', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({ uuid: 'u1', email: 'u@x.com' });

    const response = await POST(
      makeJsonRequest(
        'http://localhost/api/transactions/sms',
        'POST',
        { data: {}, metadata: { location: null } },
        { authorization: 'Token abc' }
      )
    );

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid payload');
  });

  it('returns 422 when parser cannot extract required fields', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({ uuid: 'u1', email: 'u@x.com' });
    parseTransactionMessageMock.mockReturnValueOnce(null);

    const response = await POST(
      makeJsonRequest(
        'http://localhost/api/transactions/sms',
        'POST',
        { data: { message: 'unknown format' }, metadata: { location: null } },
        { authorization: 'Token abc' }
      )
    );

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(422);
    expect(body.message).toBe('Unable to extract required fields from message');
  });

  it('returns 201 when transaction is created', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({ uuid: 'u1', email: 'u@x.com' });
    parseTransactionMessageMock.mockReturnValueOnce({
      amount: 500,
      recipient: 'store@upi',
      type: 'UPI',
      reference: '1234',
      account: 'HDFC',
    });
    prismaMock.transaction.create.mockResolvedValueOnce({ id: 99, uuid: 'txn-uuid' });

    const response = await POST(
      makeJsonRequest(
        'http://localhost/api/transactions/sms',
        'POST',
        { data: { message: 'sms message' }, metadata: { location: 'Bangalore' } },
        { authorization: 'Token abc' }
      )
    );

    const body = await parseJson<{ id: number; uuid: string; message: string }>(response);
    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      message: 'Transaction created',
      id: 99,
      uuid: 'txn-uuid',
    });
  });

  it('returns 500 when an unexpected exception occurs', async () => {
    prismaMock.user.findFirst.mockRejectedValueOnce(new Error('db error'));

    const response = await POST(
      makeJsonRequest(
        'http://localhost/api/transactions/sms',
        'POST',
        { data: { message: 'sms message' }, metadata: { location: null } },
        { authorization: 'Token abc' }
      )
    );

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal Server Error');
  });
});
