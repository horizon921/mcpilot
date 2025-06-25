#!/usr/bin/env python3
"""
测试MCP客户端与北大树洞服务器的集成
"""

import asyncio
import json
import httpx
from typing import Dict, Any

async def test_server_detection(base_url: str):
    """测试服务器类型检测"""
    print(f"🔍 测试服务器检测: {base_url}")
    
    try:
        # 测试 /mcp/info 端点
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/mcp/info")
            if response.status_code == 200:
                info = response.json()
                print(f"✅ 服务器信息: {info.get('name', 'Unknown')}")
                print(f"   协议类型: {info.get('protocol', 'Unknown')}")
                print(f"   服务器类型: {info.get('server_type', 'Unknown')}")
                return True
            else:
                print(f"❌ /mcp/info 端点不可用: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ 服务器检测失败: {e}")
        return False

async def test_tools_endpoint(base_url: str):
    """测试工具列表端点"""
    print(f"🛠️  测试工具列表: {base_url}/tools")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/tools")
            if response.status_code == 200:
                tools = response.json()
                print(f"✅ 发现 {len(tools.get('tools', []))} 个工具:")
                for tool in tools.get('tools', []):
                    print(f"   - {tool.get('name', 'Unknown')}: {tool.get('description', 'No description')}")
                return True
            else:
                print(f"❌ /tools 端点不可用: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ 获取工具列表失败: {e}")
        return False

async def test_tool_call_without_auth(base_url: str):
    """测试不带认证的工具调用"""
    print(f"🔧 测试工具调用（无认证）: {base_url}/call_tool")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/call_tool",
                json={
                    "tool_name": "get_posts",
                    "arguments": {"limit": 1}
                },
                headers={"Content-Type": "application/json"}
            )
            
            result = response.json()
            if result.get('success'):
                print("✅ 工具调用成功（这不应该发生，因为缺少认证）")
            else:
                print(f"❌ 工具调用失败（预期的）: {result.get('error', 'Unknown error')}")
                return True  # 这是预期的结果
    except Exception as e:
        print(f"❌ 工具调用异常: {e}")
        return False

async def test_mcp_client_simulation():
    """模拟MCP客户端的完整流程"""
    base_url = "http://localhost:8765"
    
    print("=" * 60)
    print("🚀 开始测试MCP客户端与北大树洞服务器的集成")
    print("=" * 60)
    
    # 步骤1: 检测服务器
    print("\n📋 步骤1: 服务器检测")
    server_detected = await test_server_detection(base_url)
    
    # 步骤2: 获取工具列表
    print("\n📋 步骤2: 获取工具列表")
    tools_available = await test_tools_endpoint(base_url)
    
    # 步骤3: 测试工具调用
    print("\n📋 步骤3: 测试工具调用")
    tool_call_result = await test_tool_call_without_auth(base_url)
    
    # 总结
    print("\n" + "=" * 60)
    print("📊 测试结果总结")
    print("=" * 60)
    print(f"服务器检测: {'✅ 通过' if server_detected else '❌ 失败'}")
    print(f"工具列表: {'✅ 通过' if tools_available else '❌ 失败'}")
    print(f"工具调用: {'✅ 按预期失败（需要认证）' if tool_call_result else '❌ 异常'}")
    
    if server_detected and tools_available:
        print("\n🎉 MCP客户端与服务器基础通信正常！")
        print("💡 下一步: 在前端界面中配置北大树洞认证信息")
        print("   1. 访问 http://localhost:3002")
        print("   2. 进入设置 -> MCP服务器")
        print("   3. 添加服务器，选择'北大树洞认证'")
        print("   4. 填入从浏览器获取的认证信息")
    else:
        print("\n❌ 基础通信存在问题，请检查服务器是否正常运行")
        print("   启动命令: cd mcp/pku-treehole-crawler && python server.py --port 8765")

async def main():
    await test_mcp_client_simulation()

if __name__ == "__main__":
    asyncio.run(main())