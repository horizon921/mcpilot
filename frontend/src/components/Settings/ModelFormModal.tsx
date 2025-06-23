"use client";

import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import type { AIModel, AIModelPayload } from '@/types/config';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { Label } from '@/components/Common/Label';
import { Textarea } from '@/components/Common/Textarea'; // For description
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/Common/Dialog';
import { Checkbox } from '@/components/Common/Checkbox'; // To be created, for boolean flags

interface ModelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  model?: AIModel | null; // Model to edit, or null for new model
}

const ModelFormModal: React.FC<ModelFormModalProps> = ({ isOpen, onClose, model }) => {
  const { providers, models, addModel, updateModel, setDefaultModel, appSettings } = useSettingsStore();

  const [name, setName] = useState('');
  const [modelNativeId, setModelNativeId] = useState(''); // Renamed from modelId
  const [providerId, setProviderId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);
  const [supportsStreaming, setSupportsStreaming] = useState(true);
  const [supportsSystemPrompt, setSupportsSystemPrompt] = useState(true);
  const [supportsToolUse, setSupportsToolUse] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  // For custom parameters in the future:
  // const [customParameters, setCustomParameters] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (model) {
        setName(model.name);
        setModelNativeId(model.modelNativeId); // Use modelNativeId
        setProviderId(model.providerId);
        setDescription(model.description || '');
        setMaxTokens(model.maxTokens);
        setSupportsStreaming(model.supportsStreaming !== undefined ? model.supportsStreaming : true);
        setSupportsSystemPrompt(model.supportsSystemPrompt !== undefined ? model.supportsSystemPrompt : true);
        setSupportsToolUse(model.supportsToolUse !== undefined ? model.supportsToolUse : false);
        setIsDefault(model.id === appSettings.defaultModelId); // Check if it's the current default
        // setCustomParameters(model.parameters || {});
      } else {
        // Reset form for new model
        setName('');
        setModelNativeId('');
        setProviderId(providers.length > 0 ? providers[0].id : ''); // Default to first provider if available
        setDescription('');
        setMaxTokens(undefined);
        setSupportsStreaming(true);
        setSupportsSystemPrompt(true);
        setSupportsToolUse(false);
        setIsDefault(false);
        // setCustomParameters({});
      }
      setErrors({});
    }
  }, [model, isOpen, providers, appSettings.defaultModelId]); // Added appSettings.defaultModelId

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '模型名称不能为空';
    if (!modelNativeId.trim()) newErrors.modelNativeId = '模型原生 ID 不能为空'; // Changed from modelId
    if (!providerId) newErrors.providerId = '请选择一个服务商';
    if (maxTokens !== undefined && (isNaN(maxTokens) || maxTokens <= 0)) {
      newErrors.maxTokens = 'Max Tokens 必须是正数';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // This is the old, problematic handleSubmit. It will be removed by this diff.
  // const handleSubmit = () => { ... }; // Lines 78-121 are effectively deleted.

  const handleSubmit = () => { // This was handleActualSubmit, now renamed.
    if (!validate()) return;

    const modelPayload: Omit<AIModel, "id" | "providerId" | "isDefault"> = {
        name: name.trim(),
        modelNativeId: modelNativeId.trim(),
        description: description.trim() || undefined,
        maxTokens: maxTokens ? Number(maxTokens) : undefined,
        supportsStreaming,
        supportsSystemPrompt,
        supportsToolUse,
    };

    if (model) { // Editing existing model
        const updatePayload: Partial<Omit<AIModel, "id" | "providerId" | "modelNativeId">> = {
            name: name.trim(),
            description: description.trim() || undefined,
            maxTokens: maxTokens ? Number(maxTokens) : undefined,
            supportsStreaming,
            supportsSystemPrompt,
            supportsToolUse,
        };
        updateModel(model.id, updatePayload);
        if (isDefault && model.id !== appSettings.defaultModelId) {
            setDefaultModel(model.id);
        } else if (!isDefault && model.id === appSettings.defaultModelId) {
            setDefaultModel(undefined);
        }
    } else { // Adding new model
        const newModel = addModel(providerId, modelPayload);
        if (isDefault) {
            setDefaultModel(newModel.id);
        }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{model ? '编辑 AI 模型' : '添加 AI 模型'}</DialogTitle>
          <DialogDescription>
            配置模型的详细信息。模型 ID 通常是服务商提供的特定标识符 (例如 "gpt-4-turbo")。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model-name" className="text-right">名称</Label>
            <Input id="model-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="例如：GPT-4 Turbo" />
            {errors.name && <p className="col-span-4 text-red-500 text-xs text-right">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model-native-id" className="text-right">模型原生 ID</Label>
            <Input id="model-native-id" value={modelNativeId} onChange={(e) => setModelNativeId(e.target.value)} className="col-span-3" placeholder="例如：gpt-4-1106-preview" disabled={!!model} />
            {errors.modelNativeId && <p className="col-span-4 text-red-500 text-xs text-right">{errors.modelNativeId}</p>}
            {!!model && <p className="col-span-4 text-xs text-gray-500 text-right">模型原生 ID 在创建后不可更改。</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="providerId" className="text-right">服务商</Label>
            <Select value={providerId} onValueChange={(value) => setProviderId(value as string)} disabled={!!model || providers.length === 0}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={providers.length === 0 ? "请先添加服务商" : "选择服务商"} />
              </SelectTrigger>
              <SelectContent>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.providerId && <p className="col-span-4 text-red-500 text-xs text-right">{errors.providerId}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">描述</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="可选：关于此模型的简短描述" rows={2}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxTokens" className="text-right">Max Tokens</Label>
            <Input id="maxTokens" type="number" value={maxTokens || ""} onChange={(e) => setMaxTokens(e.target.value ? parseInt(e.target.value, 10) : undefined)} className="col-span-3" placeholder="可选：例如 4096" />
            {errors.maxTokens && <p className="col-span-4 text-red-500 text-xs text-right">{errors.maxTokens}</p>}
          </div>
          
          <div className="col-span-4 space-y-3 pt-3">
             <div className="flex items-center space-x-2">
                <Checkbox id="supportsStreaming" checked={supportsStreaming} onCheckedChange={(checked) => setSupportsStreaming(!!checked)} />
                <Label htmlFor="supportsStreaming" className="text-sm font-normal">支持流式响应</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="supportsSystemPrompt" checked={supportsSystemPrompt} onCheckedChange={(checked) => setSupportsSystemPrompt(!!checked)} />
                <Label htmlFor="supportsSystemPrompt" className="text-sm font-normal">支持系统提示 (System Prompt)</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="supportsToolUse" checked={supportsToolUse} onCheckedChange={(checked) => setSupportsToolUse(!!checked)} />
                <Label htmlFor="supportsToolUse" className="text-sm font-normal">支持工具调用 (Function Calling / Tool Use)</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="isDefault" checked={isDefault} onCheckedChange={(checked) => setIsDefault(!!checked)} />
                <Label htmlFor="isDefault" className="text-sm font-normal">设为全局默认模型</Label>
            </div>
          </div>

        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit}>保存模型</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelFormModal;