import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { MCPCallApiRequest, MCPCallApiResponse, MCPServerConfig, MCPParameterDefinition, MCPConfigSchema } from '@/types/mcp';

// Build request parameters based on dynamic server configuration
function buildRequestParameters(
  serverConfig?: MCPServerConfig,
  configSchema?: MCPParameterDefinition[]
): { headers: Record<string, string>; queryParams: Record<string, string> } {
  const headers: Record<string, string> = {};
  const queryParams: Record<string, string> = {};
  
  if (!serverConfig?.parameters || !configSchema) {
    return { headers, queryParams };
  }
  
  // 遍历配置schema，根据location将参数放到正确位置
  configSchema.forEach((paramDef: MCPParameterDefinition) => {
    const value = serverConfig.parameters[paramDef.name];
    
    if (value !== undefined && value !== null && value !== '') {
      switch (paramDef.location) {
        case 'header':
          if (paramDef.header_name) {
            headers[paramDef.header_name] = String(value);
          }
          break;
        case 'query':
          if (paramDef.query_name) {
            queryParams[paramDef.query_name] = String(value);
          }
          break;
        // body_json 参数会在请求体中处理
      }
    }
  });
  
  return { headers, queryParams };
}

// Detect MCP server type and get configuration schema
async function detectServerAndGetConfig(
  baseUrl: string, 
  serverConfig?: MCPServerConfig
): Promise<{
  url: string, 
  requestFormat: 'mcp_standard' | 'tool_invoke',
  configSchema?: MCPParameterDefinition[]
}> {
  
  // Build basic auth headers if available for detection
  const { headers: detectionHeaders } = serverConfig ? 
    buildRequestParameters(serverConfig, []) : { headers: {} };

  // First, try to get the config schema
  try {
    const schemaUrl = `${baseUrl.replace(/\/$/, '')}/mcp-config-schema`;
    const response = await fetch(schemaUrl, {
      method: 'GET',
      headers: detectionHeaders
    });
    
    if (response.ok) {
      const schema: MCPConfigSchema = await response.json();
      console.log(`Found MCP server with config schema: ${schema.server_name}`);
      
      return {
        url: `${baseUrl.replace(/\/$/, '')}/call_tool`,
        requestFormat: 'mcp_standard',
        configSchema: schema.parameters
      };
    }
  } catch (e) {
    console.log('No config schema endpoint found, trying fallback detection');
  }
  
  // Fallback: check for standard MCP info endpoint
  try {
    const infoUrl = `${baseUrl.replace(/\/$/, '')}/mcp/info`;
    const response = await fetch(infoUrl, {
      method: 'GET',
      headers: detectionHeaders
    });
    
    if (response.ok) {
      const info = await response.json();
      if (info.server_type === 'mcp_standard' || info.protocol === 'mcp') {
        return {
          url: `${baseUrl.replace(/\/$/, '')}/call_tool`,
          requestFormat: 'mcp_standard'
        };
      }
    }
  } catch (e) {
    // Continue with next fallback
  }
  
  // Fallback: check for tools endpoint
  try {
    const toolsUrl = `${baseUrl.replace(/\/$/, '')}/tools`;
    const response = await fetch(toolsUrl, {
      method: 'GET',
      headers: detectionHeaders
    });
    
    if (response.ok) {
      return {
        url: `${baseUrl.replace(/\/$/, '')}/call_tool`,
        requestFormat: 'mcp_standard'
      };
    }
  } catch (e) {
    // Continue with final fallback
  }
  
  // Final fallback: assume tool_invoke format
  return {
    url: `${baseUrl.replace(/\/$/, '')}/tools/TOOLNAME/invoke`, // Will be replaced with actual tool name
    requestFormat: 'tool_invoke'
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MCPCallApiRequest;
    const { serverBaseUrl, toolName, arguments: toolArgs, serverConfig } = body;

    if (!serverBaseUrl || !toolName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing serverBaseUrl or toolName' 
      } as MCPCallApiResponse, { status: 400 });
    }

    // Detect server type and get configuration
    const { url: baseUrl, requestFormat, configSchema } = await detectServerAndGetConfig(
      serverBaseUrl, 
      serverConfig
    );
    
    // Build target URL
    let targetUrl = baseUrl;
    if (requestFormat === 'tool_invoke') {
      targetUrl = baseUrl.replace('TOOLNAME', encodeURIComponent(toolName));
    }
    
    // Build request parameters from dynamic configuration
    const { headers: configHeaders, queryParams } = buildRequestParameters(
      serverConfig, 
      configSchema
    );
    
    // Add query parameters to URL if any
    if (Object.keys(queryParams).length > 0) {
      const url = new URL(targetUrl);
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      targetUrl = url.toString();
    }
    
    // Build request body based on detected format
    let mcpRequestBody: any;
    if (requestFormat === 'mcp_standard') {
      // Standard MCP format: { tool_name, arguments }
      mcpRequestBody = { tool_name: toolName, arguments: toolArgs };
    } else {
      // Tool invoke format: send arguments directly
      mcpRequestBody = toolArgs;
    }

    console.log(`Proxying MCP call to: ${targetUrl} with format: ${requestFormat}`);
    console.log('Request headers:', configHeaders);

    const mcpResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...configHeaders,
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
      } as MCPCallApiResponse, { 
        status: mcpResponse.status > 399 && mcpResponse.status < 600 ? mcpResponse.status : 500 
      });
    }

    const responseData = await mcpResponse.json();

    return NextResponse.json({ 
      success: true, 
      data: responseData 
    } as MCPCallApiResponse, { status: 200 });

  } catch (error: any) {
    console.error('[MCP_PROXY_API_ERROR]', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error in MCP proxy' 
    } as MCPCallApiResponse, { status: 500 });
  }
}