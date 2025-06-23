"use client";

import React, { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import type { AIProvider, AIProviderType } from '@/types/config';
import { Button } from '@/components/Common/Button';
import ProviderFormModal from '@/components/Settings/ProviderFormModal'; // To be created
import { PlusCircle, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';

export default function AIProvidersPage() {
  const { providers, removeProvider, getApiKey } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Record<string, boolean>>({});

  const handleAddNew = () => {
    setEditingProvider(null);
    setIsModalOpen(true);
  };

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setIsModalOpen(true);
  };

  const handleDelete = (providerId: string) => {
    if (window.confirm('您确定要删除这个服务商吗？相关的模型和 API 密钥也将被移除。')) {
      removeProvider(providerId);
    }
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setVisibleApiKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">AI 服务商管理</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle size={18} className="mr-2" />
          添加服务商
        </Button>
      </div>

      {providers.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">还没有配置 AI 服务商。点击上面的按钮添加一个吧！</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => {
            const apiKey = getApiKey(provider.id);
            const isKeyVisible = visibleApiKeys[provider.id];
            return (
              <div key={provider.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-3">
                <h2 className="text-xl font-semibold text-primary dark:text-primary-light mb-1">{provider.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID: <span className="font-mono">{provider.id}</span>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">
                  类型: <span className="font-semibold px-2 py-0.5 bg-accent dark:bg-accent/50 rounded-full text-xs">{provider.type.toUpperCase()}</span>
                </p>
                {provider.baseUrl && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 break-all mt-1">
                    Base URL: <span className="font-medium text-gray-700 dark:text-gray-200">{provider.baseUrl}</span>
                  </p>
                )}
                {apiKey && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <div className="flex items-center justify-between">
                      <span>API Key:</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleApiKeyVisibility(provider.id)} title={isKeyVisible ? "隐藏 API Key" : "显示 API Key"}>
                        {isKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                    <div className="mt-0.5">
                      <span className="font-medium text-gray-700 dark:text-gray-200 break-all">
                        {isKeyVisible ? apiKey : '••••••••••••••••••••'}
                      </span>
                    </div>
                  </div>
                )}
                {!apiKey && provider.type !== "custom" && ( // Assuming "custom" might not always need an API key directly
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      API Key 未设置。请<button onClick={() => handleEdit(provider)} className="text-blue-600 hover:underline focus:outline-none ml-1">编辑</button>以添加。
                    </p>
                )}

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(provider)}>
                    <Edit3 size={16} className="mr-1" /> 编辑
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(provider.id)}>
                    <Trash2 size={16} className="mr-1" /> 删除
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <ProviderFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          provider={editingProvider}
        />
      )}
    </div>
  );
}