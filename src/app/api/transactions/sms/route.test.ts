import { POST } from './route';
import {
  makeJsonRequest,
  makeRequest,
  parseJson,
} from '@/test/api-test-helpers';
import {
  createSmsTransaction,
  parseTokenFromAuthHeader,
} from '@/services/transactions/transaction-service';

jest.mock('@/services/transactions/transaction-service', () => ({
  createSmsTransaction: jest.fn(),
  parseTokenFromAuthHeader: jest.fn(),
}));

const createSmsTransactionMock = createSmsTransaction as jest.Mock;
const parseTokenFromAuthHeaderMock = parseTokenFromAuthHeader as jest.Mock;

describe('POST /api/transactions/sms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    parseTokenFromAuthHeaderMock.mockReturnValue('abc');
  });

  it('returns 400 for invalid JSON body', async () => {
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

  it('returns 401 for unauthorized token', async () => {
    createSmsTransactionMock.mockResolvedValueOnce({
      ok: false,
      error: 'UNAUTHORIZED',
    });

    const response = await POST(
      makeJsonRequest(
        'http://localhost/api/transactions/sms',
        'POST',
        { data: { message: 'msg' }, metadata: { location: null } },
        { authorization: 'Token abc' }
      )
    );

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('returns 422 when message cannot be parsed', async () => {
    createSmsTransactionMock.mockResolvedValueOnce({
      ok: false,
      error: 'UNPROCESSABLE',
      details: { missing: { amount: true, recipient: true } },
    });

    const response = await POST(
      makeJsonRequest(
        'http://localhost/api/transactions/sms',
        'POST',
        { data: { message: 'unknown format' }, metadata: { location: null } },
        { authorization: 'Token abc' }
      )
    );

    const body = await parseJson<{ message: string; missing: unknown }>(response);
    expect(response.status).toBe(422);
    expect(body.message).toBe('Unable to extract required fields from message');
    expect(body.missing).toBeDefined();
  });

  it('returns 201 when transaction is created', async () => {
    createSmsTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 99, uuid: 'txn-uuid' },
    });

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

  it('returns 500 when service throws', async () => {
    createSmsTransactionMock.mockRejectedValueOnce(new Error('db error'));

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
