#!/usr/bin/env python3
"""
Python 代码解释器 MCP 服务器
提供安全的Python代码执行功能的 MCP 工具
"""

import asyncio
import json
import logging
import sys
import io
import ast
import time
import argparse
from datetime import datetime
from typing import Any, Dict, List, Optional
import traceback

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
logger = logging.getLogger("python-interpreter-mcp-server")


class PythonInterpreter:
    """Python解释器核心类"""

    def __init__(self):
        """初始化Python解释器"""
        self.execution_history = []
        self.global_vars = {}

        # 创建受限的执行环境
        self.safe_globals = {
            '__builtins__': {
                # 基本函数
                'abs': abs, 'all': all, 'any': any, 'bin': bin, 'bool': bool,
                'chr': chr, 'dict': dict, 'dir': dir, 'divmod': divmod,
                'enumerate': enumerate, 'filter': filter, 'float': float,
                'format': format, 'frozenset': frozenset, 'hex': hex,
                'int': int, 'isinstance': isinstance, 'issubclass': issubclass,
                'iter': iter, 'len': len, 'list': list, 'map': map,
                'max': max, 'min': min, 'next': next, 'oct': oct,
                'ord': ord, 'pow': pow, 'print': print, 'range': range,
                'reversed': reversed, 'round': round, 'set': set,
                'slice': slice, 'sorted': sorted, 'str': str, 'sum': sum,
                'tuple': tuple, 'type': type, 'zip': zip,

                # 异常
                'Exception': Exception, 'ValueError': ValueError,
                'TypeError': TypeError, 'IndexError': IndexError,
                'KeyError': KeyError, 'AttributeError': AttributeError,
                'ZeroDivisionError': ZeroDivisionError, 'ImportError': ImportError,
            },

            # 安全的模块
            'math': __import__('math'),
            'random': __import__('random'),
            'datetime': __import__('datetime'),
            'json': __import__('json'),
            're': __import__('re'),
            'collections': __import__('collections'),
            'itertools': __import__('itertools'),
            'functools': __import__('functools'),
        }

    def is_safe_code(self, code: str) -> tuple[bool, str]:
        """检查代码是否安全"""
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return False, f"语法错误: {e}"

        # 危险的AST节点类型
        dangerous_nodes = [
            ast.Import,  # import语句
            ast.ImportFrom,  # from ... import语句
        ]

        # 危险的函数调用
        dangerous_calls = [
            'exec', 'eval', 'compile', '__import__', 'open', 'file',
            'input', 'raw_input', 'reload', 'vars', 'locals', 'globals',
            'getattr', 'setattr', 'delattr', 'hasattr'
        ]

        for node in ast.walk(tree):
            # 检查危险节点
            if any(isinstance(node, dangerous_type) for dangerous_type in dangerous_nodes):
                return False, f"不允许的操作: {type(node).__name__}"

            # 检查函数调用
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id in dangerous_calls:
                        return False, f"不允许的函数调用: {node.func.id}"
                elif isinstance(node.func, ast.Attribute):
                    # 检查属性访问，如 os.system
                    if hasattr(node.func, 'attr'):
                        if node.func.attr in ['system', 'popen', 'spawn', 'fork']:
                            return False, f"不允许的方法调用: {node.func.attr}"

            # 检查属性访问
            if isinstance(node, ast.Attribute):
                dangerous_attrs = ['__class__', '__bases__',
                                   '__subclasses__', '__globals__']
                if node.attr in dangerous_attrs:
                    return False, f"不允许访问属性: {node.attr}"

        return True, ""

    def execute_code(self, code: str, timeout: float = 10, persistent: bool = False) -> Dict[str, Any]:
        """安全执行Python代码"""
        try:
            # 检查代码安全性
            is_safe, error_msg = self.is_safe_code(code)
            if not is_safe:
                return {
                    "success": False,
                    "error": f"代码安全检查失败: {error_msg}",
                    "output": "",
                    "execution_time": 0,
                    "type": "security_error"
                }

            # 捕获输出
            old_stdout = sys.stdout
            old_stderr = sys.stderr
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()

            start_time = time.time()

            # 重定向输出
            sys.stdout = stdout_capture
            sys.stderr = stderr_capture

            # 选择变量作用域
            if persistent:
                # 持久化模式：使用全局变量
                local_vars = self.global_vars
            else:
                # 临时模式：使用新的局部变量
                local_vars = {}

            # 执行代码
            exec(code, self.safe_globals.copy(), local_vars)

            execution_time = time.time() - start_time

            # 获取输出
            stdout_output = stdout_capture.getvalue()
            stderr_output = stderr_capture.getvalue()

            output = ""
            if stdout_output:
                output += stdout_output
            if stderr_output:
                output += f"\n[错误输出]\n{stderr_output}"

            # 如果是持久化模式，更新全局变量
            if persistent:
                self.global_vars = local_vars

            # 记录执行历史
            execution_record = {
                "code": code,
                "success": True,
                "output": output.strip(),
                "execution_time": execution_time,
                "persistent": persistent,
                "timestamp": datetime.now().isoformat()
            }
            self.execution_history.append(execution_record)

            # 显示变量（仅显示用户定义的变量）
            variables_info = ""
            user_vars = {k: v for k, v in local_vars.items()
                         if not k.startswith('_') and k not in self.safe_globals}
            if user_vars:
                variables_info = "\n[变量]\n"
                for key, value in user_vars.items():
                    try:
                        variables_info += f"{key} = {repr(value)}\n"
                    except:
                        variables_info += f"{key} = <无法显示>\n"

            return {
                "success": True,
                "error": None,
                "output": output.strip(),
                "variables": variables_info.strip(),
                "execution_time": execution_time,
                "persistent": persistent,
                "type": "execution"
            }

        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"{type(e).__name__}: {str(e)}"

            # 获取详细错误信息
            stderr_output = stderr_capture.getvalue()
            if stderr_output:
                error_msg += f"\n{stderr_output}"

            # 记录执行历史
            execution_record = {
                "code": code,
                "success": False,
                "error": error_msg,
                "output": stdout_capture.getvalue(),
                "execution_time": execution_time,
                "persistent": persistent,
                "timestamp": datetime.now().isoformat()
            }
            self.execution_history.append(execution_record)

            return {
                "success": False,
                "error": error_msg,
                "output": stdout_capture.getvalue(),
                "variables": "",
                "execution_time": execution_time,
                "persistent": persistent,
                "type": "error"
            }

        finally:
            # 恢复输出
            sys.stdout = old_stdout
            sys.stderr = old_stderr

    def get_variables(self) -> Dict[str, Any]:
        """获取当前全局变量"""
        user_vars = {k: v for k, v in self.global_vars.items()
                     if not k.startswith('_')}

        variables_list = []
        for key, value in user_vars.items():
            try:
                variables_list.append({
                    "name": key,
                    "value": repr(value),
                    "type": type(value).__name__
                })
            except:
                variables_list.append({
                    "name": key,
                    "value": "<无法显示>",
                    "type": type(value).__name__
                })

        return {
            "variables": variables_list,
            "count": len(variables_list),
            "timestamp": datetime.now().isoformat()
        }

    def clear_variables(self) -> Dict[str, Any]:
        """清空全局变量"""
        count = len([k for k in self.global_vars.keys()
                    if not k.startswith('_')])
        self.global_vars.clear()

        return {
            "success": True,
            "cleared_count": count,
            "timestamp": datetime.now().isoformat()
        }

    def get_history(self, limit: int = 10) -> Dict[str, Any]:
        """获取执行历史"""
        return {
            "history": self.execution_history[-limit:],
            "total_executions": len(self.execution_history),
            "timestamp": datetime.now().isoformat()
        }

    def clear_history(self) -> Dict[str, Any]:
        """清空执行历史"""
        count = len(self.execution_history)
        self.execution_history.clear()

        return {
            "success": True,
            "cleared_count": count,
            "timestamp": datetime.now().isoformat()
        }


# 创建服务器实例
server = Server("python-interpreter-mcp-server")
interpreter = PythonInterpreter()


@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """列出可用的工具"""
    return [
        Tool(
            name="execute_python",
            description="执行Python代码并返回结果，支持基础数学运算、数据处理等安全操作",
            inputSchema={
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "要执行的Python代码"
                    },
                    "timeout": {
                        "type": "number",
                        "description": "执行超时时间（秒），默认10秒",
                        "default": 10,
                        "minimum": 1,
                        "maximum": 60
                    },
                    "persistent": {
                        "type": "boolean",
                        "description": "是否保持变量状态（持久化模式），默认false",
                        "default": False
                    }
                },
                "required": ["code"]
            }
        ),
        Tool(
            name="get_variables",
            description="获取当前Python环境中的全局变量",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="clear_variables",
            description="清空Python环境中的全局变量",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_execution_history",
            description="获取Python代码执行历史记录",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "获取历史记录的数量限制，默认10",
                        "default": 10,
                        "minimum": 1,
                        "maximum": 100
                    }
                }
            }
        ),
        Tool(
            name="clear_execution_history",
            description="清空Python代码执行历史记录",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    """处理工具调用"""
    try:
        if name == "execute_python":
            result = interpreter.execute_code(
                arguments.get("code", ""),
                arguments.get("timeout", 10),
                arguments.get("persistent", False)
            )
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        elif name == "get_variables":
            result = interpreter.get_variables()
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        elif name == "clear_variables":
            result = interpreter.clear_variables()
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        elif name == "get_execution_history":
            result = interpreter.get_history(arguments.get("limit", 10))
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        elif name == "clear_execution_history":
            result = interpreter.clear_history()
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        else:
            return [TextContent(type="text", text=f"未知工具: {name}")]

    except Exception as e:
        logger.error(f"工具调用失败: {e}")
        return [TextContent(type="text", text=f"调用失败: {str(e)}")]

# 创建FastAPI应用
app = FastAPI(title="Python解释器 MCP 服务器", version="1.0.0")

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


@app.get("/")
async def root():
    """根路径，返回服务器信息"""
    return {
        "name": "Python解释器 MCP 服务器",
        "version": "1.0.0",
        "description": "提供安全的Python代码执行功能的 MCP 工具",
        "endpoints": {
            "tools": "/tools",
            "call_tool": "/call_tool",
            "mcp_info": "/mcp/info"
        }
    }


@app.get("/mcp/info")
async def mcp_info():
    """MCP服务器信息端点"""
    return {
        "name": "Python解释器 MCP 服务器",
        "version": "1.0.0",
        "protocol": "mcp",
        "server_type": "mcp_standard",
        "tools": [
            {
                "name": "execute_python",
                "description": "执行Python代码并返回结果，支持基础数学运算、数据处理等安全操作"
            },
            {
                "name": "get_variables",
                "description": "获取当前Python环境中的全局变量"
            },
            {
                "name": "clear_variables",
                "description": "清空Python环境中的全局变量"
            },
            {
                "name": "get_execution_history",
                "description": "获取Python代码执行历史记录"
            },
            {
                "name": "clear_execution_history",
                "description": "清空Python代码执行历史记录"
            }
        ]
    }


@app.get("/mcp-config-schema")
async def get_config_schema():
    """返回服务器配置参数的schema"""
    return {
        "server_name": "Python解释器",
        "description": "安全的Python代码执行环境，支持基础数学运算和数据处理",
        "parameters": [],
        "instructions": [
            "这是一个Python解释器MCP服务器，提供安全的代码执行环境",
            "支持基础Python语法、数学运算、数据处理等功能",
            "出于安全考虑，限制了文件操作、网络访问和模块导入",
            "支持持久化变量模式和执行历史记录"
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
async def call_tool(request: ToolCallRequest) -> ToolResponse:
    """调用工具"""
    try:
        if request.tool_name == "execute_python":
            result = interpreter.execute_code(
                request.arguments.get("code", ""),
                request.arguments.get("timeout", 10),
                request.arguments.get("persistent", False)
            )
            return ToolResponse(success=True, data=result)

        elif request.tool_name == "get_variables":
            result = interpreter.get_variables()
            return ToolResponse(success=True, data=result)

        elif request.tool_name == "clear_variables":
            result = interpreter.clear_variables()
            return ToolResponse(success=True, data=result)

        elif request.tool_name == "get_execution_history":
            result = interpreter.get_history(
                request.arguments.get("limit", 10))
            return ToolResponse(success=True, data=result)

        elif request.tool_name == "clear_execution_history":
            result = interpreter.clear_history()
            return ToolResponse(success=True, data=result)

        else:
            return ToolResponse(success=False, error=f"未知工具: {request.tool_name}")

    except Exception as e:
        logger.error(f"工具调用失败: {e}")
        return ToolResponse(success=False, error=f"调用失败: {str(e)}")


async def main():
    """运行HTTP服务器"""
    parser = argparse.ArgumentParser(description="Python解释器 MCP 服务器")
    parser.add_argument("--port", type=int, default=8766,
                        help="服务器端口 (默认: 8766)")
    parser.add_argument("--host", type=str, default="0.0.0.0",
                        help="服务器主机 (默认: 0.0.0.0)")
    args = parser.parse_args()

    logger.info(f"启动Python解释器 MCP 服务器 on {args.host}:{args.port}")

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
