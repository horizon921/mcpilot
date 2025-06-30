"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import type { MCPServerInfo, MCPToolDefinition } from '@/types/mcp';
import { Button } from '@/components/Common/Button';
import MCPServerFormModal from '@/components/Settings/MCPServerFormModal';
import { PlusCircle, Edit3, Trash2, Power, PowerOff, CheckCircle2, XCircle, AlertCircle, HelpCircle, ListTree, RefreshCw, MinusCircle } from 'lucide-react';
import { Switch } from '@/components/Common/Switch';
import { toast } from 'sonner';

export default function MCPServersPage() {
  const { mcpServers, removeMCPServer, toggleMCPServerEnabled, refreshMCPServerStatuses } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServerInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddNew = () => {
    setEditingServer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (server: MCPServerInfo) => {
    setEditingServer(server);
    setIsModalOpen(true);
  };

  const handleDelete = (serverId: string) => {
    if (window.confirm('您确定要删除这个 MCP 服务吗？')) {
      removeMCPServer(serverId);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    toast.info("正在刷新所有MCP服务状态...");
    await refreshMCPServerStatuses();
    toast.success("状态刷新完成！");
    setIsRefreshing(false);
  }, [refreshMCPServerStatuses]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleToggleEnabled = (serverId: string, currentIsEnabled: boolean | undefined) => {
    toggleMCPServerEnabled(serverId, !currentIsEnabled);
    setTimeout(() => refreshMCPServerStatuses(), 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">MCP 服务管理</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={18} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中...' : '全部刷新'}
          </Button>
          <Button onClick={handleAddNew}>
            <PlusCircle size={18} className="mr-2" />
            添加 MCP 服务
          </Button>
        </div>
      </div>

      {mcpServers.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">还没有配置 MCP 服务。点击上面的按钮添加一个吧！</p>
      ) : (
        <div className="space-y-4">
          {mcpServers.map((server) => (
            <div key={server.id} className="bg-[var(--color-card)] shadow-md rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-1">{server.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ID: <span className="font-mono">{server.id}</span>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 break-all mt-2">
                    Base URL: <span className="font-semibold text-gray-900 dark:text-white">{server.baseUrl}</span>
                  </p>
                  {server.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{server.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2 shrink-0 ml-4">
                   <div className="flex items-center space-x-1" title={server.isEnabled ? "禁用此服务" : "启用此服务"}>
                     <span className="text-xs">{server.isEnabled ? "已启用" : "已禁用"}</span>
                     {server.isEnabled ? <Power size={14} className="text-green-500"/> : <PowerOff size={14} className="text-red-500"/>}
                     <Switch
                        checked={!!server.isEnabled}
                        onCheckedChange={() => handleToggleEnabled(server.id, server.isEnabled)}
                        id={`enable-mcp-${server.id}`}
                        className="transform scale-75"
                      />
                   </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  {server.status === 'connected' && <CheckCircle2 size={14} className="mr-1.5 text-green-500 shrink-0"/>}
                  {server.status === 'error' && <XCircle size={14} className="mr-1.5 text-red-500 shrink-0"/>}
                  {server.status === 'disconnected' && <MinusCircle size={14} className="mr-1.5 text-yellow-500 shrink-0"/>}
                  {!server.status && <HelpCircle size={14} className="mr-1.5 text-gray-400 shrink-0"/>}
                  状态: <span className={`font-semibold ml-1 ${server.status === 'connected' ? 'text-green-600 dark:text-green-400' : server.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {server.status || '未知'}
                  </span>
                  {server.status === 'error' && server.errorDetails && (
                    <span className="ml-1 text-red-500 dark:text-red-400 text-xs truncate" title={server.errorDetails}>({server.errorDetails})</span>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {server.status === 'connected' && server.tools && server.tools.length > 0 && (
                    <div className="flex items-start">
                      <ListTree size={14} className="mr-1.5 text-blue-500 shrink-0 mt-0.5"/>
                      <div>
                        <span className="font-semibold">提供的工具:</span>
                        <ul className="list-disc list-inside pl-3">
                          {server.tools.slice(0, 3).map(tool => <li key={tool.name} className="truncate" title={tool.name}>{tool.name}</li>)}
                          {server.tools.length > 3 && <li className="text-gray-400 dark:text-gray-500">...等 {server.tools.length - 3} 个</li>}
                        </ul>
                      </div>
                    </div>
                  )}
                  {server.status === 'connected' && (!server.tools || server.tools.length === 0) && (
                    <p className="italic">已连接，但未发现任何工具。</p>
                  )}
                  {server.status !== 'connected' && (
                    <p className="italic">连接后将显示可用工具。</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 mt-4">
                <Button variant="outline" size="sm" onClick={() => handleEdit(server)}>
                  <Edit3 size={16} className="mr-1" /> 编辑
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(server.id)}>
                  <Trash2 size={16} className="mr-1" /> 删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <MCPServerFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          server={editingServer}
        />
      )}
    </div>
  );
}