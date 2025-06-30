import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { MCPServerInfo } from '@/types/mcp';

interface StatusRequest {
  servers: Pick<MCPServerInfo, 'id' | 'baseUrl'>[];
}

interface StatusResponse {
  id: string;
  status: 'connected' | 'error';
  info?: any;
  error?: string;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: StatusRequest = await request.json();
    if (!body.servers || !Array.isArray(body.servers)) {
      return NextResponse.json({ error: 'Invalid request body, "servers" array is required.' }, { status: 400 });
    }

    const results: StatusResponse[] = await Promise.all(
      body.servers.map(async (server) => {
        if (!server.baseUrl) {
          return {
            id: server.id,
            status: 'error',
            error: 'Base URL is not configured.',
          };
        }

        const baseUrl = server.baseUrl.replace(/\/$/, '');
        
        try {
          // Step 1: Ping the root URL for a quick online check
          const rootResponse = await fetch(baseUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(3000), // 3-second timeout for a quick ping
          });

          if (!rootResponse.ok) {
            return {
              id: server.id,
              status: 'error',
              error: `Server is offline or returned status ${rootResponse.status}`,
            };
          }

          // Step 2: If online, fetch the full /mcp/info
          const infoUrl = `${baseUrl}/mcp/info`;
          const infoResponse = await fetch(infoUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(7000), // 7-second timeout for info
          });

          if (!infoResponse.ok) {
             return {
              id: server.id,
              status: 'connected', // It's online, but info is unavailable
              error: `Server online, but failed to get info (status: ${infoResponse.status})`,
            };
          }

          const info = await infoResponse.json();
          return {
            id: server.id,
            status: 'connected',
            info: info,
          };

        } catch (error: any) {
          let errorMessage = 'Unknown error';
          if (error.name === 'TimeoutError') {
            errorMessage = 'Request timed out.';
          } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          return {
            id: server.id,
            status: 'error',
            error: errorMessage,
          };
        }
      })
    );

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('[MCP_STATUS_API_ERROR]', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}