#!/usr/bin/env python3
"""
计算器 MCP 服务器
提供基础数学计算、高级数学函数等功能的 MCP 工具
"""

import asyncio
import json
import logging
import math
import re
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import argparse

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
logger = logging.getLogger("calculator-mcp-server")


class Calculator:
    """计算器核心类"""

    def __init__(self):
        """初始化计算器"""
        self.history = []
        self.memory = 0

    def basic_calculate(self, expression: str) -> Dict[str, Any]:
        """基础计算"""
        try:
            # 清理表达式
            expression = expression.strip()

            # 安全的数学表达式评估
            allowed_chars = set('0123456789+-*/().^ ')
            if not all(c in allowed_chars or c.isspace() for c in expression):
                # 检查是否包含数学函数
                math_functions = ['sin', 'cos', 'tan',
                                  'log', 'ln', 'sqrt', 'abs', 'exp']
                if not any(func in expression.lower() for func in math_functions):
                    raise ValueError("表达式包含不允许的字符")

            # 替换常见的数学符号
            expression = expression.replace('^', '**')
            expression = expression.replace('×', '*')
            expression = expression.replace('÷', '/')

            # 处理数学函数
            expression = self._process_math_functions(expression)

            # 计算结果
            result = eval(expression, {"__builtins__": {}}, {
                "sin": math.sin, "cos": math.cos, "tan": math.tan,
                "log": math.log10, "ln": math.log, "sqrt": math.sqrt,
                "abs": abs, "exp": math.exp, "pi": math.pi, "e": math.e
            })

            # 记录历史
            calculation_record = {
                "expression": expression,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
            self.history.append(calculation_record)

            return {
                "success": True,
                "expression": expression,
                "result": result,
                "type": "number" if isinstance(result, (int, float)) else "other"
            }

        except Exception as e:
            return {
                "success": False,
                "expression": expression,
                "error": str(e),
                "type": "error"
            }

    def _process_math_functions(self, expression: str) -> str:
        """处理数学函数"""
        # 处理常见的数学函数格式
        replacements = {
            r'sin\(([^)]+)\)': r'sin(\1)',
            r'cos\(([^)]+)\)': r'cos(\1)',
            r'tan\(([^)]+)\)': r'tan(\1)',
            r'log\(([^)]+)\)': r'log(\1)',
            r'ln\(([^)]+)\)': r'ln(\1)',
            r'sqrt\(([^)]+)\)': r'sqrt(\1)',
            r'abs\(([^)]+)\)': r'abs(\1)',
            r'exp\(([^)]+)\)': r'exp(\1)',
        }

        for pattern, replacement in replacements.items():
            expression = re.sub(pattern, replacement,
                                expression, flags=re.IGNORECASE)

        return expression

    def advanced_calculate(self, operation: str, **kwargs) -> Dict[str, Any]:
        """高级计算功能"""
        try:
            if operation == "factorial":
                n = kwargs.get("n", 0)
                if not isinstance(n, int) or n < 0:
                    raise ValueError("阶乘需要非负整数")
                result = math.factorial(n)

            elif operation == "power":
                base = kwargs.get("base", 0)
                exponent = kwargs.get("exponent", 1)
                result = base ** exponent

            elif operation == "root":
                number = kwargs.get("number", 0)
                root = kwargs.get("root", 2)
                if root == 0:
                    raise ValueError("根指数不能为0")
                result = number ** (1/root)

            elif operation == "percentage":
                value = kwargs.get("value", 0)
                percentage = kwargs.get("percentage", 0)
                result = value * (percentage / 100)

            elif operation == "compound_interest":
                principal = kwargs.get("principal", 0)
                rate = kwargs.get("rate", 0)
                time = kwargs.get("time", 0)
                n = kwargs.get("n", 1)  # 复利次数
                result = principal * (1 + rate/n) ** (n * time)

            else:
                raise ValueError(f"不支持的高级操作: {operation}")

            return {
                "success": True,
                "operation": operation,
                "parameters": kwargs,
                "result": result,
                "type": "advanced"
            }

        except Exception as e:
            return {
                "success": False,
                "operation": operation,
                "parameters": kwargs,
                "error": str(e),
                "type": "error"
            }

    def get_history(self, limit: int = 10) -> Dict[str, Any]:
        """获取计算历史"""
        return {
            "history": self.history[-limit:],
            "total_calculations": len(self.history),
            "timestamp": datetime.now().isoformat()
        }

    def clear_history(self) -> Dict[str, Any]:
        """清空历史记录"""
        count = len(self.history)
        self.history.clear()
        return {
            "success": True,
            "cleared_count": count,
            "timestamp": datetime.now().isoformat()
        }

    def memory_operation(self, operation: str, value: Optional[float] = None) -> Dict[str, Any]:
        """内存操作"""
        try:
            if operation == "store":
                if value is None:
                    raise ValueError("存储操作需要提供值")
                self.memory = value
                return {"success": True, "operation": "store", "memory": self.memory}

            elif operation == "recall":
                return {"success": True, "operation": "recall", "memory": self.memory}

            elif operation == "add":
                if value is None:
                    raise ValueError("加法操作需要提供值")
                self.memory += value
                return {"success": True, "operation": "add", "memory": self.memory}

            elif operation == "clear":
                self.memory = 0
                return {"success": True, "operation": "clear", "memory": self.memory}

            else:
                raise ValueError(f"不支持的内存操作: {operation}")

        except Exception as e:
            return {
                "success": False,
                "operation": operation,
                "error": str(e)
            }


# 创建服务器实例
server = Server("calculator-mcp-server")
calculator = Calculator()


@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """列出可用的工具"""
    return [
        Tool(
            name="basic_calculate",
            description="基础数学计算，支持四则运算、括号、数学函数等",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "数学表达式，如: 2+3*4, sin(30), sqrt(16), log(100)"
                    }
                },
                "required": ["expression"]
            }
        ),
        Tool(
            name="advanced_calculate",
            description="高级数学计算，包括阶乘、幂运算、开方、百分比、复利等",
            inputSchema={
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "description": "操作类型",
                        "enum": ["factorial", "power", "root", "percentage", "compound_interest"]
                    },
                    "n": {
                        "type": "integer",
                        "description": "阶乘的数字"
                    },
                    "base": {
                        "type": "number",
                        "description": "幂运算的底数"
                    },
                    "exponent": {
                        "type": "number",
                        "description": "幂运算的指数"
                    },
                    "number": {
                        "type": "number",
                        "description": "开方的数字"
                    },
                    "root": {
                        "type": "number",
                        "description": "开方的根指数，默认为2（平方根）"
                    },
                    "value": {
                        "type": "number",
                        "description": "百分比计算的基数"
                    },
                    "percentage": {
                        "type": "number",
                        "description": "百分比数值"
                    },
                    "principal": {
                        "type": "number",
                        "description": "复利计算的本金"
                    },
                    "rate": {
                        "type": "number",
                        "description": "复利计算的年利率（小数形式）"
                    },
                    "time": {
                        "type": "number",
                        "description": "复利计算的时间（年）"
                    }
                },
                "required": ["operation"]
            }
        ),
        Tool(
            name="get_history",
            description="获取计算历史记录",
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
            name="clear_history",
            description="清空计算历史记录",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="memory_operation",
            description="内存操作：存储、回忆、加法、清空",
            inputSchema={
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "description": "内存操作类型",
                        "enum": ["store", "recall", "add", "clear"]
                    },
                    "value": {
                        "type": "number",
                        "description": "操作的数值（store和add操作需要）"
                    }
                },
                "required": ["operation"]
            }
        )
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    """处理工具调用"""
    try:
        if name == "basic_calculate":
            result = calculator.basic_calculate(
                arguments.get("expression", ""))
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        elif name == "advanced_calculate":
            operation = arguments.get("operation")
            if not isinstance(operation, str):
                return [TextContent(type="text", text=json.dumps({"success": False, "error": "Missing or invalid 'operation' argument"}, ensure_ascii=False, indent=2))]
            # 移除operation参数，其余作为kwargs传递
            kwargs = {k: v for k, v in arguments.items() if k != "operation"}
            result = calculator.advanced_calculate(operation, **kwargs)
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        elif name == "get_history":
            result = calculator.get_history(arguments.get("limit", 10))
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        elif name == "clear_history":
            result = calculator.clear_history()
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        elif name == "memory_operation":
            operation = arguments.get("operation")
            if not isinstance(operation, str):
                return [TextContent(type="text", text=json.dumps({"success": False, "error": "Missing or invalid 'operation' argument"}, ensure_ascii=False, indent=2))]
            result = calculator.memory_operation(
                operation,
                arguments.get("value")
            )
            return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

        else:
            return [TextContent(type="text", text=f"未知工具: {name}")]

    except Exception as e:
        logger.error(f"工具调用失败: {e}")
        return [TextContent(type="text", text=f"调用失败: {str(e)}")]

# 创建FastAPI应用
app = FastAPI(title="计算器 MCP 服务器", version="1.0.0")

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
        "name": "计算器 MCP 服务器",
        "version": "1.0.0",
        "description": "提供基础和高级数学计算功能的 MCP 工具",
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
        "name": "计算器 MCP 服务器",
        "version": "1.0.0",
        "protocol": "mcp",
        "server_type": "mcp_standard",
        "tools": [
            {
                "name": "basic_calculate",
                "description": "基础数学计算，支持四则运算、括号、数学函数等"
            },
            {
                "name": "advanced_calculate",
                "description": "高级数学计算，包括阶乘、幂运算、开方、百分比、复利等"
            },
            {
                "name": "get_history",
                "description": "获取计算历史记录"
            },
            {
                "name": "clear_history",
                "description": "清空计算历史记录"
            },
            {
                "name": "memory_operation",
                "description": "内存操作：存储、回忆、加法、清空"
            }
        ]
    }


@app.get("/mcp-config-schema")
async def get_config_schema():
    """返回服务器配置参数的schema"""
    return {
        "server_name": "计算器",
        "description": "强大的数学计算工具，支持基础和高级数学运算",
        "parameters": [],
        "instructions": [
            "这是一个计算器MCP服务器，无需额外配置",
            "支持基础四则运算、数学函数、高级计算等功能",
            "可以记录计算历史和使用内存功能"
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
        if request.tool_name == "basic_calculate":
            result = calculator.basic_calculate(
                request.arguments.get("expression", ""))
            return ToolResponse(success=True, data=result)

        elif request.tool_name == "advanced_calculate":
            operation = request.arguments.get("operation")
            if not isinstance(operation, str):
                return ToolResponse(success=False, error="Missing or invalid 'operation' argument")
            kwargs = {k: v for k, v in request.arguments.items() if k !=
                      "operation"}
            result = calculator.advanced_calculate(operation, **kwargs)
            return ToolResponse(success=True, data=result)

        elif request.tool_name == "get_history":
            result = calculator.get_history(request.arguments.get("limit", 10))
            return ToolResponse(success=True, data=result)

        elif request.tool_name == "clear_history":
            result = calculator.clear_history()
            return ToolResponse(success=True, data=result)

        elif request.tool_name == "memory_operation":
            operation = request.arguments.get("operation")
            if not isinstance(operation, str):
                return ToolResponse(success=False, error="Missing or invalid 'operation' argument")
            result = calculator.memory_operation(
                operation,
                request.arguments.get("value")
            )
            return ToolResponse(success=True, data=result)

        else:
            return ToolResponse(success=False, error=f"未知工具: {request.tool_name}")

    except Exception as e:
        logger.error(f"工具调用失败: {e}")
        return ToolResponse(success=False, error=f"调用失败: {str(e)}")


async def main():
    """运行HTTP服务器"""
    parser = argparse.ArgumentParser(description="计算器 MCP 服务器")
    parser.add_argument("--port", type=int, default=8765,
                        help="服务器端口 (默认: 8765)")
    parser.add_argument("--host", type=str, default="0.0.0.0",
                        help="服务器主机 (默认: 0.0.0.0)")
    args = parser.parse_args()

    logger.info(f"启动计算器 MCP 服务器 on {args.host}:{args.port}")

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
