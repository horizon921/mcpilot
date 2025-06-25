#!/usr/bin/env python3
"""
测试HTTP端口通信的MCP服务器
"""

import asyncio
import json
import os
import httpx
import time

async def test_http_server():
    """测试HTTP MCP服务器"""
    
    # 设置认证信息
    os.environ["PKU_AUTHORIZATION"] = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVlaG9sZS5wa3UuZWR1LmNuXC9jYXNfaWFhYV9sb2dpbiIsImlhdCI6MTc1MDYxMzgzNSwiZXhwIjoxNzUzMjA1ODM1LCJuYmYiOjE3NTA2MTM4MzUsImp0aSI6InpmYnlacGczYndmWFRFZG8iLCJzdWIiOiIyNDAwMDEzMTA2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0"
    os.environ["PKU_COOKIE"] = "UM_distinctid=1970ce980f081b-0cd6b92b4224d88-4c657b58-146d15-1970ce980f120be; pku_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVleWhvbGUucGt1LmVkdS5jblwvY2FzX2lhYWFfbG9naW4iLCJpYXQiOjE3NTA2MTM4MzUsImV4cCI6MTc1MzIwNTgzNSwibmJmIjoxNzUwNjEzODM1LCJqdGkiOiJ6ZmJ5WnBnM2J3ZlhURWRvIiwic3ViIjoiMjQwMDAxMzEwNiIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0; XSRF-TOKEN=eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0%3D; _session=eyJpdiI6InNueVN2K1ZCcng5UmdIMmw2bkN6eHc9PSIsInZhbHVlIjoia0dheDFSWDNHaS80TndpcjZzYWdLUWNOdTFKeFdacWRSUlFuMnJHemFXM3ZuUWpYaitoTkc1b3VCeEFYUEtoWnZEYThRbDlLaUlIY0gxVnROOFEzV09yR25lUE9Xbm9OWGZCYURQQVNub3NDMmlGVE1xaldZZTZTRCtsWWxzcHkiLCJtYWMiOiI4YzFlMjMxMzU4ZGNiMzIzYjY1M2JhMTlmMWIzNTk2YjcyMDZjOGRlMGE3ZjRjODU2NzRhNzZhNTQzNTlhYjUxIn0%3D"
    os.environ["PKU_UUID"] = "Web_PKUHOLE_2.0.0_WEB_UUID_a0ec3813-3eb2-44a0-9b18-fef9bb105803"
    os.environ["PKU_XSRF_TOKEN"] = "eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0="
    
    base_url = "http://localhost:8765"
    
    print("🚀 开始测试HTTP MCP服务器")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        try:
            # 测试1: 检查服务器根路径
            print("\n=== 测试1: 检查服务器状态 ===")
            response = await client.get(f"{base_url}/")
            print(f"✅ 服务器响应: {response.status_code}")
            data = response.json()
            print(f"   服务器名称: {data['name']}")
            print(f"   版本: {data['version']}")
            
            # 测试2: 获取工具列表
            print("\n=== 测试2: 获取工具列表 ===")
            response = await client.get(f"{base_url}/tools")
            print(f"✅ 工具列表响应: {response.status_code}")
            data = response.json()
            print(f"   发现 {len(data['tools'])} 个工具:")
            for tool in data['tools']:
                print(f"   - {tool['name']}: {tool['description']}")
            
            # 测试3: 调用get_posts工具
            print("\n=== 测试3: 调用get_posts工具 ===")
            payload = {
                "tool_name": "get_posts",
                "arguments": {
                    "keyword": "考试",
                    "limit": 3
                }
            }
            response = await client.post(f"{base_url}/call_tool", json=payload)
            print(f"✅ get_posts调用响应: {response.status_code}")
            data = response.json()
            if data["success"]:
                posts = data["data"]["posts"]
                print(f"   获取到 {len(posts)} 个帖子:")
                for i, post in enumerate(posts[:2]):
                    print(f"   帖子{i+1}: {post['text'][:50]}...")
            else:
                print(f"   ❌ 调用失败: {data['error']}")
            
            # 测试4: 调用get_bookmark_groups工具
            print("\n=== 测试4: 调用get_bookmark_groups工具 ===")
            payload = {
                "tool_name": "get_bookmark_groups",
                "arguments": {}
            }
            response = await client.post(f"{base_url}/call_tool", json=payload)
            print(f"✅ get_bookmark_groups调用响应: {response.status_code}")
            data = response.json()
            if data["success"]:
                groups = data["data"]["bookmark_groups"]
                print(f"   获取到 {len(groups)} 个分组:")
                for group in groups[:3]:
                    print(f"   - {group['bookmark_name']} (ID: {group['id']})")
            else:
                print(f"   ❌ 调用失败: {data['error']}")
            
            # 测试5: 调用get_followed_posts工具  
            print("\n=== 测试5: 调用get_followed_posts工具 ===")
            payload = {
                "tool_name": "get_followed_posts",
                "arguments": {
                    "limit": 2
                }
            }
            response = await client.post(f"{base_url}/call_tool", json=payload)
            print(f"✅ get_followed_posts调用响应: {response.status_code}")
            data = response.json()
            if data["success"]:
                posts = data["data"]["posts"]
                print(f"   获取到 {len(posts)} 个关注的帖子")
            else:
                print(f"   ❌ 调用失败: {data['error']}")
                
        except httpx.ConnectError:
            print("❌ 无法连接到服务器，请确保服务器已启动")
            print("   启动命令: python server.py --port 8765")
        except Exception as e:
            print(f"❌ 测试失败: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 HTTP服务器测试完成！")

if __name__ == "__main__":
    asyncio.run(test_http_server())