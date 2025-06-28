"use client";

import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import type { AIProvider, AIProviderType, AIProviderPayload } from '@/types/config';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input'; // To be created
import { Label } from '@/components/Common/Label'; // To be created
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/Select'; // To be created
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/Common/Dialog'; // To be created

interface ProviderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider?: AIProvider | null; // Provider to edit, or null for new provider
}

const providerTypes: { value: AIProviderType; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'custom', label: 'OpenAI Compatible (自定义)' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'siliconflow', label: 'SiliconFlow (硅基流动)' },
];

interface ProviderUIDetails {
  apiKeyLabel: string;
  apiKeyEnvVar: string;
  apiKeyDocsUrl?: string;
  defaultBaseUrl?: string;
  isBaseUrlEditable: boolean;
  baseUrlPlaceholder?: string;
  namePlaceholder: string;
}

const providerTypeDetails: Record<AIProviderType, ProviderUIDetails> = {
  openai: {
    apiKeyLabel: "OpenAI API Key",
    apiKeyEnvVar: "OPENAI_API_KEY",
    apiKeyDocsUrl: "https://platform.openai.com/api-keys",
    isBaseUrlEditable: true,
    baseUrlPlaceholder: "https://api.openai.com/v1 (默认)",
    namePlaceholder: "例如：OpenAI GPT-4"
  },
  custom: {
    apiKeyLabel: "API Key (如果需要)",
    apiKeyEnvVar: "API_KEY_YOUR_PROVIDER_ID (自定义)",
    isBaseUrlEditable: true,
    baseUrlPlaceholder: "例如：http://localhost:1234/v1",
    namePlaceholder: "例如：我的本地模型服务"
  },
  anthropic: {
    apiKeyLabel: "Anthropic API Key",
    apiKeyEnvVar: "ANTHROPIC_API_KEY",
    apiKeyDocsUrl: "https://console.anthropic.com/settings/keys",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    isBaseUrlEditable: false,
    namePlaceholder: "例如：Anthropic Claude"
  },
  gemini: {
    apiKeyLabel: "Google Gemini API Key",
    apiKeyEnvVar: "GEMINI_API_KEY",
    apiKeyDocsUrl: "https://aistudio.google.com/app/apikey",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    isBaseUrlEditable: false,
    namePlaceholder: "例如：Google Gemini Pro"
  },
  siliconflow: {
    apiKeyLabel: "SiliconFlow API Key",
    apiKeyEnvVar: "SILICONFLOW_API_KEY",
    apiKeyDocsUrl: "https://cloud.siliconflow.cn/account/keys",
    isBaseUrlEditable: true,
    baseUrlPlaceholder: "https://api.siliconflow.cn/v1 (默认)",
    namePlaceholder: "例如：SiliconFlow Qwen"
  },
};

const ProviderFormModal: React.FC<ProviderFormModalProps> = ({ isOpen, onClose, provider }) => {
  const { addProvider, updateProvider, getApiKey, setApiKey } = useSettingsStore();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<AIProviderType>('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setCurrentApiKey] = useState(''); // Local state for API key input
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Effect for initializing/resetting form when modal opens or provider changes
  useEffect(() => {
    if (isOpen) {
      if (provider) { // Editing existing provider
        setName(provider.name);
        setType(provider.type);
        // BaseUrl should be what's saved, or if not, the placeholder/default for its type
        const currentProviderDetails = providerTypeDetails[provider.type];
        setBaseUrl(provider.baseUrl || (currentProviderDetails.isBaseUrlEditable ? currentProviderDetails.baseUrlPlaceholder : currentProviderDetails.defaultBaseUrl) || '');
        setCurrentApiKey(getApiKey(provider.id) || '');
      } else { // Adding new provider - reset to defaults (e.g., for 'openai')
        const defaultNewType: AIProviderType = 'openai';
        const defaultDetails = providerTypeDetails[defaultNewType];
        setName('');
        setType(defaultNewType);
        setBaseUrl(defaultDetails.isBaseUrlEditable ? (defaultDetails.baseUrlPlaceholder || '') : (defaultDetails.defaultBaseUrl || ''));
        setCurrentApiKey('');
      }
      setErrors({});
    }
  }, [provider, isOpen, getApiKey]); // Removed 'type' from dependencies

  // Effect for handling baseUrl changes specifically when 'type' is changed by the user in the form
  useEffect(() => {
    if (!isOpen) return; // Only act if modal is open

    const details = providerTypeDetails[type];
    if (!details) return;

    if (!provider) { // Creating a new provider and type is changed
      setBaseUrl(details.isBaseUrlEditable ? (details.baseUrlPlaceholder || '') : (details.defaultBaseUrl || ''));
    } else { // Editing an existing provider
      if (type === provider.type) {
        // If type is reverted to original, restore original baseUrl or its type's default/placeholder
        const originalProviderDetails = providerTypeDetails[provider.type];
        setBaseUrl(provider.baseUrl || (originalProviderDetails.isBaseUrlEditable ? originalProviderDetails.baseUrlPlaceholder : originalProviderDetails.defaultBaseUrl) || '');
      } else {
        // If type is changed to a new one (different from original)
        setBaseUrl(details.isBaseUrlEditable ? (details.baseUrlPlaceholder || '') : (details.defaultBaseUrl || ''));
      }
    }
  }, [type, isOpen, provider]); // provider is needed to compare with original type in edit mode


  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '服务商名称不能为空';
    if (!type) newErrors.type = '请选择服务商类型';
    const currentProviderDetails = providerTypeDetails[type];
    if (currentProviderDetails.isBaseUrlEditable && !baseUrl.trim()) {
      newErrors.baseUrl = 'Base URL 不能为空';
    } else if (currentProviderDetails.isBaseUrlEditable && baseUrl.trim() && !baseUrl.startsWith('http')) {
      newErrors.baseUrl = 'Base URL 必须以 http 或 https 开头';
    }
    // API Key validation can be added if needed, e.g., basic format check
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const providerData: AIProviderPayload = {
      name: name.trim(),
      type,
      baseUrl: baseUrl.trim(), // Will be set based on type details or user input
      // Add the new UI hint fields from AIProvider type, these are for display/info, not core functionality
      apiKeyLabel: providerTypeDetails[type].apiKeyLabel,
      apiKeyEnvVar: providerTypeDetails[type].apiKeyEnvVar,
      apiKeyDocsUrl: providerTypeDetails[type].apiKeyDocsUrl,
    };

    const currentDetails = providerTypeDetails[type];
    if (!currentDetails.isBaseUrlEditable) {
      providerData.baseUrl = currentDetails.defaultBaseUrl;
    } else if (!providerData.baseUrl && (type === 'openai' || type === 'siliconflow')) {
      // Set default for OpenAI or SiliconFlow if user left it blank and it's editable
      providerData.baseUrl = currentDetails.baseUrlPlaceholder?.includes('默认') ? currentDetails.baseUrlPlaceholder?.split(' ')[0] : currentDetails.defaultBaseUrl;
    }
    
    if (provider) { // Editing existing provider
      updateProvider(provider.id, providerData);
      if (apiKey.trim()) {
        setApiKey(provider.id, apiKey.trim());
      } else {
         // If API key is cleared, remove it
        useSettingsStore.getState().removeApiKey(provider.id);
      }
    } else { // Adding new provider
      const newProvider = addProvider(providerData);
      if (apiKey.trim()) {
        setApiKey(newProvider.id, apiKey.trim());
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{provider ? '编辑 AI 服务商' : '添加 AI 服务商'}</DialogTitle>
          <DialogDescription>
            配置 AI 模型服务商的连接信息。
            <strong className="text-orange-600 dark:text-orange-400 block mt-1">
              警告：API 密钥将存储在您的浏览器本地存储中。这对于测试可能很方便，但请勿在此处存储生产密钥或高度敏感的密钥。对于生产环境，请确保在服务器后端配置相应的环境变量。
            </strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">名称</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder={providerTypeDetails[type].namePlaceholder} />
            {errors.name && <p className="col-span-4 text-red-500 text-xs text-right">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">类型</Label>
            <Select value={type} onValueChange={(value) => {
              const newType = value as AIProviderType;
              setType(newType);
              // Reset Base URL based on new type if it's not editable or to its placeholder
              const details = providerTypeDetails[newType];
              if (!details.isBaseUrlEditable) {
                setBaseUrl(details.defaultBaseUrl || '');
              } else {
                 setBaseUrl(details.baseUrlPlaceholder || '');
              }
            }}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                {providerTypes.map(pt => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="col-span-4 text-red-500 text-xs text-right">{errors.type}</p>}
          </div>
          
          {providerTypeDetails[type].isBaseUrlEditable || baseUrl ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseUrl" className="text-right">Base URL</Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="col-span-3"
                placeholder={providerTypeDetails[type].baseUrlPlaceholder || providerTypeDetails[type].defaultBaseUrl}
                disabled={!providerTypeDetails[type].isBaseUrlEditable}
              />
              {errors.baseUrl && <p className="col-span-4 text-red-500 text-xs text-right">{errors.baseUrl}</p>}
            </div>
          ) : null}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">{providerTypeDetails[type].apiKeyLabel || 'API Key'}</Label>
            <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setCurrentApiKey(e.target.value)} className="col-span-3" placeholder="在此输入您的 API Key"/>
          </div>
          <div className="col-start-2 col-span-3 text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
            <p>
              提示：后端 API 将优先从服务器的环境变量 (例如 <code>{providerTypeDetails[type].apiKeyEnvVar}</code>) 中读取 API 密钥。
              如果对应的环境变量未设置，后端 API 可能会使用您在此处输入的、存储在浏览器本地的 API 密钥进行当次调用。
            </p>
            {providerTypeDetails[type].apiKeyDocsUrl && (
              <p>
                不知道如何获取? <a href={providerTypeDetails[type].apiKeyDocsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">查看文档</a>
              </p>
            )}
            <p className="font-semibold text-orange-600 dark:text-orange-400">
              您在此处输入的 API Key 将存储在浏览器本地。
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderFormModal;