import { GET } from './route';
import { parseJson } from '@/test/api-test-helpers';
import { requireUserSession } from '@/services/auth/guard-service';
import { getUserDetailsService } from '@/services/users/user-service';

jest.mock('@/services/auth/guard-service', () => ({
  requireUserSession: jest.fn(),
}));

jest.mock('@/services/users/user-service', () => ({
  getUserDetailsService: jest.fn(),
}));

const requireUserSessionMock = requireUserSession as jest.Mock;
const getUserDetailsServiceMock = getUserDetailsService as jest.Mock;

describe('GET /api/user/self', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when session is unauthorized', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: false, error: 'UNAUTHORIZED' });

    const response = await GET();
    const body = await parseJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 with user payload when data is valid', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: true, data: { userUuid: 'u1' } });
    getUserDetailsServiceMock.mockResolvedValueOnce({
      ok: true,
      data: {
        uuid: 'u1',
        id: 10,
        categories: [
          { name: 'Food', subcategories: ['Lunch', 'Dinner'] },
          { name: 'Bills', subcategories: ['Electricity'] },
        ],
      },
    });

    const response = await GET();
    const body = await parseJson<{ uuid: string; id: number }>(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ uuid: 'u1', id: 10 });
  });

  it('returns 400 when payload validation fails', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: true, data: { userUuid: 'u1' } });
    getUserDetailsServiceMock.mockResolvedValueOnce({ ok: true, data: { bad: 'payload' } });

    const response = await GET();
    const body = await parseJson<{ error: unknown[] }>(response);

    expect(response.status).toBe(400);
    expect(Array.isArray(body.error)).toBe(true);
    expect(body.error.length).toBeGreaterThan(0);
  });

  it('returns 500 when user is missing in database', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: true, data: { userUuid: 'u1' } });
    getUserDetailsServiceMock.mockResolvedValueOnce({ ok: true, data: null });

    const response = await GET();
    const body = await parseJson<{ error: string }>(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });

  it('returns 500 on internal service errors', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: true, data: { userUuid: 'u1' } });
    getUserDetailsServiceMock.mockResolvedValueOnce({ ok: false, error: 'INTERNAL_ERROR' });

    const response = await GET();
    const body = await parseJson<{ error: string }>(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });
});
