import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'; // Force dynamic execution, disable caching

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baseUrl = searchParams.get('baseUrl');
    
    if (!baseUrl) {
      return NextResponse.json({ 
        error: 'Missing baseUrl parameter' 
      }, { status: 400 });
    }

    // 构建info端点URL
    const infoUrl = `${baseUrl.replace(/\/$/, '')}/mcp/info`;
    
    console.log(`Fetching MCP server info from: ${infoUrl}`);
    
    // 发起请求获取服务器信息
    const response = await fetch(infoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // 设置超时时间
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MCP info fetch failed: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json({
        error: `服务器响应错误 (${response.status}): ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const info = await response.json();
    console.log('Successfully fetched MCP server info:', info);
    
    return NextResponse.json(info);

  } catch (error: any) {
    console.error('Failed to fetch MCP server info:', error);
    
    if (error.name === 'TimeoutError') {
      return NextResponse.json({
        error: '请求超时，请检查服务器是否正常运行'
      }, { status: 408 });
    }
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        error: '无法连接到服务器，请检查Base URL和端口是否正确'
      }, { status: 503 });
    }
    
    return NextResponse.json({
      error: `获取服务器信息失败: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}