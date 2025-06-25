"use client";

import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import type { MCPServerInfo, MCPServerPayload, MCPAuthType, MCPAuthConfig } from '@/types/mcp';
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
  
  // Authentication configuration
  const [authType, setAuthType] = useState<MCPAuthType>('none');
  const [bearerToken, setBearerToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [customHeadersText, setCustomHeadersText] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) { // Ensure this runs only when modal is opened or server prop changes
      if (server) {
        setName(server.name);
        setBaseUrl(server.baseUrl);
        setDescription(server.description || '');
        setIsEnabled(server.isEnabled !== undefined ? server.isEnabled : true);
        
        // Initialize authentication configuration
        const auth = server.authConfig;
        if (auth) {
          setAuthType(auth.type);
          setBearerToken(auth.bearerToken || '');
          setApiKey(auth.apiKey || '');
          setApiKeyName(auth.apiKeyName || '');
          setUsername(auth.username || '');
          setPassword(auth.password || '');
          setCustomHeaders(auth.customHeaders || {});
          setCustomHeadersText(JSON.stringify(auth.customHeaders || {}, null, 2));
        } else {
          // Reset auth fields
          setAuthType('none');
          setBearerToken('');
          setApiKey('');
          setApiKeyName('');
          setUsername('');
          setPassword('');
          setCustomHeaders({});
          setCustomHeadersText('{}');
        }
      } else {
        // Reset form for new server
        setName('');
        setBaseUrl('');
        setDescription('');
        setIsEnabled(true);
        setAuthType('none');
        setBearerToken('');
        setApiKey('');
        setApiKeyName('');
        setUsername('');
        setPassword('');
        setCustomHeaders({});
        setCustomHeadersText('{}');
      }
      setErrors({});
    }
  }, [server, isOpen]);

  // Parse custom headers from text
  const parseCustomHeaders = (text: string): Record<string, string> => {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return {};
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
    
    // Authentication validation
    if (authType === 'bearer' && !bearerToken.trim()) {
      newErrors.bearerToken = 'Bearer Token 不能为空';
    }
    if (authType === 'api_key_header' || authType === 'api_key_query') {
      if (!apiKey.trim()) newErrors.apiKey = 'API Key 不能为空';
      if (!apiKeyName.trim()) newErrors.apiKeyName = 'API Key 名称不能为空';
    }
    if (authType === 'basic') {
      if (!username.trim()) newErrors.username = '用户名不能为空';
      if (!password.trim()) newErrors.password = '密码不能为空';
    }
    if (authType === 'custom_headers') {
      try {
        const parsed = JSON.parse(customHeadersText);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          newErrors.customHeaders = '自定义请求头必须是有效的JSON对象';
        }
      } catch (e) {
        newErrors.customHeaders = '自定义请求头必须是有效的JSON格式';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Build authentication configuration
    let authConfig: MCPAuthConfig | undefined = undefined;
    if (authType !== 'none') {
      authConfig = { type: authType };
      
      switch (authType) {
        case 'bearer':
          authConfig.bearerToken = bearerToken.trim();
          break;
        case 'api_key_header':
        case 'api_key_query':
          authConfig.apiKey = apiKey.trim();
          authConfig.apiKeyName = apiKeyName.trim();
          break;
        case 'basic':
          authConfig.username = username.trim();
          authConfig.password = password.trim();
          break;
        case 'custom_headers':
          authConfig.customHeaders = parseCustomHeaders(customHeadersText);
          break;
      }
    }

    const serverData: MCPServerPayload = {
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      description: description.trim() || undefined,
      isEnabled: isEnabled,
      authConfig: authConfig,
    };

    if (server) { // Editing existing server
      updateMCPServer(server.id, serverData);
    } else { // Adding new server
      addMCPServer(serverData);
    }
    onClose();
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
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mcp-name" className="text-right">名称</Label>
            <Input id="mcp-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="例如：我的知识库服务" />
            {errors.name && <p className="col-span-4 text-red-500 text-xs text-right">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mcp-baseUrl" className="text-right">Base URL</Label>
            <Input id="mcp-baseUrl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="col-span-3" placeholder="例如：http://localhost:8000" />
            {errors.baseUrl && <p className="col-span-4 text-red-500 text-xs text-right">{errors.baseUrl}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mcp-description" className="text-right">描述</Label>
            <Textarea id="mcp-description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="可选：关于此服务的简短描述" rows={3}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mcp-enabled" className="text-right">默认启用</Label>
            <div className="col-span-3 flex items-center">
              <Checkbox
                id="mcp-enabled"
                checked={isEnabled}
                onCheckedChange={(checked: boolean) => setIsEnabled(checked)}
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">添加后默认启用此服务</span>
            </div>
          </div>
          {/* Authentication Configuration */}
          <div className="col-span-4 border-t pt-4 mt-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">认证配置</h3>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mcp-auth-type" className="text-right">认证方式</Label>
            <div className="col-span-3">
              <Select value={authType} onValueChange={(value: MCPAuthType) => setAuthType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择认证方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无认证</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="api_key_header">API Key (Header)</SelectItem>
                  <SelectItem value="api_key_query">API Key (Query)</SelectItem>
                  <SelectItem value="basic">基础认证</SelectItem>
                  <SelectItem value="custom_headers">自定义请求头</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Bearer Token Configuration */}
          {authType === 'bearer' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mcp-bearer-token" className="text-right">Bearer Token</Label>
              <Input
                id="mcp-bearer-token"
                type="password"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                className="col-span-3"
                placeholder="输入 Bearer Token"
              />
              {errors.bearerToken && <p className="col-span-4 text-red-500 text-xs text-right">{errors.bearerToken}</p>}
            </div>
          )}
          
          {/* API Key Configuration */}
          {(authType === 'api_key_header' || authType === 'api_key_query') && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mcp-api-key" className="text-right">API Key</Label>
                <Input
                  id="mcp-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="col-span-3"
                  placeholder="输入 API Key"
                />
                {errors.apiKey && <p className="col-span-4 text-red-500 text-xs text-right">{errors.apiKey}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mcp-api-key-name" className="text-right">API Key 名称</Label>
                <Input
                  id="mcp-api-key-name"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  className="col-span-3"
                  placeholder={authType === 'api_key_header' ? "例如：X-API-Key" : "例如：api_key"}
                />
                {errors.apiKeyName && <p className="col-span-4 text-red-500 text-xs text-right">{errors.apiKeyName}</p>}
              </div>
            </>
          )}
          
          {/* Basic Auth Configuration */}
          {authType === 'basic' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mcp-username" className="text-right">用户名</Label>
                <Input
                  id="mcp-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="col-span-3"
                  placeholder="输入用户名"
                />
                {errors.username && <p className="col-span-4 text-red-500 text-xs text-right">{errors.username}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mcp-password" className="text-right">密码</Label>
                <Input
                  id="mcp-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  placeholder="输入密码"
                />
                {errors.password && <p className="col-span-4 text-red-500 text-xs text-right">{errors.password}</p>}
              </div>
            </>
          )}
          
          {/* Custom Headers Configuration */}
          {authType === 'custom_headers' && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="mcp-custom-headers" className="text-right pt-2">自定义请求头</Label>
              <div className="col-span-3">
                <Textarea
                  id="mcp-custom-headers"
                  value={customHeadersText}
                  onChange={(e) => {
                    setCustomHeadersText(e.target.value);
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                        setCustomHeaders(parsed);
                      }
                    } catch (e) {
                      // Ignore parsing errors during typing
                    }
                  }}
                  className="font-mono text-sm"
                  placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  输入有效的 JSON 格式的请求头对象
                </p>
                {errors.customHeaders && <p className="text-red-500 text-xs mt-1">{errors.customHeaders}</p>}
              </div>
            </div>
          )}
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