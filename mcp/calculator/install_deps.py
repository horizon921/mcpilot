#!/usr/bin/env python3
"""安装必要的依赖库"""

import subprocess
import sys


def install_package(package):
    """安装Python包"""
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} 安装成功")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ {package} 安装失败")
        return False


def main():
    """主函数"""
    print("📦 安装增强版计算器依赖库...")
    print("=" * 50)

    packages = [
        "numpy",
        "scipy",
        "sympy"
    ]

    success_count = 0
    for package in packages:
        print(f"\n🔄 正在安装 {package}...")
        if install_package(package):
            success_count += 1

    print(f"\n📊 安装结果: {success_count}/{len(packages)} 成功")

    if success_count == len(packages):
        print("🎉 所有依赖库安装完成！")
        print("\n现在可以运行测试:")
        print("python test.py")
    else:
        print("⚠️  部分依赖库安装失败，某些功能可能不可用")


if __name__ == "__main__":
    main()
