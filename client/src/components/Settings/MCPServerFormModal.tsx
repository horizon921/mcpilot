"use client";

import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import type { MCPServerInfo, MCPServerPayload, MCPConfigSchema, MCPParameterDefinition } from '@/types/mcp';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { Label } from '@/components/Common/Label';
import { Textarea } from '@/components/Common/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/Common/Dialog';
import { Checkbox } from '@/components/Common/Checkbox';

interface MCPServerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  server?: MCPServerInfo | null; // Server to edit, or null for new server
}

const MCPServerFormModal: React.FC<MCPServerFormModalProps> = ({ isOpen, onClose, server }) => {
  const { addMCPServer, updateMCPServer } = useSettingsStore();
  
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  
  // Dynamic configuration
  const [configSchema, setConfigSchema] = useState<MCPConfigSchema | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (server) {
        setName(server.name);
        setBaseUrl(server.baseUrl);
        setDescription(server.description || '');
        setIsEnabled(server.isEnabled !== undefined ? server.isEnabled : true);
        setConfigSchema(server.configSchema || null);
        setConfigValues(server.config?.parameters || {});
      } else {
        // Reset form for new server
        setName('');
        setBaseUrl('');
        setDescription('');
        setIsEnabled(true);
        setConfigSchema(null);
        setConfigValues({});
      }
      setErrors({});
      setSchemaError(null);
    }
  }, [server, isOpen]);

  const fetchConfigSchema = async () => {
    if (!baseUrl.trim()) {
      setSchemaError('请先输入 Base URL');
      return;
    }

    setIsLoadingSchema(true);
    setSchemaError(null);
    
    try {
      // 通过我们的API路由来获取配置schema，避免CORS问题
      const apiUrl = `/api/mcp/config-schema?baseUrl=${encodeURIComponent(baseUrl.trim())}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const schema: MCPConfigSchema = await response.json();
        setConfigSchema(schema);
        
        // 初始化配置值
        const initialValues: Record<string, any> = {};
        schema.parameters.forEach(param => {
          if (configValues[param.name] !== undefined) {
            initialValues[param.name] = configValues[param.name];
          } else if (param.type === 'boolean') {
            initialValues[param.name] = false;
          } else {
            initialValues[param.name] = '';
          }
        });
        setConfigValues(initialValues);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Schema fetch failed:', response.status, errorData);
        setSchemaError(errorData.error || `服务器响应错误 (${response.status}): ${response.statusText}`);
        setConfigSchema(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch config schema:', error);
      setSchemaError(`获取配置失败: ${error.message || 'Network error'}`);
      setConfigSchema(null);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const handleConfigValueChange = (paramName: string, value: any) => {
    setConfigValues(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Basic validation
    if (!name.trim()) newErrors.name = '服务名称不能为空';
    if (!baseUrl.trim()) {
      newErrors.baseUrl = 'Base URL 不能为空';
    } else if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      newErrors.baseUrl = 'Base URL 必须以 http:// 或 https:// 开头';
    }
    
    // Dynamic parameter validation
    if (configSchema) {
      configSchema.parameters.forEach(param => {
        if (param.required) {
          const value = configValues[param.name];
          if (value === undefined || value === null || value === '') {
            newErrors[`config_${param.name}`] = `${param.label} 不能为空`;
          }
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const serverData: MCPServerPayload = {
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      description: description.trim() || undefined,
      isEnabled: isEnabled,
      configSchema: configSchema || undefined,
      config: configSchema ? { parameters: configValues } : undefined,
    };

    if (server) {
      updateMCPServer(server.id, serverData);
    } else {
      addMCPServer(serverData);
    }
    onClose();
  };

  const renderDynamicField = (param: MCPParameterDefinition) => {
    const value = configValues[param.name] || '';
    const errorKey = `config_${param.name}`;
    
    switch (param.type) {
      case 'password':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={`config-${param.name}`}>
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`config-${param.name}`}
              type="password"
              value={value}
              onChange={(e) => handleConfigValueChange(param.name, e.target.value)}
              className="w-full"
              placeholder={param.placeholder || param.description}
            />
            {errors[errorKey] && (
              <p className="text-red-500 text-xs">{errors[errorKey]}</p>
            )}
            {param.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {param.description}
              </p>
            )}
          </div>
        );
      
      case 'string':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={`config-${param.name}`}>
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`config-${param.name}`}
              type="text"
              value={value}
              onChange={(e) => handleConfigValueChange(param.name, e.target.value)}
              className="w-full"
              placeholder={param.placeholder || param.description}
            />
            {errors[errorKey] && (
              <p className="text-red-500 text-xs">{errors[errorKey]}</p>
            )}
            {param.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {param.description}
              </p>
            )}
          </div>
        );
      
      case 'boolean':
        return (
          <div key={param.name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`config-${param.name}`}
                checked={!!value}
                onCheckedChange={(checked: boolean) => handleConfigValueChange(param.name, checked)}
              />
              <Label htmlFor={`config-${param.name}`}>
                {param.label}
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {param.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                {param.description}
              </p>
            )}
            {errors[errorKey] && (
              <p className="text-red-500 text-xs">{errors[errorKey]}</p>
            )}
          </div>
        );
      
      case 'select':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={`config-${param.name}`}>
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(selectedValue) => handleConfigValueChange(param.name, selectedValue)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={param.placeholder || `选择${param.label}`} />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[errorKey] && (
              <p className="text-red-500 text-xs">{errors[errorKey]}</p>
            )}
            {param.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {param.description}
              </p>
            )}
          </div>
        );
      
      case 'number':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={`config-${param.name}`}>
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`config-${param.name}`}
              type="number"
              value={value}
              onChange={(e) => handleConfigValueChange(param.name, Number(e.target.value) || '')}
              className="w-full"
              placeholder={param.placeholder || param.description}
            />
            {errors[errorKey] && (
              <p className="text-red-500 text-xs">{errors[errorKey]}</p>
            )}
            {param.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {param.description}
              </p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{server ? '编辑 MCP 服务' : '添加 MCP 服务'}</DialogTitle>
          <DialogDescription>
            配置 MCP 服务的连接信息。确保 Base URL 是正确的服务地址。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">基本配置</h3>
            
            <div className="space-y-2">
              <Label htmlFor="mcp-name">服务名称 <span className="text-red-500">*</span></Label>
              <Input
                id="mcp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：我的知识库服务"
                className="w-full"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mcp-baseUrl">Base URL <span className="text-red-500">*</span></Label>
              <Input
                id="mcp-baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="例如：http://localhost:8000"
                className="w-full"
              />
              {errors.baseUrl && <p className="text-red-500 text-xs">{errors.baseUrl}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mcp-description">服务描述</Label>
              <Textarea
                id="mcp-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="可选：关于此服务的简短描述"
                rows={3}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mcp-enabled"
                checked={isEnabled}
                onCheckedChange={(checked: boolean) => setIsEnabled(checked)}
              />
              <Label htmlFor="mcp-enabled" className="text-sm text-gray-600 dark:text-gray-400">
                添加后默认启用此服务
              </Label>
            </div>
          </div>

          {/* Dynamic Configuration Discovery */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">动态配置</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchConfigSchema}
                disabled={isLoadingSchema || !baseUrl.trim()}
              >
                {isLoadingSchema ? '获取中...' : '获取配置'}
              </Button>
            </div>
            
            {schemaError && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                {schemaError}
              </div>
            )}
            
            {configSchema && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-800 dark:text-green-200">
                <div className="font-medium">已发现服务配置：{configSchema.server_name}</div>
                {configSchema.description && <div className="mt-1 text-xs">{configSchema.description}</div>}
              </div>
            )}

            {/* Dynamic Parameter Fields */}
            {configSchema && configSchema.parameters.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">参数配置</h4>
                <div className="space-y-4">
                  {configSchema.parameters.map(param => renderDynamicField(param))}
                </div>
              </div>
            )}

            {/* Helpful Information */}
            {!configSchema && !schemaError && baseUrl.trim() && (
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>点击"获取配置"按钮来检查服务器是否支持动态参数配置。</p>
                <p>如果服务器不支持，该服务仍然可以作为标准 MCP 服务使用。</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit}>保存服务</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MCPServerFormModal;