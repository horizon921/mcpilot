#!/usr/bin/env python3
"""
MCP 客户端测试工具
测试北大树洞爬虫 MCP 服务器的 MCP 协议通信
"""

import asyncio
import json
import os
import subprocess
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.types import TextContent

async def test_mcp_server():
    """测试MCP服务器的MCP协议通信"""
    
    # 服务器参数
    server_params = StdioServerParameters(
        command="python", 
        args=["server.py"],
        env={
            "PKU_AUTHORIZATION": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVlaG9sZS5wa3UuZWR1LmNuXC9jYXNfaWFhYV9sb2dpbiIsImlhdCI6MTc1MDYxMzgzNSwiZXhwIjoxNzUzMjA1ODM1LCJuYmYiOjE3NTA2MTM4MzUsImp0aSI6InpmYnlacGczYndmWFRFZG8iLCJzdWIiOiIyNDAwMDEzMTA2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0",
            "PKU_COOKIE": "UM_distinctid=1970ce980f081b-0cd6b92b4224d88-4c657b58-146d15-1970ce980f120be; pku_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVlaG9sZS5wa3UuZWR1LmNuXC9jYXNfaWFhYV9sb2dpbiIsImlhdCI6MTc1MDYxMzgzNSwiZXhwIjoxNzUzMjA1ODM1LCJuYmYiOjE3NTA2MTM4MzUsImp0aSI6InpmYnlacGczYndmWFRFZG8iLCJzdWIiOiIyNDAwMDEzMTA2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0; XSRF-TOKEN=eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0%3D; _session=eyJpdiI6InNueVN2K1ZCcng5UmdIMmw2bkN6eHc9PSIsInZhbHVlIjoia0dheDFSWDNHaS80TndpcjZzYWdLUWNOdTFKeFdacWRSUlFuMnJHemFXM3ZuUWpYaitoTkc1b3VCeEFYUEtoWnZEYThRbDlLaUlIY0gxVnROOFEzV09yR25lUE9Xbm9OWGZCYURQQVNub3NDMmlGVE1xaldZZTZTRCtsWWxzcHkiLCJtYWMiOiI4YzFlMjMxMzU4ZGNiMzIzYjY1M2JhMTlmMWIzNTk2YjcyMDZjOGRlMGE3ZjRjODU2NzRhNzZhNTQzNTlhYjUxIn0%3D",
            "PKU_UUID": "Web_PKUHOLE_2.0.0_WEB_UUID_a0ec3813-3eb2-44a0-9b18-fef9bb105803",
            "PKU_XSRF_TOKEN": "eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0="
        }
    )
    
    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                # 初始化
                await session.initialize()
                print("✅ MCP 服务器初始化成功")
                
                # 测试1: 列出可用工具
                print("\n=== 测试1: 列出可用工具 ===")
                tools = await session.list_tools()
                print(f"✅ 发现 {len(tools.tools)} 个工具:")
                for tool in tools.tools:
                    print(f"   - {tool.name}: {tool.description}")
                
                # 测试2: 调用 get_posts 工具
                print("\n=== 测试2: 调用 get_posts 工具 ===")
                result = await session.call_tool("get_posts", {
                    "keyword": "考试",
                    "limit": 3
                })
                print("✅ get_posts 调用成功")
                if result.content:
                    content = result.content[0]
                    if isinstance(content, TextContent):
                        data = json.loads(content.text)
                        print(f"   获取到 {len(data['posts'])} 个帖子")
                        for i, post in enumerate(data['posts'][:2]):
                            print(f"   帖子{i+1}: {post['text'][:50]}...")
                
                # 测试3: 调用 get_bookmark_groups 工具
                print("\n=== 测试3: 调用 get_bookmark_groups 工具 ===")
                result = await session.call_tool("get_bookmark_groups", {})
                print("✅ get_bookmark_groups 调用成功")
                if result.content:
                    content = result.content[0]
                    if isinstance(content, TextContent):
                        data = json.loads(content.text)
                        print(f"   获取到 {len(data['bookmark_groups'])} 个分组")
                        for group in data['bookmark_groups'][:3]:
                            print(f"   分组: {group['bookmark_name']}")
                
                # 测试4: 调用 get_followed_posts 工具
                print("\n=== 测试4: 调用 get_followed_posts 工具 ===")
                result = await session.call_tool("get_followed_posts", {
                    "limit": 2
                })
                print("✅ get_followed_posts 调用成功")
                if result.content:
                    content = result.content[0]
                    if isinstance(content, TextContent):
                        data = json.loads(content.text)
                        print(f"   获取到 {len(data['posts'])} 个关注的帖子")
                
                print("\n=== MCP 协议测试完成 ===")
                
    except Exception as e:
        print(f"❌ MCP 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mcp_server())