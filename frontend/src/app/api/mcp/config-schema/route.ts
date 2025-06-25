import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baseUrl = searchParams.get('baseUrl');
    
    if (!baseUrl) {
      return NextResponse.json({ 
        error: 'Missing baseUrl parameter' 
      }, { status: 400 });
    }

    // 构建schema端点URL
    const schemaUrl = `${baseUrl.replace(/\/$/, '')}/mcp-config-schema`;
    
    console.log(`Fetching config schema from: ${schemaUrl}`);
    
    // 发起请求获取配置schema
    const response = await fetch(schemaUrl, {
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
      console.error(`Schema fetch failed: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json({
        error: `服务器响应错误 (${response.status}): ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const schema = await response.json();
    console.log('Successfully fetched config schema:', schema);
    
    return NextResponse.json(schema);

  } catch (error: any) {
    console.error('Failed to fetch config schema:', error);
    
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
      error: `获取配置失败: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}