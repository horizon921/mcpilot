"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import { useSettingsStore } from '@/store/settingsStore';
import type { MCPServerInfo, MCPToolDefinition } from '@/types/mcp'; // Changed MCPToolInfo to MCPToolDefinition
import { Button } from '@/components/Common/Button';
import MCPServerFormModal from '@/components/Settings/MCPServerFormModal';
import { PlusCircle, Edit3, Trash2, Power, PowerOff, CheckCircle2, XCircle, AlertCircle, HelpCircle, ListTree, RefreshCw, MinusCircle } from 'lucide-react'; // Added MinusCircle
import { Switch } from '@/components/Common/Switch';

export default function MCPServersPage() {
  const { mcpServers, removeMCPServer, toggleMCPServerEnabled, updateMCPServerDetails } = useSettingsStore(); // Added updateMCPServerDetails
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServerInfo | null>(null);
  const [probingServers, setProbingServers] = useState<Record<string, boolean>>({}); // Track probing status

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

  const probeServer = useCallback(async (server: MCPServerInfo) => {
    if (!server.baseUrl) {
      updateMCPServerDetails(server.id, { status: 'error', errorDetails: 'Base URL 未配置', tools: [] });
      return;
    }
    setProbingServers(prev => ({ ...prev, [server.id]: true }));
    try {
      // Assuming MCP info endpoint is at /mcp/info or similar standard path
      // For this example, let's assume it's just the baseUrl that might return info or tools directly
      // A more robust solution would define a specific info endpoint.
      // We'll try to fetch from baseUrl and expect a specific JSON structure.
      const infoUrl = `${server.baseUrl.replace(/\/$/, '')}/mcp/info`; // Standardized info endpoint
      
      console.log(`Probing MCP server ${server.name} at ${infoUrl}`);
      const response = await fetch(infoUrl, { cache: 'no-store' }); // Disable cache for probing

      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Validate data structure (example validation)
      if (!data || typeof data.name !== 'string' || !Array.isArray(data.tools)) {
        console.error("MCP Server Info response format invalid:", data);
        throw new Error("无效的服务器信息响应格式");
      }

      updateMCPServerDetails(server.id, {
        status: 'connected',
        tools: data.tools as MCPToolDefinition[],
        errorDetails: undefined
        // name and description are not updated here; they are managed via MCPServerFormModal
      });
    } catch (error: any) {
      console.error(`探测 MCP 服务 ${server.name} (${server.id}) 失败:`, error);
      updateMCPServerDetails(server.id, {
        status: 'error',
        errorDetails: error.message || '连接或解析信息失败',
        tools: [] // Clear tools on error
      });
    } finally {
      setProbingServers(prev => ({ ...prev, [server.id]: false }));
    }
  }, [updateMCPServerDetails]);

  useEffect(() => {
    mcpServers.forEach(server => {
      if (server.isEnabled && (server.status === 'disconnected' || !server.status)) { // Simplified condition
        // Only probe if enabled and status is disconnected or not yet set (null/undefined)
        // This prevents re-probing on every render if already in a stable error/connected state.
        // To force re-probe, status should be reset to 'disconnected' by updateMCPServer action.
        probeServer(server);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcpServers, probeServer]); // probeServer is memoized with useCallback

  const handleToggleEnabled = (serverId: string, currentIsEnabled: boolean | undefined) => {
    const newIsEnabled = !currentIsEnabled;
    toggleMCPServerEnabled(serverId, newIsEnabled);
    const serverToProbe = mcpServers.find(s => s.id === serverId);
    if (newIsEnabled && serverToProbe) {
      // Set status to disconnected to trigger probe by useEffect, or probe directly
      updateMCPServerDetails(serverId, { status: 'disconnected', tools: [], errorDetails: "等待探测..." });
      probeServer(serverToProbe);
    } else if (!newIsEnabled && serverToProbe) {
      updateMCPServerDetails(serverId, { status: 'disconnected', tools: [], errorDetails: undefined });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">MCP 服务管理</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle size={18} className="mr-2" />
          添加 MCP 服务
        </Button>
      </div>

      {mcpServers.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">还没有配置 MCP 服务。点击上面的按钮添加一个吧！</p>
      ) : (
        <div className="space-y-4">
          {mcpServers.map((server) => (
            <div key={server.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold text-primary dark:text-primary-light mb-1">{server.name}</h2>
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
                        className="transform scale-75" // Make switch smaller
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