#!/usr/bin/env python3
"""
北大树洞爬虫 MCP 服务器
提供获取北大树洞帖子、关注内容等功能的 MCP 工具
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from urllib.parse import quote
import argparse

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mcp.server import InitializationOptions, NotificationOptions, Server
from mcp.types import (
    CallToolRequest,
    Tool,
    TextContent,
)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pku-treehole-crawler")

# 基础URL
BASE_URL = "https://treehole.pku.edu.cn/api"

class PKUTreeholeCrawler:
    """北大树洞爬虫类"""
    
    def __init__(self, auth_config: Optional[Dict[str, str]] = None):
        """
        初始化爬虫
        
        Args:
            auth_config: 认证配置字典，包含authorization, cookie, uuid, xsrf_token
                        如果不提供，则从环境变量获取
        """
        if auth_config:
            # 使用传入的认证配置
            self.authorization = auth_config.get("authorization")
            self.cookie = auth_config.get("cookie")
            self.uuid = auth_config.get("uuid")
            self.xsrf_token = auth_config.get("xsrf_token")
        else:
            # 从环境变量获取认证信息
            self.authorization = os.getenv("PKU_AUTHORIZATION")
            self.cookie = os.getenv("PKU_COOKIE")
            self.uuid = os.getenv("PKU_UUID")
            self.xsrf_token = os.getenv("PKU_XSRF_TOKEN")
        
        if not all([self.authorization, self.cookie, self.uuid, self.xsrf_token]):
            raise ValueError("缺少必要的认证信息，请通过环境变量或HTTP请求头提供: PKU_AUTHORIZATION, PKU_COOKIE, PKU_UUID, PKU_XSRF_TOKEN")
        
        self.headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            "Authorization": self.authorization,
            "Connection": "keep-alive",
            "Cookie": self.cookie,
            "DNT": "1",
            "Host": "treehole.pku.edu.cn",
            "Referer": "https://treehole.pku.edu.cn/web/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
            "Uuid": self.uuid,
            "X-XSRF-TOKEN": self.xsrf_token,
            "sec-ch-ua": '"Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"'
        }
    
    async def _make_request(self, url: str, params: Optional[Dict[str, Any]] = None, max_retries: int = 3) -> Dict[str, Any]:
        """发送HTTP请求，带重试机制"""
        for attempt in range(max_retries):
            try:
                # 设置更长的超时时间和重试机制
                timeout = httpx.Timeout(30.0, connect=10.0)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    logger.info(f"发送请求 (尝试 {attempt + 1}/{max_retries}): {url} with params: {params}")
                    response = await client.get(url, headers=self.headers, params=params or {})
                    logger.info(f"响应状态码: {response.status_code}")
                    response.raise_for_status()
                    return response.json()
                    
            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as e:
                logger.warning(f"网络连接问题 (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    logger.error(f"网络请求失败，已达到最大重试次数 - URL: {url}, 参数: {params}")
                    raise
                await asyncio.sleep(1)  # 等待1秒后重试
                
            except httpx.HTTPError as e:
                logger.error(f"HTTP请求失败 - URL: {url}, 参数: {params}, 错误: {e}")
                raise
                
            except json.JSONDecodeError as e:
                logger.error(f"JSON解析失败: {e}")
                raise
                
            except Exception as e:
                logger.error(f"请求异常: {e}")
                raise
        
        # 如果所有重试都失败了，抛出异常
        raise Exception(f"请求失败，已达到最大重试次数: {max_retries}")
    
    async def get_posts(
        self, 
        keyword: Optional[str] = None,
        label: Optional[int] = None,
        limit: int = 10,
        time_start: Optional[int] = None,
        include_replies: bool = False,
        include_images: bool = False
    ) -> Dict[str, Any]:
        """
        获取帖子
        
        Args:
            keyword: 搜索关键词
            label: 标签 (1:课程心得, 2:失物招领, 3:求职经历, 4:跳蚤市场)
            limit: 获取数量限制
            time_start: 起始时间戳，获取该时间到现在的帖子
            include_replies: 是否包含回复
            include_images: 是否包含图片
        """
        params: Dict[str, Any] = {
            "page": 1,
            "limit": min(limit, 25)  # API限制每页最多25条
        }
        
        if keyword:
            params["keyword"] = keyword
        if label:
            params["label"] = label
            
        url = f"{BASE_URL}/pku_hole"
        
        all_posts = []
        current_page = 1
        
        while len(all_posts) < limit:
            params["page"] = current_page
            data = await self._make_request(url, params)
            
            if not data.get("data", {}).get("data"):
                break
                
            posts = data["data"]["data"]
            
            for post in posts:
                # 如果指定了时间范围，过滤帖子
                if time_start and post["timestamp"] < time_start:
                    continue
                    
                # 处理图片
                if post["type"] == "image" and include_images:
                    try:
                        image_data = await self._get_image(post["pid"])
                        post["image_data"] = image_data
                    except Exception as e:
                        logger.warning(f"获取图片失败 (PID: {post['pid']}): {e}")
                        post["image_note"] = "这里有一张图片"
                elif post["type"] == "image" and not include_images:
                    post["image_note"] = "这里有一张图片"
                
                # 处理回复
                if include_replies and post["reply"] > 0:
                    try:
                        replies = await self._get_all_replies(post["pid"])
                        post["replies"] = replies
                    except Exception as e:
                        logger.warning(f"获取回复失败 (PID: {post['pid']}): {e}")
                        post["replies"] = []
                
                all_posts.append(post)
                
                if len(all_posts) >= limit:
                    break
            
            # 检查是否还有更多页
            if current_page >= data["data"]["last_page"]:
                break
                
            current_page += 1
        
        return {
            "posts": all_posts[:limit],
            "total_found": len(all_posts),
            "timestamp": int(datetime.now().timestamp())
        }
    
    async def _get_image(self, pid: int) -> str:
        """获取帖子图片"""
        url = f"{BASE_URL}/pku_image/{pid}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                # 返回base64编码的图片数据
                import base64
                return base64.b64encode(response.content).decode()
        except Exception as e:
            logger.error(f"获取图片失败: {e}")
            raise
    
    async def _get_all_replies(self, pid: int) -> List[Dict[str, Any]]:
        """获取帖子的所有回复"""
        all_replies = []
        current_page = 1
        
        while True:
            url = f"{BASE_URL}/pku_comment_v3/{pid}"
            params = {
                "page": current_page,
                "limit": 15,
                "sort": "asc"
            }
            
            data = await self._make_request(url, params)
            
            if not data.get("data", {}).get("data"):
                break
                
            replies = data["data"]["data"]
            all_replies.extend(replies)
            
            if current_page >= data["data"]["last_page"]:
                break
                
            current_page += 1
        
        return all_replies
    
    async def get_bookmark_groups(self) -> Dict[str, Any]:
        """获取关注分组"""
        url = f"{BASE_URL}/bookmark"
        data = await self._make_request(url)
        
        return {
            "bookmark_groups": data.get("data", []),
            "timestamp": int(datetime.now().timestamp())
        }
    
    async def get_followed_posts(
        self, 
        bookmark_id: Optional[int] = None,
        limit: int = 10,
        include_replies: bool = False,
        include_images: bool = False
    ) -> Dict[str, Any]:
        """
        获取关注的帖子
        
        Args:
            bookmark_id: 分组ID，不指定则获取所有关注的帖子
            limit: 获取数量限制
            include_replies: 是否包含回复
            include_images: 是否包含图片
        """
        params: Dict[str, Any] = {
            "page": 1,
            "limit": min(limit, 25)
        }
        
        if bookmark_id:
            params["bookmark_id"] = bookmark_id
            
        url = f"{BASE_URL}/follow_v2"
        
        all_posts = []
        current_page = 1
        
        while len(all_posts) < limit:
            params["page"] = current_page
            data = await self._make_request(url, params)
            
            if not data.get("data", {}).get("data"):
                break
                
            posts = data["data"]["data"]
            
            for post in posts:
                # 处理图片
                if post["type"] == "image" and include_images:
                    try:
                        image_data = await self._get_image(post["pid"])
                        post["image_data"] = image_data
                    except Exception as e:
                        logger.warning(f"获取图片失败 (PID: {post['pid']}): {e}")
                        post["image_note"] = "这里有一张图片"
                elif post["type"] == "image" and not include_images:
                    post["image_note"] = "这里有一张图片"
                
                # 处理回复
                if include_replies and post["reply"] > 0:
                    try:
                        replies = await self._get_all_replies(post["pid"])
                        post["replies"] = replies
                    except Exception as e:
                        logger.warning(f"获取回复失败 (PID: {post['pid']}): {e}")
                        post["replies"] = []
                
                all_posts.append(post)
                
                if len(all_posts) >= limit:
                    break
            
            # 检查是否还有更多页
            if current_page >= data["data"]["last_page"]:
                break
                
            current_page += 1
        
        return {
            "posts": all_posts[:limit],
            "total_found": len(all_posts),
            "bookmark_id": bookmark_id,
            "timestamp": int(datetime.now().timestamp())
        }

# 创建服务器实例
server = Server("pku-treehole-crawler")
crawler = None

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """列出可用的工具"""
    return [
        Tool(
            name="get_posts",
            description="获取北大树洞帖子，支持关键词、标签、时间范围筛选",
            inputSchema={
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "搜索关键词（可选）"
                    },
                    "label": {
                        "type": "integer",
                        "description": "标签筛选（可选）：1-课程心得，2-失物招领，3-求职经历，4-跳蚤市场",
                        "enum": [1, 2, 3, 4]
                    },
                    "limit": {
                        "type": "integer",
                        "description": "获取帖子数量（默认10）",
                        "default": 10,
                        "minimum": 1,
                        "maximum": 100
                    },
                    "time_start": {
                        "type": "integer",
                        "description": "起始时间戳，获取该时间到现在的帖子（可选）"
                    },
                    "include_replies": {
                        "type": "boolean",
                        "description": "是否包含每个帖子的回复（默认否）",
                        "default": False
                    },
                    "include_images": {
                        "type": "boolean", 
                        "description": "是否包含图片内容（默认否，若否则显示占位文本）",
                        "default": False
                    }
                }
            }
        ),
        Tool(
            name="get_bookmark_groups",
            description="获取账号的关注分组列表",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_followed_posts",
            description="获取账号关注的帖子，支持按分组筛选",
            inputSchema={
                "type": "object",
                "properties": {
                    "bookmark_id": {
                        "type": "integer",
                        "description": "分组ID（可选），不指定则获取所有关注的帖子"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "获取帖子数量（默认10）",
                        "default": 10,
                        "minimum": 1,
                        "maximum": 100
                    },
                    "include_replies": {
                        "type": "boolean",
                        "description": "是否包含每个帖子的回复（默认否）",
                        "default": False
                    },
                    "include_images": {
                        "type": "boolean",
                        "description": "是否包含图片内容（默认否，若否则显示占位文本）",
                        "default": False
                    }
                }
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    """处理工具调用"""
    global crawler
    
    if crawler is None:
        try:
            crawler = PKUTreeholeCrawler()
        except ValueError as e:
            return [TextContent(type="text", text=f"初始化失败: {str(e)}")]
    
    try:
        if name == "get_posts":
            result = await crawler.get_posts(
                keyword=arguments.get("keyword"),
                label=arguments.get("label"),
                limit=arguments.get("limit", 10),
                time_start=arguments.get("time_start"),
                include_replies=arguments.get("include_replies", False),
                include_images=arguments.get("include_images", False)
            )
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]
        
        elif name == "get_bookmark_groups":
            result = await crawler.get_bookmark_groups()
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]
        
        elif name == "get_followed_posts":
            result = await crawler.get_followed_posts(
                bookmark_id=arguments.get("bookmark_id"),
                limit=arguments.get("limit", 10),
                include_replies=arguments.get("include_replies", False),
                include_images=arguments.get("include_images", False)
            )
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]
        
        else:
            return [TextContent(type="text", text=f"未知工具: {name}")]
    
    except Exception as e:
        logger.error(f"工具调用失败: {e}")
        return [TextContent(type="text", text=f"调用失败: {str(e)}")]

# 创建FastAPI应用
app = FastAPI(title="北大树洞爬虫 MCP 服务器", version="0.1.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class ToolCallRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}

class ToolResponse(BaseModel):
    success: bool
    data: Any = None
    error: Optional[str] = None

# 全局爬虫实例
crawler_instance = None

def get_crawler_from_env():
    """从环境变量获取爬虫实例"""
    global crawler_instance
    if crawler_instance is None:
        try:
            crawler_instance = PKUTreeholeCrawler()
        except ValueError as e:
            raise HTTPException(status_code=500, detail=f"初始化失败: {str(e)}")
    return crawler_instance

def get_crawler_from_headers(
    pku_authorization: Optional[str] = None,
    pku_cookie: Optional[str] = None,
    pku_uuid: Optional[str] = None,
    pku_xsrf_token: Optional[str] = None
):
    """从请求头获取爬虫实例"""
    auth_config = {}
    
    # 检查是否提供了认证头
    if pku_authorization:
        auth_config["authorization"] = pku_authorization
    if pku_cookie:
        auth_config["cookie"] = pku_cookie
    if pku_uuid:
        auth_config["uuid"] = pku_uuid
    if pku_xsrf_token:
        auth_config["xsrf_token"] = pku_xsrf_token
    
    # 如果提供了认证头，使用它们创建新的爬虫实例
    if auth_config:
        try:
            return PKUTreeholeCrawler(auth_config)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"认证信息无效: {str(e)}")
    
    # 否则尝试使用环境变量
    return get_crawler_from_env()

@app.get("/")
async def root():
    """根路径，返回服务器信息"""
    return {
        "name": "北大树洞爬虫 MCP 服务器",
        "version": "0.1.0",
        "description": "提供获取北大树洞帖子、关注内容等功能的 MCP 工具",
        "endpoints": {
            "tools": "/tools",
            "call_tool": "/call_tool"
        }
    }

@app.get("/mcp/info")
async def mcp_info():
    """MCP服务器信息端点，用于客户端识别"""
    return {
        "name": "北大树洞爬虫 MCP 服务器",
        "version": "0.1.0",
        "protocol": "mcp",
        "server_type": "mcp_standard",
        "tools": [
            {
                "name": "get_posts",
                "description": "获取北大树洞帖子，支持关键词、标签、时间范围筛选"
            },
            {
                "name": "get_bookmark_groups",
                "description": "获取账号的关注分组列表"
            },
            {
                "name": "get_followed_posts",
                "description": "获取账号关注的帖子，支持按分组筛选"
            }
        ]
    }

@app.get("/mcp-config-schema")
async def get_config_schema():
    """返回服务器配置参数的schema，供客户端动态生成配置界面"""
    return {
        "server_name": "北大树洞爬虫",
        "description": "需要从浏览器获取北大树洞的认证信息",
        "parameters": [
            {
                "name": "authorization",
                "label": "Authorization Token",
                "type": "password",
                "description": "从浏览器开发者工具中获取的Authorization Header值（通常以'Bearer '开头）",
                "required": True,
                "location": "header",
                "header_name": "PKU-Authorization",
                "placeholder": "Bearer your_token_here"
            },
            {
                "name": "cookie",
                "label": "Cookie",
                "type": "password",
                "description": "完整的Cookie字符串，包含所有必要的会话信息",
                "required": True,
                "location": "header",
                "header_name": "PKU-Cookie",
                "placeholder": "完整的Cookie字符串"
            },
            {
                "name": "uuid",
                "label": "用户UUID",
                "type": "string",
                "description": "用户的唯一标识符UUID",
                "required": True,
                "location": "header",
                "header_name": "PKU-UUID",
                "placeholder": "用户UUID"
            },
            {
                "name": "xsrf_token",
                "label": "XSRF Token",
                "type": "password",
                "description": "防CSRF攻击的安全令牌",
                "required": True,
                "location": "header",
                "header_name": "PKU-XSRF-Token",
                "placeholder": "XSRF Token"
            }
        ],
        "instructions": [
            "1. 登录北大树洞网站 (https://treehole.pku.edu.cn)",
            "2. 按 F12 打开开发者工具，切换到'网络'选项卡",
            "3. 刷新页面或进行任意操作，找到发送到 treehole.pku.edu.cn 的请求",
            "4. 在请求头中复制对应的认证信息",
            "5. 注意：认证信息具有时效性，过期后需要重新获取"
        ]
    }

@app.get("/tools")
async def list_tools():
    """列出可用的工具"""
    tools = await handle_list_tools()
    return {
        "tools": [
            {
                "name": tool.name,
                "description": tool.description,
                "inputSchema": tool.inputSchema
            }
            for tool in tools
        ]
    }

@app.post("/call_tool")
async def call_tool(
    request: ToolCallRequest,
    pku_authorization: Optional[str] = Header(None, alias="PKU-Authorization"),
    pku_cookie: Optional[str] = Header(None, alias="PKU-Cookie"),
    pku_uuid: Optional[str] = Header(None, alias="PKU-UUID"),
    pku_xsrf_token: Optional[str] = Header(None, alias="PKU-XSRF-Token")
) -> ToolResponse:
    """调用工具"""
    try:
        crawler = get_crawler_from_headers(
            pku_authorization=pku_authorization,
            pku_cookie=pku_cookie,
            pku_uuid=pku_uuid,
            pku_xsrf_token=pku_xsrf_token
        )
        
        if request.tool_name == "get_posts":
            result = await crawler.get_posts(
                keyword=request.arguments.get("keyword"),
                label=request.arguments.get("label"),
                limit=request.arguments.get("limit", 10),
                time_start=request.arguments.get("time_start"),
                include_replies=request.arguments.get("include_replies", False),
                include_images=request.arguments.get("include_images", False)
            )
            return ToolResponse(success=True, data=result)
        
        elif request.tool_name == "get_bookmark_groups":
            result = await crawler.get_bookmark_groups()
            return ToolResponse(success=True, data=result)
        
        elif request.tool_name == "get_followed_posts":
            result = await crawler.get_followed_posts(
                bookmark_id=request.arguments.get("bookmark_id"),
                limit=request.arguments.get("limit", 10),
                include_replies=request.arguments.get("include_replies", False),
                include_images=request.arguments.get("include_images", False)
            )
            return ToolResponse(success=True, data=result)
        
        else:
            return ToolResponse(success=False, error=f"未知工具: {request.tool_name}")
    
    except Exception as e:
        logger.error(f"工具调用失败: {e}")
        return ToolResponse(success=False, error=f"调用失败: {str(e)}")

async def main():
    """运行HTTP服务器"""
    parser = argparse.ArgumentParser(description="北大树洞爬虫 MCP 服务器")
    parser.add_argument("--port", type=int, default=8765, help="服务器端口 (默认: 8765)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="服务器主机 (默认: 0.0.0.0)")
    args = parser.parse_args()
    
    logger.info(f"启动北大树洞爬虫 MCP 服务器 on {args.host}:{args.port}")
    
    # 使用uvicorn运行FastAPI应用
    config = uvicorn.Config(
        app=app,
        host=args.host,
        port=args.port,
        log_level="info"
    )
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())
