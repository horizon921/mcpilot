"use client";

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { ChatSession, Message } from '@/types/chat';
import type { AIModel, AIProvider } from '@/types/config';
import { Button } from '@/components/Common/Button';
import { Label } from '@/components/Common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/Select';
import { Input } from '@/components/Common/Input'; // For number inputs like temperature
import { Slider } from '@/components/Common/Slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/Common/Popover'; // To be created
import { Settings2,SlidersHorizontal, Server } from 'lucide-react'; // Added Server icon
import { Textarea } from '../Common/Textarea'; // For system prompt
import { Checkbox } from '@/components/Common/Checkbox'; // Added Checkbox
import { Switch } from '@/components/Common/Switch';

interface ChatSettingsPanelProps {
  activeChatSession: ChatSession | null | undefined;
  onClosePanel?: () => void; // 新增：保存后自动关闭面板
}

const ChatSettingsPanel: React.FC<ChatSettingsPanelProps> = ({ activeChatSession, onClosePanel }) => {
  const { providers, models, getModelById, getProviderById, mcpServers, appSettings, toggleInputPreprocessing } = useSettingsStore();
  const { updateChatSessionSettings } = useChatStore();

  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(activeChatSession?.modelId);
  const [temperature, setTemperature] = useState<number | undefined>(activeChatSession?.temperature);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(activeChatSession?.maxTokens);
  const [topP, setTopP] = useState<number | undefined>(activeChatSession?.topP);
  const [presencePenalty, setPresencePenalty] = useState<number | undefined>(activeChatSession?.presencePenalty);
  const [frequencyPenalty, setFrequencyPenalty] = useState<number | undefined>(activeChatSession?.frequencyPenalty);
  const [structuredOutput, setStructuredOutput] = useState<boolean>(activeChatSession?.structuredOutput ?? false);
  const [stream, setStream] = useState<boolean>(activeChatSession?.stream ?? true);
  const [user, setUser] = useState<string | undefined>(activeChatSession?.user);
  const [logitBiasInput, setLogitBiasInput] = useState<string>(activeChatSession?.logitBias ? JSON.stringify(activeChatSession.logitBias, null, 2) : "");
  const [jsonSchemaInput, setJsonSchemaInput] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string | undefined>(activeChatSession?.systemPrompt);
  const [stopSequencesInput, setStopSequencesInput] = useState<string>("");
  const [sessionEnabledMcpServerIds, setSessionEnabledMcpServerIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeChatSession) {
      // 只在会话ID变化时更新，避免因为会话对象更新导致的重置
      const sessionId = activeChatSession.id;
      
      setSelectedModelId(activeChatSession.modelId);
      setTemperature(activeChatSession.temperature ?? 0.7);
      setMaxTokens(activeChatSession.maxTokens ?? undefined);
      setTopP(activeChatSession.topP ?? undefined);
      setPresencePenalty(activeChatSession.presencePenalty ?? undefined);
      setFrequencyPenalty(activeChatSession.frequencyPenalty ?? undefined);
      setStructuredOutput(activeChatSession.structuredOutput ?? false);
      setStream(activeChatSession.stream ?? true);
      setUser(activeChatSession.user ?? "");
      setLogitBiasInput(activeChatSession.logitBias ? JSON.stringify(activeChatSession.logitBias, null, 2) : "");
      setJsonSchemaInput(activeChatSession.jsonSchema ? JSON.stringify(activeChatSession.jsonSchema, null, 2) : "");
      setSystemPrompt(activeChatSession.systemPrompt ?? "");
      setStopSequencesInput(activeChatSession.stopSequences?.join(', ') || "");
      setSessionEnabledMcpServerIds(activeChatSession.enabledMcpServers || []);
    }
  }, [activeChatSession?.id]); // 只依赖会话ID而不是整个会话对象

  const handleSaveSettings = () => {
    if (activeChatSession) {
      const stopSequencesArray = stopSequencesInput
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      let logitBias: Record<string, number> | undefined = undefined;
      if (logitBiasInput.trim()) {
        try {
          logitBias = JSON.parse(logitBiasInput);
        } catch (e) {
          toast.error("logit_bias 格式错误，请输入合法的 JSON");
          return;
        }
      }

      let jsonSchema: Record<string, any> | undefined = undefined;
     if (structuredOutput && jsonSchemaInput.trim()) {
       try {
         jsonSchema = JSON.parse(jsonSchemaInput);
       } catch (e: any) {
         toast.error("JSON Schema 格式错误", {
           description: `请输入合法的JSON。错误: ${e.message}`,
         });
         return;
       }
     }

      updateChatSessionSettings(activeChatSession.id, {
        modelId: selectedModelId,
        temperature: temperature ? Number(temperature) : undefined,
        maxTokens: maxTokens ? Number(maxTokens) : undefined,
        topP: topP ? Number(topP) : undefined,
        presencePenalty: presencePenalty ? Number(presencePenalty) : undefined,
        frequencyPenalty: frequencyPenalty ? Number(frequencyPenalty) : undefined,
        structuredOutput,
        stream,
        user: user?.trim() || undefined,
        logitBias,
        jsonSchema,
        systemPrompt: systemPrompt?.trim() || undefined,
        stopSequences: stopSequencesArray.length > 0 ? stopSequencesArray : undefined,
        enabledMcpServers: sessionEnabledMcpServerIds.length > 0 ? sessionEnabledMcpServerIds : undefined,
      });
      
      toast.success("聊天设置已保存！");
      if (onClosePanel) {
        setTimeout(() => onClosePanel(), 300); // 延迟关闭，便于用户看到保存提示
      }
    }
  };
  
  const currentModel = selectedModelId ? getModelById(selectedModelId) : null;
  const currentProvider = currentModel ? getProviderById(currentModel.providerId) : null;

  if (!activeChatSession) return null;

  return (
    <div className="w-full h-full flex flex-col p-4 space-y-4 overflow-y-auto bg-[var(--color-panel)]">
      <div className="space-y-1">
        <h4 className="font-medium leading-none">聊天设置</h4>
        <p className="text-xs text-muted-foreground">
          为当前对话调整模型和参数。
        </p>
      </div>

      <div className="space-y-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="input-preprocessing-switch" className="text-sm font-medium">
            输入预处理
            <p className="text-xs text-muted-foreground font-normal">
              启用敏感词过滤和指令注入防护。
            </p>
          </Label>
          <Switch
            id="input-preprocessing-switch"
            checked={appSettings.enableInputPreprocessing}
            onCheckedChange={toggleInputPreprocessing}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="model-select">AI 模型</Label>
          <Select value={selectedModelId} onValueChange={setSelectedModelId} name="model-select">
            <SelectTrigger className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="选择一个模型">
                {selectedModelId && currentModel && currentProvider ?
                  <span className="text-xs">{currentProvider.name} / {currentModel.name} <span className="text-gray-400">({currentProvider.type})</span></span> :
                  "选择一个模型"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700">
              {providers.map(provider => (
                <React.Fragment key={provider.id}>
                  <Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{provider.name} <span className="text-gray-400">({provider.type})</span></Label>
                  {models.filter(m => m.providerId === provider.id).map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="system-prompt">系统提示 (System Prompt)</Label>
          <Textarea
            id="system-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="例如：你是一个乐于助人的助手。"
            rows={3}
            className="text-xs"
          />
        </div>

        <Slider
          label="Temperature"
          min={0}
          max={2}
          step={0.01}
          value={temperature === undefined ? 0.7 : temperature}
          defaultValue={0.7}
          onValueChange={v => setTemperature(v)}
          showValue
          className="mt-2"
        />
        <Slider
          label="Max Tokens"
          min={1}
          max={4096}
          step={1}
          value={maxTokens === undefined ? 2048 : maxTokens}
          defaultValue={2048}
          onValueChange={v => setMaxTokens(Math.round(v))}
          showValue
          className="mt-2"
        />
        <Slider
          label="Top P"
          min={0}
          max={1}
          step={0.01}
          value={topP === undefined ? 1 : topP}
          defaultValue={1}
          onValueChange={v => setTopP(v)}
          showValue
          className="mt-2"
        />
        <Slider
          label="Presence Penalty"
          min={-2}
          max={2}
          step={0.01}
          value={presencePenalty === undefined ? 0 : presencePenalty}
          defaultValue={0}
          onValueChange={v => setPresencePenalty(v)}
          showValue
          className="mt-2"
        />
        <Slider
          label="Frequency Penalty"
          min={-2}
          max={2}
          step={0.01}
          value={frequencyPenalty === undefined ? 0 : frequencyPenalty}
          defaultValue={0}
          onValueChange={v => setFrequencyPenalty(v)}
          showValue
          className="mt-2"
        />
        <div className="flex flex-row items-center gap-2 mt-2">
          <Checkbox
            id="structured-output"
            checked={structuredOutput}
            onCheckedChange={v => setStructuredOutput(v === true)}
          />
          <Label htmlFor="structured-output" className="ml-2 text-xs">结构化输出 (Structured Output)</Label>
        </div>
        {structuredOutput && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="json-schema">自定义 JSON Schema</Label>
            <Textarea
              id="json-schema"
              value={jsonSchemaInput}
              onChange={e => setJsonSchemaInput(e.target.value)}
              placeholder='输入一个OpenAPI schema对象来约束模型输出。有关示例，请参阅API文档。'
              rows={4}
              className="text-xs font-mono"
            />
          </div>
        )}
        <div className="flex flex-row items-center gap-2 mt-2">
          <Checkbox
            id="stream"
            checked={stream}
            onCheckedChange={v => setStream(v === true)}
          />
          <Label htmlFor="stream" className="ml-2 text-xs">流式响应 (Stream)</Label>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="user">User (API参数)</Label>
          <Input
            id="user"
            type="text"
            value={user ?? ""}
            onChange={e => setUser(e.target.value)}
            placeholder="可选"
            className="text-xs"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="stop-sequences">停止序列 (Stop Sequences)</Label>
          <Textarea
            id="stop-sequences"
            value={stopSequencesInput}
            onChange={(e) => setStopSequencesInput(e.target.value)}
            placeholder="每行或用逗号分隔一个序列&#10;例如：&#10;Human:, User:, ###"
            rows={3}
            className="text-xs"
          />
          <p className="text-xs text-muted-foreground">
            模型在生成这些序列时会停止。
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>启用的 MCP 服务 (当前会话)</Label>
          {mcpServers.length === 0 ? (
            <p className="text-xs text-muted-foreground">没有可配置的 MCP 服务。请先在全局设置中添加。</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {mcpServers.map(server => (
                <div key={server.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mcp-session-${server.id}`}
                    checked={sessionEnabledMcpServerIds.includes(server.id)}
                    onCheckedChange={(checked) => {
                      setSessionEnabledMcpServerIds(prev =>
                        checked ? [...prev, server.id] : prev.filter(id => id !== server.id)
                      );
                    }}
                  />
                  <Label htmlFor={`mcp-session-${server.id}`} className="text-xs font-normal flex items-center">
                    <Server size={12} className="mr-1.5 text-gray-500"/> {server.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            选择在此次对话中允许 AI 使用的 MCP 服务。
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="logit-bias">Logit Bias (JSON)</Label>
          <Textarea
            id="logit-bias"
            value={logitBiasInput}
            onChange={e => setLogitBiasInput(e.target.value)}
            placeholder='如：{"50256": -100, "100": 10}'
            rows={2}
            className="text-xs font-mono"
          />
        </div>
        <Button onClick={handleSaveSettings} className="w-full mt-2" size="sm">
          应用设置
        </Button>
      </div>
    </div>
  );
  };

export { ChatSettingsPanel };