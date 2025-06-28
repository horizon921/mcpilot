"use client";

import React, { useState, useMemo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import type { AIModel } from '@/types/config';
import { Button } from '@/components/Common/Button';
import ModelFormModal from '@/components/Settings/ModelFormModal';
import { PlusCircle, Edit3, Trash2, Zap, CheckCircle2, RadioTower, TerminalSquare, Workflow } from 'lucide-react'; // Added new icons

export default function AIModelsPage() {
  const { models, providers, removeModel, setDefaultModel, appSettings } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);

  const handleAddNew = () => {
    if (providers.length === 0) {
      alert("请先至少添加一个 AI 服务商，然后才能添加模型。");
      // Optionally, redirect to providers page: router.push('/settings/providers');
      return;
    }
    setEditingModel(null);
    setIsModalOpen(true);
  };

  const handleEdit = (model: AIModel) => {
    setEditingModel(model);
    setIsModalOpen(true);
  };

  const handleDelete = (modelId: string) => {
    if (window.confirm('您确定要删除这个模型吗？')) {
      removeModel(modelId);
    }
  };

  const handleSetDefault = (modelId: string) => {
    setDefaultModel(modelId);
  };

  const modelsWithProviderInfo = useMemo(() => {
    return models.map(model => {
      const provider = providers.find(p => p.id === model.providerId);
      return {
        ...model,
        providerName: provider?.name || '未知服务商',
        providerType: provider?.type,
      };
    }).sort((a,b) => a.providerName.localeCompare(b.providerName) || a.name.localeCompare(b.name));
  }, [models, providers]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">AI 模型管理</h1>
        <Button onClick={handleAddNew} disabled={providers.length === 0}>
          <PlusCircle size={18} className="mr-2" />
          添加模型
        </Button>
      </div>
      {providers.length === 0 && (
         <p className="text-yellow-600 dark:text-yellow-400 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
           您需要先在“AI 服务商”页面添加至少一个服务商，然后才能在这里添加模型。
         </p>
      )}

      {modelsWithProviderInfo.length === 0 && providers.length > 0 ? (
        <p className="text-gray-500 dark:text-gray-400">还没有配置 AI 模型。点击上面的按钮添加一个吧！</p>
      ) : modelsWithProviderInfo.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modelsWithProviderInfo.map((model) => (
            <div key={model.id} className="bg-[var(--color-card)] shadow-md rounded-lg p-6 space-y-3 relative">
              {model.id === appSettings.defaultModelId && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                  <CheckCircle2 size={12} className="mr-1"/> 默认
                </div>
              )}
              <h2 className="text-xl font-semibold text-[var(--color-primary)] pr-16">{model.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                ID (自定义): <span className="font-medium">{model.id}</span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                原生 ID: <span className="font-semibold text-gray-900 dark:text-white">{model.modelNativeId}</span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                服务商: <span className="font-semibold px-2 py-0.5 bg-accent dark:bg-accent/50 rounded-full text-xs">{model.providerName} ({model.providerType?.toUpperCase()})</span>
              </p>
              {model.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">{model.description}</p>
              )}
              <div className="mt-2 space-y-1">
                {model.maxTokens !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">最大 Tokens: <span className="font-medium text-gray-700 dark:text-gray-200">{model.maxTokens}</span></p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 items-center">
                  {model.supportsStreaming && (
                    <span className="flex items-center"><RadioTower size={12} className="mr-1 text-green-500"/>流式</span>
                  )}
                  {model.supportsSystemPrompt && (
                    <span className="flex items-center"><TerminalSquare size={12} className="mr-1 text-blue-500"/>系统提示</span>
                  )}
                  {model.supportsToolUse && (
                    <span className="flex items-center"><Workflow size={12} className="mr-1 text-purple-500"/>工具调用</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 mt-4">
                {model.id !== appSettings.defaultModelId && (
                   <Button variant="outline" size="sm" onClick={() => handleSetDefault(model.id)} className="text-xs">
                     <Zap size={14} className="mr-1" /> 设为默认
                   </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleEdit(model)} className="text-xs">
                  <Edit3 size={14} className="mr-1" /> 编辑
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(model.id)} className="text-xs">
                  <Trash2 size={14} className="mr-1" /> 删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isModalOpen && (
        <ModelFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          model={editingModel}
        />
      )}
    </div>
  );
}