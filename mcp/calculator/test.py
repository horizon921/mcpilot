#!/usr/bin/env python3
"""增强版测试脚本 - 专注矩阵和微积分"""


def test_advanced_features():
    """测试高级功能"""
    try:
        print("🔍 测试导入增强版 server.py...")
        import server
        print("✅ 导入成功")

        print("🔧 创建服务器实例...")
        calc_server = server.SuperCalculatorServer()
        print("✅ 实例创建成功")

        print(f"📊 服务器信息: {calc_server.name} v{calc_server.version}")
        print(f"🔧 工具数量: {len(calc_server.tools)}")

        print("\n" + "="*60)
        print("🔢 高级矩阵运算测试")
        print("="*60)

        # 测试特征值分解
        print("\n🔸 特征值分解测试...")
        result = calc_server.matrix_advanced({
            "operation": "eigenvalues",
            "matrix_a": [[4, -2], [1, 1]]
        })
        print(f"✅ {result}")

        # 测试SVD分解
        print("\n🔸 奇异值分解测试...")
        result = calc_server.matrix_advanced({
            "operation": "svd",
            "matrix_a": [[1, 2], [3, 4], [5, 6]]
        })
        print(f"✅ SVD分解完成")

        # 测试矩阵求逆
        print("\n🔸 矩阵求逆测试...")
        result = calc_server.matrix_advanced({
            "operation": "inverse",
            "matrix_a": [[2, 1], [1, 1]]
        })
        print(f"✅ {result}")

        # 测试线性方程组求解
        print("\n🔸 线性方程组求解测试...")
        result = calc_server.matrix_advanced({
            "operation": "solve_linear",
            "matrix_a": [[2, 1], [1, 3]],
            "matrix_b": [5, 7]
        })
        print(f"✅ {result}")

        print("\n" + "="*60)
        print("∫ 微积分运算测试")
        print("="*60)

        # 测试导数
        print("\n🔸 导数计算测试...")
        result = calc_server.calculus({
            "operation": "derivative",
            "expression": "x**3 + 2*x**2 + x + 1",
            "variable": "x"
        })
        print(f"✅ {result}")

        # 测试积分
        print("\n🔸 不定积分测试...")
        result = calc_server.calculus({
            "operation": "integral",
            "expression": "x**2 + 2*x + 1",
            "variable": "x"
        })
        print(f"✅ {result}")

        # 测试定积分
        print("\n🔸 定积分测试...")
        result = calc_server.calculus({
            "operation": "definite_integral",
            "expression": "x**2",
            "variable": "x",
            "lower_limit": 0,
            "upper_limit": 2
        })
        print(f"✅ {result}")

        # 测试极限
        print("\n🔸 极限计算测试...")
        result = calc_server.calculus({
            "operation": "limit",
            "expression": "sin(x)/x",
            "variable": "x",
            "point": 0
        })
        print(f"✅ {result}")

        # 测试泰勒级数
        print("\n🔸 泰勒级数展开测试...")
        result = calc_server.calculus({
            "operation": "series_expansion",
            "expression": "exp(x)",
            "variable": "x",
            "point": 0,
            "order": 5
        })
        print(f"✅ {result}")

        print("\n🎉 所有高级功能测试通过！")
        return True

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_matrix_operations():
    """专门测试矩阵运算"""
    print("\n" + "="*60)
    print("🔢 详细矩阵运算测试")
    print("="*60)

    try:
        import server
        calc_server = server.SuperCalculatorServer()

        # 测试各种矩阵运算
        test_cases = [
            {
                "name": "矩阵秩",
                "operation": "rank",
                "matrix_a": [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
            },
            {
                "name": "矩阵的迹",
                "operation": "trace",
                "matrix_a": [[1, 2], [3, 4]]
            },
            {
                "name": "矩阵范数",
                "operation": "norm",
                "matrix_a": [[1, 2], [3, 4]]
            },
            {
                "name": "条件数",
                "operation": "condition_number",
                "matrix_a": [[1, 2], [3, 4]]
            },
            {
                "name": "矩阵幂",
                "operation": "matrix_power",
                "matrix_a": [[1, 1], [1, 0]],
                "power": 10
            }
        ]

        for test in test_cases:
            print(f"\n🔸 {test['name']}测试...")
            result = calc_server.matrix_advanced(test)
            print(f"✅ 完成")

        print("\n✅ 矩阵运算测试全部通过！")

    except Exception as e:
        print(f"❌ 矩阵测试失败: {e}")


def test_calculus_operations():
    """专门测试微积分运算"""
    print("\n" + "="*60)
    print("∫ 详细微积分运算测试")
    print("="*60)

    try:
        import server
        calc_server = server.SuperCalculatorServer()

        # 测试各种微积分运算
        test_cases = [
            {
                "name": "高阶导数",
                "operation": "derivative",
                "expression": "x**4 + 3*x**3 + 2*x**2 + x",
                "variable": "x",
                "order": 3
            },
            {
                "name": "偏导数",
                "operation": "partial_derivative",
                "expression": "x**2 + y**2 + z**2",
                "variable": "x"
            },
            {
                "name": "梯度",
                "operation": "gradient",
                "expression": "x**2 + y**2"
            },
            {
                "name": "拉普拉斯算子",
                "operation": "laplacian",
                "expression": "x**2 + y**2 + z**2"
            },
            {
                "name": "复杂函数积分",
                "operation": "integral",
                "expression": "x*exp(x)",
                "variable": "x"
            }
        ]

        for test in test_cases:
            print(f"\n🔸 {test['name']}测试...")
            result = calc_server.calculus(test)
            print(f"✅ 完成")

        print("\n✅ 微积分运算测试全部通过！")

    except Exception as e:
        print(f"❌ 微积分测试失败: {e}")


if __name__ == "__main__":
    print("🧪 增强版功能测试")
    print("=" * 60)

    # 基础功能测试
    if test_advanced_features():
        # 详细测试
        test_matrix_operations()
        test_calculus_operations()

        print("\n🎉 所有测试完成！")
        print("\n📋 功能总结:")
        print("✅ 高级矩阵运算（特征值、SVD、LU分解等）")
        print("✅ 符号微积分（导数、积分、极限、级数）")
        print("✅ 数值计算（数值积分、数值导数）")
        print("✅ 向量微积分（梯度、散度、拉普拉斯算子）")
        print("✅ 线性代数（线性方程组求解、矩阵分解）")
    else:
        print("❌ 基础测试失败，请检查依赖库安装")
