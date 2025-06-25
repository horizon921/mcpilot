#!/usr/bin/env python3
"""
北大树洞爬虫 MCP 服务器演示脚本
展示各种实际使用场景
"""

import asyncio
import json
import os
from server import PKUTreeholeCrawler

async def demo_scenarios():
    """演示各种使用场景"""
    
    # 设置认证信息 (使用你提供的认证信息)
    os.environ["PKU_AUTHORIZATION"] = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVlaG9sZS5wa3UuZWR1LmNuXC9jYXNfaWFhYV9sb2dpbiIsImlhdCI6MTc1MDYxMzgzNSwiZXhwIjoxNzUzMjA1ODM1LCJuYmYiOjE3NTA2MTM4MzUsImp0aSI6InpmYnlacGczYndmWFRFZG8iLCJzdWIiOiIyNDAwMDEzMTA2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0"
    os.environ["PKU_COOKIE"] = "UM_distinctid=1970ce980f081b-0cd6b92b4224d88-4c657b58-146d15-1970ce980f120be; pku_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC90cmVlaG9sZS5wa3UuZWR1LmNuXC9jYXNfaWFhYV9sb2dpliIsImlhdCI6MTc1MDYxMzgzNSwiZXhwIjoxNzUzMjA1ODM1LCJuYmYiOjE3NTA2MTM4MzUsImp0aSI6InpmYnlacGczYndmWFRFZG8iLCJzdWIiOiIyNDAwMDEzMTA2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.KHHJl1VeEA_hibWHR5vCPR_tNj7sCAj30WjS525BIv0; XSRF-TOKEN=eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0%3D; _session=eyJpdiI6InNueVN2K1ZCcng5UmdIMmw2bkN6eHc9PSIsInZhbHVlIjoia0dheDFSWDNHaS80TndpcjZzYWdLUWNOdTFKeFdacWRSUlFuMnJHemFXM3ZuUWpYaitoTkc1b3VCeEFYUEtoWnZEYThRbDlLaUlIY0gxVnROOFEzV09yR25lUE9Xbm9OWGZCYURQQVNub3NDMmlGVE1xaldZZTZTRCtsWWxzcHkiLCJtYWMiOiI4YzFlMjMxMzU4ZGNiMzIzYjY1M2JhMTlmMWIzNTk2YjcyMDZjOGRlMGE3ZjRjODU2NzRhNzZhNTQzNTlhYjUxIn0%3D"
    os.environ["PKU_UUID"] = "Web_PKUHOLE_2.0.0_WEB_UUID_a0ec3813-3eb2-44a0-9b18-fef9bb105803"
    os.environ["PKU_XSRF_TOKEN"] = "eyJpdiI6Ik54emlhdGNTNm1XakhvaTkyeDk5b3c9PSIsInZhbHVlIjoiMmVSem5OSjVGSDJaRFR4OGIzSVEzM0szT2xPZTlybGFaYTZrMG5BNlVNakN1Z2c4RXdiUkpyczlIaHAyWGQydmJNbzU1dVVnUlZneG1EN1ViaGV1R2xNQ2pqRElUS2preFRQT1liNDJBV0QxaVJ5bTBSOGdXVmx3SnEyNVpFT0IiLCJtYWMiOiI4YmM0ODg4YmZlZTM5YmNhMDQxZmQ1ZmJjOTdhOGYxYzA0OGYwYmE3NDA3OWQzNGRiYmE4ZDM1MWQ1OTRjZmRjIn0="
    
    try:
        crawler = PKUTreeholeCrawler()
        print("🚀 北大树洞爬虫演示开始")
        print("=" * 50)
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        print("请检查认证信息是否正确设置")
        return

    # 场景1: 学术信息收集
    print("\n📚 场景1: 学术信息收集")
    print("-" * 30)
    try:
        result = await crawler.get_posts(
            keyword="课程", 
            label=1,  # 课程心得
            limit=3
        )
        print(f"✅ 找到 {len(result['posts'])} 个课程相关帖子")
        for i, post in enumerate(result['posts'][:2]):
            print(f"   📖 帖子{i+1}: {post['text'][:60]}...")
    except Exception as e:
        print(f"❌ 学术信息收集失败: {e}")

    # 场景2: 跳蚤市场监控
    print("\n🛒 场景2: 跳蚤市场监控")
    print("-" * 30)
    try:
        result = await crawler.get_posts(
            label=4,  # 跳蚤市场
            limit=5
        )
        print(f"✅ 找到 {len(result['posts'])} 个跳蚤市场帖子")
        for i, post in enumerate(result['posts'][:3]):
            print(f"   💰 商品{i+1}: {post['text'][:60]}...")
    except Exception as e:
        print(f"❌ 跳蚤市场监控失败: {e}")

    # 场景3: 热点话题追踪
    print("\n🔥 场景3: 热点话题追踪")
    print("-" * 30)
    try:
        result = await crawler.get_posts(
            keyword="招生", 
            limit=3,
            include_replies=True
        )
        print(f"✅ 找到 {len(result['posts'])} 个招生话题帖子")
        for i, post in enumerate(result['posts'][:2]):
            print(f"   📢 话题{i+1}: {post['text'][:50]}...")
            if 'replies' in post and post['replies']:
                print(f"      💬 有 {len(post['replies'])} 个回复")
    except Exception as e:
        print(f"❌ 热点话题追踪失败: {e}")

    # 场景4: 个人关注管理
    print("\n👤 场景4: 个人关注管理")
    print("-" * 30)
    try:
        # 获取关注分组
        groups_result = await crawler.get_bookmark_groups()
        print(f"✅ 发现 {len(groups_result['bookmark_groups'])} 个关注分组:")
        for group in groups_result['bookmark_groups'][:3]:
            print(f"   📁 {group['bookmark_name']} (ID: {group['id']})")
        
        # 获取关注的帖子
        if groups_result['bookmark_groups']:
            first_group = groups_result['bookmark_groups'][0]
            posts_result = await crawler.get_followed_posts(
                bookmark_id=first_group['id'],
                limit=2
            )
            print(f"   📝 '{first_group['bookmark_name']}' 分组中有 {len(posts_result['posts'])} 个帖子")
            
    except Exception as e:
        print(f"❌ 个人关注管理失败: {e}")

    # 场景5: 图片内容分析（演示）
    print("\n🖼️ 场景5: 图片内容分析")
    print("-" * 30)
    try:
        result = await crawler.get_posts(
            label=4,  # 跳蚤市场通常有图片
            limit=3,
            include_images=False  # 演示中不真正下载图片
        )
        image_posts = [p for p in result['posts'] if p['type'] == 'image']
        print(f"✅ 找到 {len(image_posts)} 个包含图片的帖子")
        for i, post in enumerate(image_posts[:2]):
            print(f"   🖼️ 图片帖子{i+1}: {post['text'][:50]}...")
            if 'image_note' in post:
                print(f"      📝 {post['image_note']}")
                
    except Exception as e:
        print(f"❌ 图片内容分析失败: {e}")

    print("\n" + "=" * 50)
    print("🎉 演示完成！")
    print("\n💡 使用建议:")
    print("   1. 根据需求调整关键词和标签")
    print("   2. 合理设置获取数量限制")
    print("   3. 在需要时启用回复和图片获取")
    print("   4. 定期更新认证信息")
    print("   5. 遵守使用规范，避免过度请求")

if __name__ == "__main__":
    asyncio.run(demo_scenarios())