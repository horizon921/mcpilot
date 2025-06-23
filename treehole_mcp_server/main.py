import os
import re
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, Query, Body
from pydantic import BaseModel, Field
import requests

# MCP协议元信息
MCP_META = {
    "name": "pku-treehole",
    "description": "北大树洞内容爬取MCP服务，支持关键词检索、获取最近树洞、按时间筛选等功能，支持图片内容识别。",
    "version": "1.1.0"
}

# 配置项（可通过环境变量或UI配置）
DEFAULT_TOKEN = os.environ.get("TREEHOLE_TOKEN", "")
DEFAULT_COOKIE = os.environ.get("TREEHOLE_COOKIE", "")
DEFAULT_UUID = os.environ.get("TREEHOLE_UUID", "")
DEFAULT_XSRF = os.environ.get("TREEHOLE_XSRF", "")

BASE_URL = "https://treehole.pku.edu.cn/api"

class TreeholeMessage(BaseModel):
    """树洞中的单条消息"""
    cid: Optional[int] = None  # 评论ID
    text: str
    timestamp: int
    is_image: bool = False
    image_placeholder: Optional[str] = None

class TreeholePost(BaseModel):
    pid: int
    text: str
    timestamp: int
    likenum: int
    reply: int
    messages: List[TreeholeMessage] = []  # 包含主贴和所有回复
    has_images: bool = False
    # 可扩展更多字段

class TreeholeResult(BaseModel):
    posts: List[TreeholePost]
    total: int

class TreeholeSearchParams(BaseModel):
    keyword: str = Field(..., description="关键词")
    page: int = Field(1, description="页码")
    limit: int = Field(25, description="每页数量")
    first_message_only: bool = Field(False, description="是否仅返回每个帖子的第一条消息（主贴）")
    token: Optional[str] = Field(None, description="Authorization token")
    cookie: Optional[str] = Field(None, description="Cookie")
    uuid: Optional[str] = Field(None, description="Uuid")
    xsrf: Optional[str] = Field(None, description="X-Xsrf-Token")

class TreeholeRecentParams(BaseModel):
    page: int = Field(1, description="页码")
    limit: int = Field(25, description="每页数量")
    first_message_only: bool = Field(False, description="是否仅返回每个帖子的第一条消息（主贴）")
    token: Optional[str] = Field(None, description="Authorization token")
    cookie: Optional[str] = Field(None, description="Cookie")
    uuid: Optional[str] = Field(None, description="Uuid")
    xsrf: Optional[str] = Field(None, description="X-Xsrf-Token")

class TreeholeByTimeParams(BaseModel):
    hours: int = Field(24, description="获取最近多少小时的树洞")
    page: int = Field(1, description="页码")
    limit: int = Field(25, description="每页数量")
    first_message_only: bool = Field(False, description="是否仅返回每个帖子的第一条消息（主贴）")
    token: Optional[str] = Field(None, description="Authorization token")
    cookie: Optional[str] = Field(None, description="Cookie")
    uuid: Optional[str] = Field(None, description="Uuid")
    xsrf: Optional[str] = Field(None, description="X-Xsrf-Token")

app = FastAPI(
    title=MCP_META["name"],
    description=MCP_META["description"],
    version=MCP_META["version"]
)

def process_text_content(text: str) -> tuple[str, bool]:
    """
    处理文本内容，识别图片并用占位符替换
    返回: (处理后的文本, 是否包含图片)
    """
    if not text:
        return "", False
    
    # 检查是否包含图片标记或链接
    image_patterns = [
        r'\[图片\]',
        r'<img[^>]*>',
        r'!\[.*?\]\(.*?\)',
        r'https?://[^\s]*\.(jpg|jpeg|png|gif|webp)',
        r'data:image/[^;]+;base64,[^\s]+'
    ]
    
    has_images = False
    processed_text = text
    
    for pattern in image_patterns:
        if re.search(pattern, processed_text, re.IGNORECASE):
            has_images = True
            processed_text = re.sub(pattern, '[🖼️图片]', processed_text, flags=re.IGNORECASE)
    
    return processed_text, has_images

def get_treehole_messages(post_data: dict, first_message_only: bool = False, debug: bool = False) -> List[TreeholeMessage]:
    """
    获取树洞的消息（主贴+回复，或仅主贴）
    
    Args:
        post_data: 帖子数据
        first_message_only: 是否仅返回第一条消息（主贴）
        debug: 是否开启调试模式
    """
    messages = []
    
    if debug:
        print(f"处理帖子 {post_data.get('pid', 'unknown')}, first_message_only={first_message_only}")
        print(f"帖子数据包含的键: {list(post_data.keys())}")
        print(f"reply字段值: {post_data.get('reply', 'N/A')}")
        # 检查所有可能的回复字段
        possible_comment_fields = ['comments', 'replies', 'comment', 'reply_list', 'children']
        for field in possible_comment_fields:
            if field in post_data:
                print(f"发现回复字段 '{field}', 类型: {type(post_data[field])}, 长度: {len(post_data[field]) if isinstance(post_data[field], (list, dict)) else 'N/A'}")
    
    # 添加主贴
    main_text, is_image = process_text_content(post_data.get("text", ""))
    main_message = TreeholeMessage(
        text=main_text,
        timestamp=post_data.get("timestamp", 0),
        is_image=is_image,
        image_placeholder="[🖼️图片]" if is_image else None
    )
    messages.append(main_message)
    
    # 如果只需要第一条消息，直接返回
    if first_message_only:
        if debug:
            print(f"仅返回主贴，消息数量: {len(messages)}")
        return messages
    
    # 尝试多种可能的回复字段名
    possible_comment_fields = ['comments', 'replies', 'comment', 'reply_list', 'children']
    comments = []
    
    for field in possible_comment_fields:
        if field in post_data and post_data[field]:
            comments = post_data[field]
            if debug:
                print(f"使用回复字段: {field}, 回复数量: {len(comments) if isinstance(comments, list) else 'N/A'}")
            break
    
    # 添加回复（如果有的话）
    if isinstance(comments, list):
        for comment in comments:
            comment_text, is_image = process_text_content(comment.get("text", ""))
            comment_message = TreeholeMessage(
                cid=comment.get("cid"),
                text=comment_text,
                timestamp=comment.get("timestamp", 0),
                is_image=is_image,
                image_placeholder="[🖼️图片]" if is_image else None
            )
            messages.append(comment_message)
    
    if debug:
        print(f"最终消息数量: {len(messages)}")
    
    return messages

def get_post_detail(pid: int, headers: dict) -> dict:
    """
    获取单个帖子的详细信息，包括所有回复
    """
    try:
        # 尝试多个可能的API端点
        possible_urls = [
            f"{BASE_URL}/pku_hole/{pid}",
            f"{BASE_URL}/pku_hole?pid={pid}",
            f"{BASE_URL}/hole/{pid}",
            f"{BASE_URL}/post/{pid}"
        ]
        
        for url in possible_urls:
            try:
                resp = requests.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    # 调试信息
                    print(f"成功从 {url} 获取帖子 {pid} 详情")
                    return data.get("data", data)
            except:
                continue
                
    except Exception as e:
        print(f"获取帖子 {pid} 详情时发生错误: {e}")
    
    return {}

def build_headers(token: Optional[str] = None, cookie: Optional[str] = None,
                 uuid: Optional[str] = None, xsrf: Optional[str] = None) -> dict:
    """构建请求头"""
    return {
        "Authorization": token or DEFAULT_TOKEN,
        "Cookie": cookie or DEFAULT_COOKIE,
        "Uuid": uuid or DEFAULT_UUID,
        "X-Xsrf-Token": xsrf or DEFAULT_XSRF,
        "User-Agent": "Mozilla/5.0 MCPilot-Treehole-MCP-Server"
    }

@app.get("/.well-known/mcp-meta.json")
def mcp_meta():
    return MCP_META

@app.get("/tools")
def list_tools():
    return [
        {
            "name": "search_treehole",
            "description": "根据关键词检索北大树洞内容",
            "parameters": TreeholeSearchParams.schema(),
            "response": TreeholeResult.schema()
        },
        {
            "name": "get_recent_treehole",
            "description": "获取最近的树洞内容（不需要关键词）",
            "parameters": TreeholeRecentParams.schema(),
            "response": TreeholeResult.schema()
        },
        {
            "name": "get_treehole_by_time",
            "description": "根据时间获取最近若干小时的树洞内容",
            "parameters": TreeholeByTimeParams.schema(),
            "response": TreeholeResult.schema()
        }
    ]

@app.post("/tools/search_treehole", response_model=TreeholeResult)
def search_treehole(params: TreeholeSearchParams = Body(...)):
    """
    关键词检索树洞内容
    """
    headers = build_headers(params.token, params.cookie, params.uuid, params.xsrf)
    url = f"{BASE_URL}/pku_hole?page={params.page}&limit={params.limit}&keyword={params.keyword}"
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            return TreeholeResult(posts=[], total=0)
        
        data = resp.json()
        posts = []
        
        for post in data.get("data", {}).get("data", []):
            # 如果需要完整内容且帖子有回复，获取帖子详情
            if not params.first_message_only and post.get("reply", 0) > 0:
                detailed_post = get_post_detail(post["pid"], headers)
                if detailed_post:
                    post = detailed_post  # 使用详细数据
            
            # 获取消息内容（根据参数决定是否只要第一条）
            messages = get_treehole_messages(post, params.first_message_only, debug=True)
            main_text, has_images = process_text_content(post.get("text", ""))
            
            tree_post = TreeholePost(
                pid=post["pid"],
                text=main_text,
                timestamp=post["timestamp"],
                likenum=post["likenum"],
                reply=post["reply"],
                messages=messages,
                has_images=has_images
            )
            posts.append(tree_post)
        
        total = data.get("data", {}).get("total", 0)
        return TreeholeResult(posts=posts, total=total)
        
    except Exception as e:
        print(f"搜索树洞时发生错误: {e}")
        return TreeholeResult(posts=[], total=0)

@app.post("/tools/get_recent_treehole", response_model=TreeholeResult)
def get_recent_treehole(params: TreeholeRecentParams = Body(...)):
    """
    获取最近的树洞内容（不需要关键词）
    """
    headers = build_headers(params.token, params.cookie, params.uuid, params.xsrf)
    url = f"{BASE_URL}/pku_hole?page={params.page}&limit={params.limit}"
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            return TreeholeResult(posts=[], total=0)
        
        data = resp.json()
        posts = []
        
        for post in data.get("data", {}).get("data", []):
            # 如果需要完整内容且帖子有回复，获取帖子详情
            if not params.first_message_only and post.get("reply", 0) > 0:
                detailed_post = get_post_detail(post["pid"], headers)
                if detailed_post:
                    post = detailed_post  # 使用详细数据
            
            # 获取消息内容（根据参数决定是否只要第一条）
            messages = get_treehole_messages(post, params.first_message_only, debug=True)
            main_text, has_images = process_text_content(post.get("text", ""))
            
            tree_post = TreeholePost(
                pid=post["pid"],
                text=main_text,
                timestamp=post["timestamp"],
                likenum=post["likenum"],
                reply=post["reply"],
                messages=messages,
                has_images=has_images
            )
            posts.append(tree_post)
        
        total = data.get("data", {}).get("total", 0)
        return TreeholeResult(posts=posts, total=total)
        
    except Exception as e:
        print(f"获取最近树洞时发生错误: {e}")
        return TreeholeResult(posts=[], total=0)

@app.post("/tools/get_treehole_by_time", response_model=TreeholeResult)
def get_treehole_by_time(params: TreeholeByTimeParams = Body(...)):
    """
    根据时间获取最近若干小时的树洞内容
    """
    headers = build_headers(params.token, params.cookie, params.uuid, params.xsrf)
    
    # 计算时间范围
    now = datetime.now()
    start_time = now - timedelta(hours=params.hours)
    start_timestamp = int(start_time.timestamp())
    
    # 使用时间筛选的API（可能需要根据实际API调整）
    url = f"{BASE_URL}/pku_hole?page={params.page}&limit={params.limit}&start_time={start_timestamp}"
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            # 如果时间筛选API不支持，则获取最近的内容并手动筛选
            url = f"{BASE_URL}/pku_hole?page={params.page}&limit={params.limit * 2}"
            resp = requests.get(url, headers=headers)
            if resp.status_code != 200:
                return TreeholeResult(posts=[], total=0)
        
        data = resp.json()
        posts = []
        
        for post in data.get("data", {}).get("data", []):
            # 检查时间范围
            post_timestamp = post.get("timestamp", 0)
            if post_timestamp < start_timestamp:
                continue
                
            # 如果需要完整内容且帖子有回复，获取帖子详情
            if not params.first_message_only and post.get("reply", 0) > 0:
                detailed_post = get_post_detail(post["pid"], headers)
                if detailed_post:
                    post = detailed_post  # 使用详细数据
            
            # 获取消息内容（根据参数决定是否只要第一条）
            messages = get_treehole_messages(post, params.first_message_only, debug=True)
            main_text, has_images = process_text_content(post.get("text", ""))
            
            tree_post = TreeholePost(
                pid=post["pid"],
                text=main_text,
                timestamp=post["timestamp"],
                likenum=post["likenum"],
                reply=post["reply"],
                messages=messages,
                has_images=has_images
            )
            posts.append(tree_post)
        
        # 限制返回数量
        posts = posts[:params.limit]
        total = len(posts)
        
        return TreeholeResult(posts=posts, total=total)
        
    except Exception as e:
        print(f"按时间获取树洞时发生错误: {e}")
        return TreeholeResult(posts=[], total=0)

# 可选：暴露/config接口，供前端UI配置token等
class TreeholeConfig(BaseModel):
    token: str = ""
    cookie: str = ""
    uuid: str = ""
    xsrf: str = ""

@app.get("/config", response_model=TreeholeConfig)
def get_config():
    return TreeholeConfig(
        token=DEFAULT_TOKEN,
        cookie=DEFAULT_COOKIE,
        uuid=DEFAULT_UUID,
        xsrf=DEFAULT_XSRF
    )

@app.post("/config", response_model=TreeholeConfig)
def set_config(cfg: TreeholeConfig):
    # 实际部署时可写入文件或环境变量，这里仅演示
    global DEFAULT_TOKEN, DEFAULT_COOKIE, DEFAULT_UUID, DEFAULT_XSRF
    DEFAULT_TOKEN = cfg.token
    DEFAULT_COOKIE = cfg.cookie
    DEFAULT_UUID = cfg.uuid
    DEFAULT_XSRF = cfg.xsrf
    return cfg

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)