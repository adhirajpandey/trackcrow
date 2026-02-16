import { POST } from './route';
import { handleChatRequest } from '@/app/crow-bot/server/chat-orchestrator';

jest.mock('@/app/crow-bot/server/chat-orchestrator', () => ({
  handleChatRequest: jest.fn(),
}));

const handleChatRequestMock = handleChatRequest as jest.Mock;

describe('POST /api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns orchestrator response when successful', async () => {
    const expected = new Response('ok', { status: 200 });
    handleChatRequestMock.mockResolvedValueOnce(expected);

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('maps unauthorized errors to 401', async () => {
    handleChatRequestMock.mockRejectedValueOnce(new Error('Unauthorized'));

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })
    );

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('Unauthorized');
  });
});
