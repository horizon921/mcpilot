import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { MCPCallApiRequest, MCPCallApiResponse } from '@/types/mcp';

// This is a simplified proxy. In a real-world scenario, you'd add:
// - Robust error handling and logging.
// - Authentication/Authorization for accessing this proxy and for the MCP server itself.
// - Timeout handling for requests to MCP servers.
// - Potentially, a way to discover tool schemas from MCP servers if not hardcoded or sent by AI.

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MCPCallApiRequest;
    const { serverBaseUrl, toolName, arguments: toolArgs } = body;

    if (!serverBaseUrl || !toolName) {
      return NextResponse.json({ success: false, error: 'Missing serverBaseUrl or toolName' } as MCPCallApiResponse, { status: 400 });
    }

    // Construct the target URL on the MCP server.
    // The exact path structure (`/tools/{toolName}/call`) is an assumption.
    // This needs to match the MCP server's API design.
    // Or, the MCP server might have a single endpoint that takes toolName as a parameter.
    // For now, let's assume a common RESTful pattern or a generic /call endpoint.
    // A more flexible approach might involve the MCP server advertising its endpoint structure.
    
    // Option 1: Assume a generic /call endpoint on the MCP server that takes tool_name and args
    // const targetUrl = `${serverBaseUrl.replace(/\/$/, '')}/call`; 
    // const mcpRequestBody = { tool_name: toolName, arguments: toolArgs };

    // Option 2: Assume a RESTful path per tool (more common for distinct tools)
    // This is just an example, the actual MCP server will define its API.
    // We might need a more sophisticated way to determine the endpoint if it varies greatly.
    const targetUrl = `${serverBaseUrl.replace(/\/$/, '')}/tools/${encodeURIComponent(toolName)}/invoke`; 
    const mcpRequestBody = toolArgs; // Send arguments directly as the body for this pattern


    console.log(`Proxying MCP call to: ${targetUrl} with args:`, mcpRequestBody);

    const mcpResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add any necessary authentication headers for the MCP server
        // e.g., 'Authorization': `Bearer ${process.env.MCP_SERVER_AUTH_TOKEN_FOR_SERVER_ID_...}`
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