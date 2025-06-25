#!/usr/bin/env python3
"""
北大树洞爬虫 MCP 服务器测试脚本
"""

import asyncio
import json
import os
import sys
from server import PKUTreeholeCrawler

async def test_crawler():
    """测试爬虫功能"""
    
    # 设置认证信息
    os.environ["PKU_AUTHORIZATION"] = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVlaG9sZS5wa3UuZWR1LmNuXC9jYXNfaWFhYV9sb2dpbiIsImlhdCI6MTc1MDYxMzgzNSwiZXhwIjoxNzUzMjA1ODM1LCJuYmYiOjE3NTA2MTM4MzUsImp0aSI6InpmYnlacGczYndmWFRFZG8iLCJzdWIiOiIyNDAwMDEzMTA2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0"
    os.environ["PKU_COOKIE"] = "UM_distinctid=1970ce980f081b-0cd6b92b4224d88-4c657b58-146d15-1970ce980f120be; pku_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVlaG9sZS5wa3UuZWR1LmNuXC9jYXNfaWFhYV9sb2dpbiIsImlhdCI6MTc1MDYxMzgzNSwiZXhwIjoxNzUzMjA1ODM1LCJuYmYiOjE3NTA2MTM4MzUsImp0aSI6InpmYnlacGczYndmWFRFZG8iLCJzdWIiOiIyNDAwMDEzMTA2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0; XSRF-TOKEN=eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0%3D; _session=eyJpdiI6InNueVN2K1ZCcng5UmdIMmw2bkN6eHc9PSIsInZhbHVlIjoia0dheDFSWDNHaS80TndpcjZzYWdLUWNOdTFKeFdacWRSUlFuMnJHemFXM3ZuUWpYaitoTkc1b3VCeEFYUEtoWnZEYThRbDlLaUlIY0gxVnROOFEzV09yR25lUE9Xbm9OWGZCYURQQVNub3NDMmlGVE1xaldZZTZTRCtsWWxzcHkiLCJtYWMiOiI4YzFlMjMxMzU4ZGNiMzIzYjY1M2JhMTlmMWIzNTk2YjcyMDZjOGRlMGE3ZjRjODU2NzRhNzZhNTQzNTlhYjUxIn0%3D"
    os.environ["PKU_UUID"] = "Web_PKUHOLE_2.0.0_WEB_UUID_a0ec3813-3eb2-44a0-9b18-fef9bb105803"
    os.environ["PKU_XSRF_TOKEN"] = "eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0="
    
    try:
        crawler = PKUTreeholeCrawler()
        print("✅ 爬虫初始化成功")
    except Exception as e:
        print(f"❌ 爬虫初始化失败: {e}")
        return
    
    # 测试1: 获取最新帖子
    print("\n=== 测试1: 获取最新帖子 ===")
    try:
        result = await crawler.get_posts(limit=5)
        print(f"✅ 获取到 {len(result['posts'])} 个帖子")
        
        # 显示第一个帖子的基本信息
        if result['posts']:
            first_post = result['posts'][0]
            print(f"   第一个帖子 PID: {first_post['pid']}")
            print(f"   内容: {first_post['text'][:50]}...")
            print(f"   类型: {first_post['type']}")
            print(f"   回复数: {first_post['reply']}")
            
    except Exception as e:
        print(f"❌ 获取帖子失败: {e}")
    
    # 测试2: 关键词搜索
    print("\n=== 测试2: 关键词搜索 ===")
    try:
        result = await crawler.get_posts(keyword="期末", limit=3)
        print(f"✅ 搜索到 {len(result['posts'])} 个含有'期末'的帖子")
        
        for i, post in enumerate(result['posts'][:2]):
            print(f"   帖子{i+1}: {post['text'][:50]}...")
            
    except Exception as e:
        print(f"❌ 关键词搜索失败: {e}")
    
    # 测试3: 获取关注分组
    print("\n=== 测试3: 获取关注分组 ===")
    try:
        result = await crawler.get_bookmark_groups()
        print(f"✅ 获取到 {len(result['bookmark_groups'])} 个关注分组")
        
        for group in result['bookmark_groups'][:3]:
            print(f"   分组ID: {group['id']}, 名称: {group['bookmark_name']}")
            
    except Exception as e:
        print(f"❌ 获取关注分组失败: {e}")
    
    # 测试4: 获取关注的帖子
    print("\n=== 测试4: 获取关注的帖子 ===")
    try:
        result = await crawler.get_followed_posts(limit=3)
        print(f"✅ 获取到 {len(result['posts'])} 个关注的帖子")
        
        for i, post in enumerate(result['posts'][:2]):
            print(f"   关注帖子{i+1}: {post['text'][:50]}...")
            
    except Exception as e:
        print(f"❌ 获取关注帖子失败: {e}")
    
    # 测试5: 获取带回复的帖子
    print("\n=== 测试5: 获取带回复的帖子 ===")
    try:
        result = await crawler.get_posts(limit=2, include_replies=True)
        print(f"✅ 获取到 {len(result['posts'])} 个帖子（包含回复）")
        
        for i, post in enumerate(result['posts']):
            if 'replies' in post and post['replies']:
                print(f"   帖子{i+1} 有 {len(post['replies'])} 个回复")
                print(f"   第一个回复: {post['replies'][0]['text'][:30]}...")
            else:
                print(f"   帖子{i+1} 没有回复")
                
    except Exception as e:
        print(f"❌ 获取带回复帖子失败: {e}")
    
    # 测试6: 标签筛选
    print("\n=== 测试6: 标签筛选（跳蚤市场）===")
    try:
        result = await crawler.get_posts(label=4, limit=3)
        print(f"✅ 获取到 {len(result['posts'])} 个跳蚤市场帖子")
        
        for i, post in enumerate(result['posts'][:2]):
            print(f"   市场帖子{i+1}: {post['text'][:50]}...")
            
    except Exception as e:
        print(f"❌ 标签筛选失败: {e}")
    
    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    asyncio.run(test_crawler())