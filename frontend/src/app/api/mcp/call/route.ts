import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { MCPCallApiRequest, MCPCallApiResponse, MCPAuthConfig } from '@/types/mcp';

// Build authentication headers based on auth configuration
function buildAuthHeaders(authConfig?: MCPAuthConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (!authConfig || authConfig.type === 'none') {
    return headers;
  }
  
  switch (authConfig.type) {
    case 'bearer':
      if (authConfig.bearerToken) {
        headers['Authorization'] = `Bearer ${authConfig.bearerToken}`;
      }
      break;
      
    case 'api_key_header':
      if (authConfig.apiKey && authConfig.apiKeyName) {
        headers[authConfig.apiKeyName] = authConfig.apiKey;
      }
      break;
      
    case 'basic':
      if (authConfig.username && authConfig.password) {
        const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
      
    case 'custom_headers':
      if (authConfig.customHeaders) {
        Object.assign(headers, authConfig.customHeaders);
      }
      break;
      
    // api_key_query is handled in URL parameters, not headers
    case 'api_key_query':
      // This will be handled in the URL construction
      break;
  }
  
  return headers;
}

// Build URL with query parameters for API key query auth
function buildUrlWithAuth(baseUrl: string, toolName: string, authConfig?: MCPAuthConfig): string {
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/tools/${encodeURIComponent(toolName)}/invoke`;
  
  if (authConfig?.type === 'api_key_query' && authConfig.apiKey && authConfig.apiKeyName) {
    const url = new URL(targetUrl);
    url.searchParams.set(authConfig.apiKeyName, authConfig.apiKey);
    return url.toString();
  }
  
  return targetUrl;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MCPCallApiRequest;
    const { serverBaseUrl, toolName, arguments: toolArgs, authConfig } = body;

    if (!serverBaseUrl || !toolName) {
      return NextResponse.json({ success: false, error: 'Missing serverBaseUrl or toolName' } as MCPCallApiResponse, { status: 400 });
    }

    // Build target URL with potential query auth
    const targetUrl = buildUrlWithAuth(serverBaseUrl, toolName, authConfig);
    const mcpRequestBody = toolArgs; // Send arguments directly as the body

    // Build authentication headers
    const authHeaders = buildAuthHeaders(authConfig);

    console.log(`Proxying MCP call to: ${targetUrl} with auth type: ${authConfig?.type || 'none'}`);

    const mcpResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(mcpRequestBody),
    });

    if (!mcpResponse.ok) {
      let errorBody;
      try {
        errorBody = await mcpResponse.json();
      } catch (e) {
        errorBody = await mcpResponse.text();
      }
      console.error(`MCP server call failed to ${targetUrl}: ${mcpResponse.status}`, errorBody);
      return NextResponse.json({ 
        success: false, 
        error: `MCP Server Error: ${mcpResponse.status} - ${errorBody?.message || errorBody || mcpResponse.statusText}` 
      } as MCPCallApiResponse, { status: mcpResponse.status > 399 && mcpResponse.status < 600 ? mcpResponse.status : 500 });
    }

    const responseData = await mcpResponse.json();

    return NextResponse.json({ success: true, data: responseData } as MCPCallApiResponse, { status: 200 });

  } catch (error: any) {
    console.error('[MCP_PROXY_API_ERROR]', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error in MCP proxy' 
    } as MCPCallApiResponse, { status: 500 });
  }
}