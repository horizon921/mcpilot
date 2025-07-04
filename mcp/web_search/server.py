#!/usr/bin/env python3
"""
网络搜索 MCP 服务器
提供多种搜索引擎的网络搜索功能
"""

import asyncio
import json
import logging
import argparse
import aiohttp
import re
import urllib.parse
from datetime import datetime
from typing import Any, Dict, List, Optional, cast
from bs4 import BeautifulSoup, Tag
import html
import httpx

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mcp.server import Server
from mcp.types import (
    CallToolRequest,
    Tool,
    TextContent,
)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("web-search-mcp-server")


class WebSearcher:
    """网络搜索核心类"""

    def __init__(self):
        """初始化搜索器"""
        self.search_history = []
        self.session: Optional[aiohttp.ClientSession] = None

        # 用户代理字符串
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    async def get_session(self) -> aiohttp.ClientSession:
        """获取HTTP会话"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(headers=self.headers)
        return self.session

    async def close_session(self):
        """关闭HTTP会话"""
        if self.session:
            await self.session.close()
            self.session = None

    async def search_duckduckgo(self, query: str, max_results: int = 10) -> Dict[str, Any]:
        """使用DuckDuckGo搜索"""
        try:
            session = await self.get_session()
            search_url = "https://html.duckduckgo.com/html/"
            data = {'q': query}

            async with session.post(search_url, data=data) as response:
                if response.status != 200:
                    return {"success": False, "error": f"搜索请求失败: HTTP {response.status}", "results": []}
                html_content = await response.text()
                results = self._parse_duckduckgo_results(html_content, max_results)
                return {"success": True, "query": query, "engine": "DuckDuckGo", "results": results, "timestamp": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"DuckDuckGo搜索失败: {e}")
            return {"success": False, "error": f"搜索失败: {str(e)}", "results": []}

    def _parse_duckduckgo_results(self, html_content: str, max_results: int) -> List[Dict[str, Any]]:
        """解析DuckDuckGo搜索结果"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            results: List[Dict[str, Any]] = []
            result_divs = soup.find_all('div', class_='result')
            if not result_divs:
                result_divs = soup.find_all('div', class_='web-result')
            if not result_divs:
                result_divs = soup.find_all('div', class_='results_links')

            for i, div in enumerate(result_divs[:max_results]):
                if not isinstance(div, Tag):
                    continue
                try:
                    title_link = cast(Optional[Tag], div.find('a', class_='result__a'))
                    if not title_link:
                        title_link = cast(Optional[Tag], div.find('a', class_='result-link'))
                    if not title_link:
                        h2_tag = div.find('h2')
                        if isinstance(h2_tag, Tag):
                            title_link = cast(Optional[Tag], h2_tag.find('a'))
                    if not title_link:
                        title_link = cast(Optional[Tag], div.find('a'))

                    if not title_link:
                        continue

                    title = title_link.get_text(strip=True)
                    url = title_link.get('href')

                    if url and isinstance(url, str) and url.startswith('/'):
                        url = 'https://duckduckgo.com' + url

                    snippet_div = cast(Optional[Tag], div.find('a', class_='result__snippet'))
                    if not snippet_div:
                        snippet_div = cast(Optional[Tag], div.find('div', class_='result__snippet'))
                    if not snippet_div:
                        snippet_div = cast(Optional[Tag], div.find('span', class_='result__snippet'))
                    
                    snippet = snippet_div.get_text(strip=True) if snippet_div else ""

                    if title and url and isinstance(url, str):
                        results.append({
                            "position": i + 1,
                            "title": html.unescape(title),
                            "url": url,
                            "snippet": html.unescape(snippet),
                            "source": "DuckDuckGo"
                        })
                except Exception as e:
                    logger.warning(f"解析单个DuckDuckGo结果时出错: {e}")
                    continue
            return results
        except Exception as e:
            logger.error(f"解析DuckDuckGo搜索结果失败: {e}")
            return []

    async def search_searxng(self, query: str, max_results: int = 10, instance: str = "https://search.bus-hit.me") -> Dict[str, Any]:
        """使用SearXNG搜索"""
        try:
            session = await self.get_session()
            search_url = f"{instance}/search"
            params = {'q': query, 'format': 'json', 'categories': 'general'}
            async with session.get(search_url, params=params) as response:
                if response.status != 200:
                    return {"success": False, "error": f"搜索请求失败: HTTP {response.status}", "results": []}
                data = await response.json()
                results = []
                for i, item in enumerate(data.get('results', [])[:max_results]):
                    results.append({
                        "position": i + 1,
                        "title": html.unescape(item.get('title', '')),
                        "url": item.get('url', ''),
                        "snippet": html.unescape(item.get('content', '')),
                        "source": f"SearXNG ({item.get('engine', 'unknown')})"
                    })
                return {"success": True, "query": query, "engine": "SearXNG", "results": results, "timestamp": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"SearXNG搜索失败: {e}")
            return {"success": False, "error": f"搜索失败: {str(e)}", "results": []}

    async def search_multiple_engines(self, query: str, max_results: int = 10) -> Dict[str, Any]:
        """使用多个搜索引擎并合并结果"""
        try:
            tasks = [self.search_duckduckgo(query, max_results), self.search_searxng(query, max_results)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            all_results, engines_used = [], []
            for result in results:
                if isinstance(result, dict) and result.get("success"):
                    all_results.extend(result.get("results", []))
                    engines_used.append(result.get("engine", "Unknown"))
            seen_urls, unique_results = set(), []
            for result in all_results:
                url = result.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    unique_results.append(result)
            for i, result in enumerate(unique_results[:max_results]):
                result["position"] = i + 1
            return {"success": True, "query": query, "engine": f"Multiple ({', '.join(engines_used)})", "results": unique_results[:max_results], "total_engines": len(engines_used), "timestamp": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"多引擎搜索失败: {e}")
            return {"success": False, "error": f"搜索失败: {str(e)}", "results": []}

    async def get_webpage_content(self, url: str, max_length: int = 2000) -> Dict[str, Any]:
        """获取网页内容"""
        try:
            session = await self.get_session()
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    return {"success": False, "error": f"无法访问网页: HTTP {response.status}", "content": ""}
                html_content = await response.text()
                soup = BeautifulSoup(html_content, 'html.parser')
                for script in soup(["script", "style"]):
                    script.decompose()
                text = soup.get_text()
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = ' '.join(chunk for chunk in chunks if chunk)
                if len(text) > max_length:
                    text = text[:max_length] + "..."
                return {"success": True, "url": url, "content": text, "length": len(text), "timestamp": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"获取网页内容失败: {e}")
            return {"success": False, "error": f"获取失败: {str(e)}", "content": ""}

    def add_to_history(self, search_data: Dict[str, Any]):
        """添加搜索记录到历史"""
        self.search_history.append({**search_data, "timestamp": datetime.now().isoformat()})
        if len(self.search_history) > 100:
            self.search_history = self.search_history[-100:]

    def get_search_history(self, limit: int = 10) -> Dict[str, Any]:
        """获取搜索历史"""
        return {"history": self.search_history[-limit:], "total_searches": len(self.search_history), "timestamp": datetime.now().isoformat()}

    def clear_search_history(self) -> Dict[str, Any]:
        """清空搜索历史"""
        count = len(self.search_history)
        self.search_history.clear()
        return {"success": True, "cleared_count": count, "timestamp": datetime.now().isoformat()}

# 创建服务器实例
server = Server("web-search-mcp-server")
searcher = WebSearcher()

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """列出可用的工具"""
    return [
        Tool(
            name="search_web",
            description="在网络上搜索信息，支持多个搜索引擎",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索关键词或问题"},
                    "max_results": {"type": "integer", "description": "最大结果数量，默认10", "default": 10, "minimum": 1, "maximum": 50},
                    "engine": {"type": "string", "description": "搜索引擎选择：duckduckgo, searxng, multiple", "enum": ["duckduckgo", "searxng", "multiple"], "default": "multiple"}
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_webpage",
            description="获取指定网页的文本内容",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "要获取内容的网页URL"},
                    "max_length": {"type": "integer", "description": "最大内容长度，默认2000字符", "default": 2000, "minimum": 100, "maximum": 10000}
                },
                "required": ["url"]
            }
        ),
        Tool(
            name="get_search_history",
            description="获取搜索历史记录",
            inputSchema={
                "type": "object",
                "properties": {"limit": {"type": "integer", "description": "获取历史记录的数量限制，默认10", "default": 10, "minimum": 1, "maximum": 100}}
            }
        ),
        Tool(
            name="clear_search_history",
            description="清空搜索历史记录",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    """处理工具调用"""
    try:
        if name == "search_web":
            query = arguments.get("query", "")
            max_results = arguments.get("max_results", 10)
            engine = arguments.get("engine", "multiple")
            if not query:
                return [TextContent(type="text", text="错误：请提供搜索关键词")]
            if engine == "duckduckgo":
                result = await searcher.search_duckduckgo(query, max_results)
            elif engine == "searxng":
                result = await searcher.search_searxng(query, max_results)
            else:
                result = await searcher.search_multiple_engines(query, max_results)
            searcher.add_to_history(result)
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]
        elif name == "get_webpage":
            url = arguments.get("url", "")
            max_length = arguments.get("max_length", 2000)
            if not url:
                return [TextContent(type="text", text="错误：请提供网页URL")]
            result = await searcher.get_webpage_content(url, max_length)
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]
        elif name == "get_search_history":
            result = searcher.get_search_history(arguments.get("limit", 10))
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]
        elif name == "clear_search_history":
            result = searcher.clear_search_history()
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]
        else:
            return [TextContent(type="text", text=f"未知工具: {name}")]
    except Exception as e:
        logger.error(f"工具调用失败: {e}")
        return [TextContent(type="text", text=f"调用失败: {str(e)}")]

app = FastAPI(title="网络搜索 MCP 服务器", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ToolCallRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}

class ToolResponse(BaseModel):
    success: bool
    data: Any = None
    error: Optional[str] = None

@app.get("/")
async def root():
    """根路径，返回服务器信息"""
    return {"name": "网络搜索 MCP 服务器", "version": "1.0.0", "description": "提供多种搜索引擎的网络搜索功能", "supported_engines": ["DuckDuckGo", "SearXNG"], "endpoints": {"tools": "/tools", "call_tool": "/call_tool", "mcp_info": "/mcp/info"}}

@app.get("/mcp/info")
async def mcp_info():
    """MCP服务器信息端点"""
    tools = await handle_list_tools()
    return {"name": "网络搜索 MCP 服务器", "version": "1.0.0", "protocol": "mcp", "server_type": "mcp_standard", "tools": [{"name": tool.name, "description": tool.description} for tool in tools]}


@app.get("/mcp-config-schema")
async def get_config_schema():
    """返回服务器配置参数的schema"""
    return {
        "server_name": "网络搜索",
        "description": "强大的网络搜索工具，聚合多个搜索引擎",
        "parameters": [],
        "instructions": [
            "这是一个网络搜索MCP服务器，无需额外配置",
            "支持DuckDuckGo和SearXNG搜索引擎"
        ]
    }


@app.get("/tools")
async def list_tools():
    """列出可用的工具"""
    tools = await handle_list_tools()
    return {"tools": [{"name": tool.name, "description": tool.description, "inputSchema": tool.inputSchema} for tool in tools]}

@app.post("/call_tool")
async def call_tool(request: ToolCallRequest) -> ToolResponse:
    """调用工具"""
    try:
        if request.tool_name == "search_web":
            query = request.arguments.get("query", "")
            max_results = request.arguments.get("max_results", 10)
            engine = request.arguments.get("engine", "multiple")
            if not query:
                return ToolResponse(success=False, error="请提供搜索关键词")
            if engine == "duckduckgo":
                result = await searcher.search_duckduckgo(query, max_results)
            elif engine == "searxng":
                result = await searcher.search_searxng(query, max_results)
            else:
                result = await searcher.search_multiple_engines(query, max_results)
            searcher.add_to_history(result)
            return ToolResponse(success=True, data=result)
        elif request.tool_name == "get_webpage":
            url = request.arguments.get("url", "")
            max_length = request.arguments.get("max_length", 2000)
            if not url:
                return ToolResponse(success=False, error="请提供网页URL")
            result = await searcher.get_webpage_content(url, max_length)
            return ToolResponse(success=True, data=result)
        elif request.tool_name == "get_search_history":
            result = searcher.get_search_history(request.arguments.get("limit", 10))
            return ToolResponse(success=True, data=result)
        elif request.tool_name == "clear_search_history":
            result = searcher.clear_search_history()
            return ToolResponse(success=True, data=result)
        else:
            return ToolResponse(success=False, error=f"未知工具: {request.tool_name}")
    except Exception as e:
        logger.error(f"工具调用失败: {e}")
        return ToolResponse(success=False, error=f"调用失败: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时的清理工作"""
    await searcher.close_session()

async def main():
    """运行HTTP服务器"""
    parser = argparse.ArgumentParser(description="网络搜索 MCP 服务器")
    parser.add_argument("--port", type=int, default=8767, help="服务器端口 (默认: 8767)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="服务器主机 (默认: 0.0.0.0)")
    args = parser.parse_args()
    logger.info(f"启动网络搜索 MCP 服务器 on {args.host}:{args.port}")
    config = uvicorn.Config(app=app, host=args.host, port=args.port, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())
