"use client";

import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import type { MCPServerInfo, MCPServerPayload } from '@/types/mcp';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { Label } from '@/components/Common/Label';
import { Textarea } from '@/components/Common/Textarea'; // For description
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/Common/Dialog';
import { Checkbox } from '@/components/Common/Checkbox'; // Added Checkbox import

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
  const [isEnabled, setIsEnabled] = useState(true); // Added state for isEnabled
  // Future: Add fields for authentication, headers, etc.
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) { // Ensure this runs only when modal is opened or server prop changes
      if (server) {
        setName(server.name);
        setBaseUrl(server.baseUrl);
        setDescription(server.description || '');
        setIsEnabled(server.isEnabled !== undefined ? server.isEnabled : true); // Initialize from server or default to true
      } else {
        // Reset form for new server
        setName('');
        setBaseUrl('');
        setDescription('');
        setIsEnabled(true); // Default to true for new servers
      }
      setErrors({});
    }
  }, [server, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '服务名称不能为空';
    if (!baseUrl.trim()) {
      newErrors.baseUrl = 'Base URL 不能为空';
    } else if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      newErrors.baseUrl = 'Base URL 必须以 http:// 或 https:// 开头';
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
      isEnabled: isEnabled, // Include isEnabled in the payload
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
          {/* Future fields:
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mcp-auth-type" className="text-right">认证方式</Label>
            // Select for auth type (None, Bearer Token, API Key etc.)
          </div>
          // Conditional fields based on auth type
          */}
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