#!/usr/bin/env python3
"""
超级计算器 MCP 服务器 - 矩阵和微积分专业版
专注于高级矩阵运算和微积分计算
"""

import asyncio
import json
import sys
import math
import cmath
from typing import Dict, List, Any, Optional
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import numpy as np
    import scipy.linalg as linalg
    import scipy.integrate as integrate
    import scipy.optimize as optimize
    import sympy as sp
    from sympy import symbols, diff, integrate as sp_integrate, limit, series, Matrix
    HAS_ADVANCED = True
except ImportError:
    logger.warning(
        "NumPy/SciPy/SymPy not available, some features will be limited")
    HAS_ADVANCED = False


class SuperCalculatorServer:
    """超级计算器服务器 - 矩阵和微积分专业版"""

    def __init__(self):
        self.name = "super-calculator-advanced"
        self.version = "3.0.0"
        self.tools = [
            {
                "name": "calculate",
                "description": "执行基础数学计算，支持四则运算、三角函数、对数、指数等",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "expression": {
                            "type": "string",
                            "description": "要计算的数学表达式"
                        }
                    },
                    "required": ["expression"]
                }
            },
            {
                "name": "matrix_advanced",
                "description": "高级矩阵运算：基础运算、特征值分解、奇异值分解、矩阵分解、线性方程组求解等",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": [
                                "add", "subtract", "multiply", "transpose", "determinant", "inverse",
                                "eigenvalues", "eigenvectors", "svd", "lu_decomposition", "qr_decomposition",
                                "cholesky", "rank", "trace", "norm", "condition_number", "solve_linear",
                                "matrix_power", "matrix_exp", "matrix_log", "pseudo_inverse"
                            ],
                            "description": "矩阵运算类型"
                        },
                        "matrix_a": {
                            "type": "array",
                            "description": "第一个矩阵"
                        },
                        "matrix_b": {
                            "type": "array",
                            "description": "第二个矩阵或向量（如果需要）"
                        },
                        "power": {
                            "type": "number",
                            "description": "矩阵幂运算的指数"
                        }
                    },
                    "required": ["operation", "matrix_a"]
                }
            },
            {
                "name": "calculus",
                "description": "微积分运算：导数、积分、极限、级数展开、多元微积分等",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": [
                                "derivative", "integral", "definite_integral", "limit", "series_expansion",
                                "partial_derivative", "gradient", "divergence", "curl", "laplacian",
                                "numerical_derivative", "numerical_integral", "solve_ode"
                            ],
                            "description": "微积分运算类型"
                        },
                        "expression": {
                            "type": "string",
                            "description": "数学表达式（使用 x, y, z 作为变量）"
                        },
                        "variable": {
                            "type": "string",
                            "description": "求导或积分的变量，默认为 x"
                        },
                        "lower_limit": {
                            "type": "number",
                            "description": "定积分下限"
                        },
                        "upper_limit": {
                            "type": "number",
                            "description": "定积分上限"
                        },
                        "point": {
                            "type": "number",
                            "description": "极限计算的趋近点"
                        },
                        "order": {
                            "type": "number",
                            "description": "导数阶数或级数展开阶数"
                        }
                    },
                    "required": ["operation", "expression"]
                }
            },
            {
                "name": "complex_numbers",
                "description": "复数运算，支持加法、减法、乘法、除法、模长、相位角等",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": ["add", "subtract", "multiply", "divide", "magnitude", "phase", "conjugate"],
                            "description": "复数运算类型"
                        },
                        "complex_a": {
                            "type": "array",
                            "description": "第一个复数 [实部, 虚部]"
                        },
                        "complex_b": {
                            "type": "array",
                            "description": "第二个复数 [实部, 虚部]（如果需要）"
                        }
                    },
                    "required": ["operation", "complex_a"]
                }
            },
            {
                "name": "unit_conversion",
                "description": "单位转换，支持长度、重量、温度、时间等单位转换",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "category": {
                            "type": "string",
                            "enum": ["length", "weight", "temperature", "time", "area", "volume"],
                            "description": "单位类别"
                        },
                        "value": {
                            "type": "number",
                            "description": "要转换的数值"
                        },
                        "from_unit": {
                            "type": "string",
                            "description": "源单位"
                        },
                        "to_unit": {
                            "type": "string",
                            "description": "目标单位"
                        }
                    },
                    "required": ["category", "value", "from_unit", "to_unit"]
                }
            }
        ]

    def calculate(self, expression: str) -> str:
        """执行基础数学计算"""
        try:
            # 安全的数学表达式计算
            allowed_names = {
                k: v for k, v in math.__dict__.items() if not k.startswith("__")
            }
            allowed_names.update({
                "abs": abs,
                "round": round,
                "min": min,
                "max": max,
                "sum": sum,
                "pow": pow,
                "factorial": math.factorial,
                "gcd": math.gcd,
                "lcm": math.lcm if hasattr(math, 'lcm') else lambda a, b: abs(a * b) // math.gcd(a, b)
            })

            # 替换常见的数学符号
            expression = expression.replace("^", "**")
            expression = expression.replace("√", "sqrt")

            # 计算结果
            result = eval(expression, {"__builtins__": {}}, allowed_names)

            return f"计算结果: {expression} = {result}"

        except Exception as e:
            return f"计算错误: {str(e)}"

    def matrix_advanced(self, args: Dict[str, Any]) -> str:
        """高级矩阵运算"""
        try:
            operation = args["operation"]
            matrix_a = args["matrix_a"]

            if not HAS_ADVANCED:
                return "错误: 需要安装 NumPy/SciPy 来执行高级矩阵运算"

            # 转换为 numpy 数组
            A = np.array(matrix_a, dtype=complex)

            # 基础矩阵运算
            if operation == "transpose":
                result = np.transpose(A)
                return f"矩阵转置:\n{result}"

            elif operation == "determinant":
                if A.shape[0] != A.shape[1]:
                    return "错误: 只有方阵才能计算行列式"
                det = np.linalg.det(A)
                return f"行列式: {det}"

            elif operation == "inverse":
                if A.shape[0] != A.shape[1]:
                    return "错误: 只有方阵才能计算逆矩阵"
                try:
                    inv = np.linalg.inv(A)
                    return f"逆矩阵:\n{inv}"
                except np.linalg.LinAlgError:
                    return "错误: 矩阵不可逆（奇异矩阵）"

            elif operation == "pseudo_inverse":
                pinv = np.linalg.pinv(A)
                return f"伪逆矩阵:\n{pinv}"

            elif operation == "rank":
                rank = np.linalg.matrix_rank(A)
                return f"矩阵秩: {rank}"

            elif operation == "trace":
                if A.shape[0] != A.shape[1]:
                    return "错误: 只有方阵才能计算迹"
                trace = np.trace(A)
                return f"矩阵的迹: {trace}"

            elif operation == "norm":
                norm_fro = np.linalg.norm(A, 'fro')  # Frobenius范数
                norm_2 = np.linalg.norm(A, 2)        # 2-范数
                return f"Frobenius范数: {norm_fro}\n2-范数: {norm_2}"

            elif operation == "condition_number":
                if A.shape[0] != A.shape[1]:
                    return "错误: 只有方阵才能计算条件数"
                cond = np.linalg.cond(A)
                return f"条件数: {cond}"

            # 特征值和特征向量
            elif operation == "eigenvalues":
                if A.shape[0] != A.shape[1]:
                    return "错误: 只有方阵才能计算特征值"
                eigenvals = np.linalg.eigvals(A)
                return f"特征值:\n{eigenvals}"

            elif operation == "eigenvectors":
                if A.shape[0] != A.shape[1]:
                    return "错误: 只有方阵才能计算特征向量"
                eigenvals, eigenvecs = np.linalg.eig(A)
                return f"特征值:\n{eigenvals}\n\n特征向量:\n{eigenvecs}"

            # 矩阵分解
            elif operation == "svd":
                U, s, Vt = np.linalg.svd(A)
                return f"奇异值分解 (SVD):\nU矩阵:\n{U}\n\n奇异值:\n{s}\n\nV^T矩阵:\n{Vt}"

            elif operation == "lu_decomposition":
                if A.shape[0] != A.shape[1]:
                    return "错误: LU分解需要方阵"
                P, L, U = linalg.lu(A)
                return f"LU分解:\nP矩阵:\n{P}\n\nL矩阵:\n{L}\n\nU矩阵:\n{U}"

            elif operation == "qr_decomposition":
                Q, R = np.linalg.qr(A)
                return f"QR分解:\nQ矩阵:\n{Q}\n\nR矩阵:\n{R}"

            elif operation == "cholesky":
                if A.shape[0] != A.shape[1]:
                    return "错误: Cholesky分解需要方阵"
                try:
                    L = np.linalg.cholesky(A)
                    return f"Cholesky分解:\nL矩阵:\n{L}"
                except np.linalg.LinAlgError:
                    return "错误: 矩阵不是正定的，无法进行Cholesky分解"

            # 矩阵函数
            elif operation == "matrix_power":
                if A.shape[0] != A.shape[1]:
                    return "错误: 矩阵幂运算需要方阵"
                power = args.get("power", 2)
                result = np.linalg.matrix_power(A, int(power))
                return f"矩阵的{power}次幂:\n{result}"

            elif operation == "matrix_exp":
                if A.shape[0] != A.shape[1]:
                    return "错误: 矩阵指数需要方阵"
                result = linalg.expm(A)
                return f"矩阵指数 exp(A):\n{result}"

            elif operation == "matrix_log":
                if A.shape[0] != A.shape[1]:
                    return "错误: 矩阵对数需要方阵"
                try:
                    result = linalg.logm(A)
                    return f"矩阵对数 log(A):\n{result}"
                except Exception:
                    return "错误: 无法计算矩阵对数（可能存在负特征值）"

            # 需要两个矩阵的运算
            elif operation in ["add", "subtract", "multiply", "solve_linear"]:
                if operation == "solve_linear":
                    if "matrix_b" not in args:
                        return "错误: 线性方程组求解需要系数矩阵和常数向量"
                    b = np.array(args["matrix_b"])
                    try:
                        x = np.linalg.solve(A, b)
                        return f"线性方程组解:\n{x}"
                    except np.linalg.LinAlgError:
                        return "错误: 系统无解或有无穷多解"

                else:
                    if "matrix_b" not in args:
                        return f"错误: {operation} 运算需要两个矩阵"

                    B = np.array(args["matrix_b"], dtype=complex)

                    if operation == "add":
                        if A.shape != B.shape:
                            return "错误: 矩阵加法要求两个矩阵形状相同"
                        result = A + B
                        return f"矩阵加法:\n{result}"

                    elif operation == "subtract":
                        if A.shape != B.shape:
                            return "错误: 矩阵减法要求两个矩阵形状相同"
                        result = A - B
                        return f"矩阵减法:\n{result}"

                    elif operation == "multiply":
                        if A.shape[1] != B.shape[0]:
                            return "错误: 矩阵乘法要求第一个矩阵的列数等于第二个矩阵的行数"
                        result = np.dot(A, B)
                        return f"矩阵乘法:\n{result}"

            else:
                return f"错误: 不支持的矩阵运算 {operation}"

        except Exception as e:
            return f"矩阵运算错误: {str(e)}"

    def calculus(self, args: Dict[str, Any]) -> str:
        """微积分运算"""
        try:
            operation = args["operation"]
            expression = args["expression"]
            variable = args.get("variable", "x")

            if not HAS_ADVANCED:
                return "错误: 需要安装 SymPy 来执行符号微积分运算"

            # 创建符号变量
            x, y, z, t = symbols('x y z t')
            var_map = {'x': x, 'y': y, 'z': z, 't': t}

            if variable not in var_map:
                return f"错误: 不支持的变量 {variable}"

            var = var_map[variable]

            try:
                # 解析表达式
                expr = sp.sympify(expression)
            except Exception:
                return f"错误: 无法解析表达式 {expression}"

            # 导数运算
            if operation == "derivative":
                order = args.get("order", 1)
                result = diff(expr, var, order)
                return f"{order}阶导数 d^{order}/d{variable}^{order}({expression}) = {result}"

            elif operation == "partial_derivative":
                result = diff(expr, var)
                return f"偏导数 ∂/∂{variable}({expression}) = {result}"

            elif operation == "gradient":
                # 计算梯度（对所有变量求偏导）
                grad = []
                for v in [x, y, z]:
                    if v in expr.free_symbols:
                        grad.append(diff(expr, v))
                return f"梯度 ∇({expression}) = {grad}"

            # 积分运算
            elif operation == "integral":
                result = sp_integrate(expr, var)
                return f"不定积分 ∫{expression} d{variable} = {result} + C"

            elif operation == "definite_integral":
                lower = args.get("lower_limit")
                upper = args.get("upper_limit")
                if lower is None or upper is None:
                    return "错误: 定积分需要上下限"
                result = sp_integrate(expr, (var, lower, upper))
                return f"定积分 ∫[{lower}→{upper}] {expression} d{variable} = {result}"

            # 极限运算
            elif operation == "limit":
                point = args.get("point", 0)
                result = limit(expr, var, point)
                return f"极限 lim({variable}→{point}) {expression} = {result}"

            # 级数展开
            elif operation == "series_expansion":
                point = args.get("point", 0)
                order = args.get("order", 6)
                result = series(expr, var, point, order)
                return f"泰勒级数展开（在{variable}={point}处，{order}阶）:\n{result}"

            # 数值计算
            elif operation == "numerical_derivative":
                if not all(isinstance(args.get(k), (int, float)) for k in ["point"]):
                    return "错误: 数值导数需要指定计算点"
                point = args["point"]
                # 使用数值方法计算导数
                h = 1e-8
                f = sp.lambdify(var, expr, 'numpy')
                try:
                    derivative_val = (f(point + h) - f(point - h)) / (2 * h)
                    return f"数值导数在{variable}={point}处: {derivative_val}"
                except Exception:
                    return "错误: 无法计算数值导数"

            elif operation == "numerical_integral":
                lower = args.get("lower_limit")
                upper = args.get("upper_limit")
                if lower is None or upper is None:
                    return "错误: 数值积分需要上下限"

                # 使用scipy进行数值积分
                f = sp.lambdify(var, expr, 'numpy')
                try:
                    result, error = integrate.quad(f, lower, upper)
                    return f"数值积分 ∫[{lower}→{upper}] {expression} d{variable} = {result} (误差估计: {error})"
                except Exception:
                    return "错误: 无法计算数值积分"

            # 向量微积分
            elif operation == "divergence":
                # 计算散度（需要向量场）
                if not all(v in expr.free_symbols for v in [x, y, z]):
                    return "错误: 散度计算需要三维向量场"
                # 这里简化处理，假设表达式是向量场的一个分量
                div_x = diff(expr, x)
                return f"散度分量 ∂/∂x({expression}) = {div_x}"

            elif operation == "laplacian":
                # 计算拉普拉斯算子
                laplacian = 0
                for v in [x, y, z]:
                    if v in expr.free_symbols:
                        laplacian += diff(expr, v, 2)
                return f"拉普拉斯算子 ∇²({expression}) = {laplacian}"

            else:
                return f"错误: 不支持的微积分运算 {operation}"

        except Exception as e:
            return f"微积分运算错误: {str(e)}"

    def complex_numbers(self, args: Dict[str, Any]) -> str:
        """复数运算"""
        try:
            operation = args["operation"]
            complex_a = args["complex_a"]

            # 创建复数
            z1 = complex(complex_a[0], complex_a[1])

            if operation == "magnitude":
                result = abs(z1)
                return f"复数 {z1} 的模长: {result}"

            elif operation == "phase":
                result = cmath.phase(z1)
                return f"复数 {z1} 的相位角: {result} 弧度 ({math.degrees(result)} 度)"

            elif operation == "conjugate":
                result = z1.conjugate()
                return f"复数 {z1} 的共轭: {result}"

            else:
                # 需要两个复数的运算
                if "complex_b" not in args:
                    return f"错误: {operation} 运算需要两个复数"

                complex_b = args["complex_b"]
                z2 = complex(complex_b[0], complex_b[1])

                if operation == "add":
                    result = z1 + z2
                    return f"复数加法: {z1} + {z2} = {result}"

                elif operation == "subtract":
                    result = z1 - z2
                    return f"复数减法: {z1} - {z2} = {result}"

                elif operation == "multiply":
                    result = z1 * z2
                    return f"复数乘法: {z1} × {z2} = {result}"

                elif operation == "divide":
                    if z2 == 0:
                        return "错误: 除数不能为零"
                    result = z1 / z2
                    return f"复数除法: {z1} ÷ {z2} = {result}"

                else:
                    return f"错误: 不支持的复数运算 {operation}"

        except Exception as e:
            return f"复数运算错误: {str(e)}"

    def unit_conversion(self, args: Dict[str, Any]) -> str:
        """单位转换"""
        try:
            category = args["category"]
            value = args["value"]
            from_unit = args["from_unit"]
            to_unit = args["to_unit"]

            # 单位转换表
            conversions = {
                "length": {
                    "mm": 0.001,
                    "cm": 0.01,
                    "m": 1.0,
                    "km": 1000.0,
                    "in": 0.0254,
                    "ft": 0.3048,
                    "yd": 0.9144,
                    "mile": 1609.344
                },
                "weight": {
                    "mg": 0.000001,
                    "g": 0.001,
                    "kg": 1.0,
                    "lb": 0.453592,
                    "oz": 0.0283495,
                    "ton": 1000.0
                },
                "temperature": {
                    # 特殊处理温度转换
                },
                "time": {
                    "ms": 0.001,
                    "s": 1.0,
                    "min": 60.0,
                    "h": 3600.0,
                    "day": 86400.0,
                    "week": 604800.0,
                    "month": 2592000.0,
                    "year": 31536000.0
                },
                "area": {
                    "mm2": 0.000001,
                    "cm2": 0.0001,
                    "m2": 1.0,
                    "km2": 1000000.0,
                    "in2": 0.00064516,
                    "ft2": 0.092903,
                    "acre": 4046.86
                },
                "volume": {
                    "ml": 0.001,
                    "l": 1.0,
                    "m3": 1000.0,
                    "gal": 3.78541,
                    "qt": 0.946353,
                    "pt": 0.473176,
                    "cup": 0.236588,
                    "fl_oz": 0.0295735
                }
            }

            if category == "temperature":
                # 温度转换特殊处理
                if from_unit == "C" and to_unit == "F":
                    result = value * 9/5 + 32
                elif from_unit == "F" and to_unit == "C":
                    result = (value - 32) * 5/9
                elif from_unit == "C" and to_unit == "K":
                    result = value + 273.15
                elif from_unit == "K" and to_unit == "C":
                    result = value - 273.15
                elif from_unit == "F" and to_unit == "K":
                    result = (value - 32) * 5/9 + 273.15
                elif from_unit == "K" and to_unit == "F":
                    result = (value - 273.15) * 9/5 + 32
                else:
                    return f"错误: 不支持的温度单位转换 {from_unit} -> {to_unit}"

            else:
                if category not in conversions:
                    return f"错误: 不支持的单位类别 {category}"

                units = conversions[category]

                if from_unit not in units or to_unit not in units:
                    return f"错误: 不支持的单位 {from_unit} 或 {to_unit}"

                # 转换到基本单位，再转换到目标单位
                base_value = value * units[from_unit]
                result = base_value / units[to_unit]

            return f"单位转换: {value} {from_unit} = {result} {to_unit}"

        except Exception as e:
            return f"单位转换错误: {str(e)}"

    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """处理请求"""
        try:
            method = request.get("method")
            params = request.get("params", {})
            request_id = request.get("id")

            if method == "initialize":
                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {
                            "tools": {}
                        },
                        "serverInfo": {
                            "name": self.name,
                            "version": self.version
                        }
                    }
                }

            elif method == "tools/list":
                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "tools": self.tools
                    }
                }

            elif method == "tools/call":
                tool_name = params.get("name")
                arguments = params.get("arguments", {})

                if tool_name == "calculate":
                    result = self.calculate(arguments.get("expression", ""))
                elif tool_name == "matrix_advanced":
                    result = self.matrix_advanced(arguments)
                elif tool_name == "calculus":
                    result = self.calculus(arguments)
                elif tool_name == "complex_numbers":
                    result = self.complex_numbers(arguments)
                elif tool_name == "unit_conversion":
                    result = self.unit_conversion(arguments)
                else:
                    return {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "error": {
                            "code": -32601,
                            "message": f"Unknown tool: {tool_name}"
                        }
                    }

                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": result
                            }
                        ]
                    }
                }

            else:
                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "error": {
                        "code": -32601,
                        "message": f"Unknown method: {method}"
                    }
                }

        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }

    async def run(self):
        """运行服务器"""
        try:
            while True:
                # 读取请求
                line = await asyncio.get_event_loop().run_in_executor(
                    None, sys.stdin.readline
                )

                if not line:
                    break

                try:
                    request = json.loads(line.strip())
                    response = await self.handle_request(request)

                    # 发送响应
                    print(json.dumps(response, ensure_ascii=False))
                    sys.stdout.flush()

                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON: {line}")
                    continue

        except KeyboardInterrupt:
            logger.info("服务器被用户中断")
        except Exception as e:
            logger.error(f"服务器运行错误: {e}")


def main():
    """主函数"""
    server = SuperCalculatorServer()
    try:
        asyncio.run(server.run())
    except KeyboardInterrupt:
        logger.info("服务器关闭")


if __name__ == "__main__":
    main()
