import { getServerSession } from 'next-auth';
import { getUserDetails } from '@/common/server';
import { GET } from './route';
import { parseJson } from '@/test/api-test-helpers';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/common/server', () => ({
  getUserDetails: jest.fn(),
}));

type SessionMock = { user: { uuid?: string; email?: string } } | null;

const getServerSessionMock = getServerSession as jest.Mock<Promise<SessionMock>>;
const getUserDetailsMock = getUserDetails as jest.Mock;

describe('GET /api/user/self', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when session is unauthorized', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const response = await GET();
    const body = await parseJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 with user payload when data is valid', async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { uuid: 'u1', email: 'u@example.com' },
    });
    getUserDetailsMock.mockResolvedValueOnce({
      uuid: 'u1',
      id: 10,
      categories: [
        { name: 'Food', subcategories: ['Lunch', 'Dinner'] },
        { name: 'Bills', subcategories: ['Electricity'] },
      ],
    });

    const response = await GET();
    const body = await parseJson<{ uuid: string; id: number }>(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ uuid: 'u1', id: 10 });
  });

  it('returns 400 when payload validation fails', async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { uuid: 'u1', email: 'u@example.com' },
    });
    getUserDetailsMock.mockResolvedValueOnce({ bad: 'payload' });

    const response = await GET();
    const body = await parseJson<{ error: unknown[] }>(response);

    expect(response.status).toBe(400);
    expect(Array.isArray(body.error)).toBe(true);
    expect(body.error.length).toBeGreaterThan(0);
  });

  it('returns 500 when user is missing in database', async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { uuid: 'u1', email: 'u@example.com' },
    });
    getUserDetailsMock.mockResolvedValueOnce(null);

    const response = await GET();
    const body = await parseJson<{ error: string }>(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });

  it('returns 500 on unexpected errors', async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { uuid: 'u1', email: 'u@example.com' },
    });
    getUserDetailsMock.mockRejectedValueOnce(new Error('db down'));

    const response = await GET();
    const body = await parseJson<{ error: string }>(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });
});
