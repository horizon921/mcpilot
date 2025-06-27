"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { Textarea } from '@/components/Common/Textarea';
import { Label } from '@/components/Common/Label';
import { useSettingsStore } from '@/store/settingsStore';
import { ScrollArea } from '@/components/Common/ScrollArea';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/Select';
import type { Message } from '@/types/chat';
import { ArrowLeft, Check, FileText, Pencil, BrainCircuit, Home } from 'lucide-react';
import Link from 'next/link';

// Reverted to the state before major UI/hydration changes
const STEPS = {
  PREPARATION: 0,
  OUTLINE_REVISION: 1,
  FINAL_ESSAY: 2,
  DISPLAY: 3,
};

export default function PoliticalEssayAgentPage() {
  const [step, setStep] = useState(STEPS.PREPARATION);
  const [loading, setLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    requirements: '',
    textbooks: '',
    sampleEssays: '',
    userIdea: '',
    outline: '',
    essay: '',
    feedback: ''
  });

  const { models, providers, getModelById, getProviderById, getApiKey, appSettings } = useSettingsStore();

  // Initialize model selection from store
  useEffect(() => {
    if (!selectedModelId && appSettings.defaultModelId) {
      setSelectedModelId(appSettings.defaultModelId);
    }
  }, [selectedModelId, appSettings.defaultModelId]);

  const modelOptions = useMemo(() => {
    return models.map(model => ({
      value: model.id,
      label: `${getProviderById(model.providerId)?.name || 'Unknown'} - ${model.name}`
    }));
  }, [models, getProviderById]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const callChatAPIStream = async (
    systemPrompt: string,
    userPrompt: string,
    onStart: () => void,
    onDelta: (chunk: string) => void,
    onEnd: () => void
  ) => {
    if (!selectedModelId) {
      toast.error("请先选择一个模型");
      return;
    }
    const model = getModelById(selectedModelId);
    if (!model) {
      toast.error(`未找到ID为 ${selectedModelId} 的模型配置`);
      return;
    }
    const provider = getProviderById(model.providerId);
    if (!provider) {
      toast.error("找不到模型对应的提供商");
      return;
    }

    onStart();
    setLoading(true);

    try {
      const messages: Partial<Message>[] = [{ role: 'user', content: userPrompt }];
      const requestBody: any = {
        messages,
        modelNativeId: model.modelNativeId,
        providerId: provider.id,
        providerType: provider.type,
        baseUrl: provider.baseUrl,
        systemPrompt: systemPrompt,
        stream: true,
        clientProvidedApiKey: getApiKey(provider.id) || undefined,
      };

      if (model.maxTokens) {
        requestBody.maxTokens = model.maxTokens;
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API 错误: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const jsonString = line.substring('data: '.length);
          try {
            const parsed = JSON.parse(jsonString);
            if (parsed.type === 'content_delta' && parsed.content) {
              onDelta(parsed.content);
            }
          } catch (e) {
            console.error("解析流块时出错:", e, "块:", jsonString);
          }
        }
      }
    } catch (error: any) {
      toast.error(`请求失败: ${error.message}`);
    } finally {
      setLoading(false);
      onEnd();
    }
  };

  const handleGenerateOutline = () => {
    const systemPrompt = "你可以将以下内容作为参考，构建你自己论文的写作逻辑。注意，要保证素材本身的真实性、准确性和时效性，增强素材之间的关联和逻辑。最终你要输出一个论文的提纲。注意：总字数4000字到7000字（6000字为宜），你要想好每个部分要用到哪些素材。";
    const userPrompt = `论文题目: ${formData.title || '未指定'}\n写作要求: ${formData.requirements}\n参考教材: ${formData.textbooks}\n往年优秀论文: ${formData.sampleEssays || '无'}\n我的选题思路: ${formData.userIdea || '无'}`;
    callChatAPIStream(systemPrompt, userPrompt, () => { setFormData(prev => ({ ...prev, outline: '' })); setStep(STEPS.OUTLINE_REVISION); }, (delta) => setFormData(prev => ({ ...prev, outline: prev.outline + delta })), () => {});
  };

  const handleReviseOutline = () => {
    const systemPrompt = "请根据用户提出的修改意见，对下面的论文提纲进行修改和完善。保持提纲的完整结构，并以Markdown格式返回新的提纲。";
    const userPrompt = `原始提纲:\n${formData.outline}\n\n我的修改意见:\n${formData.feedback}`;
    callChatAPIStream(systemPrompt, userPrompt, () => { setFormData(prev => ({ ...prev, outline: '', feedback: '' })); }, (delta) => setFormData(prev => ({ ...prev, outline: prev.outline + delta })), () => toast.success("提纲已更新"));
  };

  const handleGenerateEssay = () => {
    const systemPrompt = `现在,请你按照上面的文章提纲和分论点、以及给出的各种素材（理论、事例、名言等），生成完整的文章。\n要求：\n1.确保文章内容为中文，并且不少于4000字，最好不要超过7000字。\n2.确保文章中不会出现很多小标题，只在你给出的提纲的每一部分开头加入必要的小标题即可，从而保证文本内容的连贯和流畅。\n3.引言不等于摘要，请不要在引言部分出现例如“本文旨在……”等存在自我指涉的文字。\n4.不要用素材来代替论证，你已经在提纲中给出了各种分论点和素材（论据），这些素材并非必须使用。相反，你可以在必要时对其做出取舍。在输出整篇文章的过程中，请多补充一些逻辑论证来串起论点与论据，使论据自然得融入到你的论证之中，从而使每一部分逻辑通畅、脉络清晰。再次强调：多补充论证，并将素材自然地融入论证之中，不要用素材代替论证，要多用自己的话写作。\n5.确保你的每一部分之间的衔接自然流畅，你可以适当的加入一些衔接上下文的句子。\n6.最后一部分在最终的整篇文章中应当起到一个增强气势、发出号召的作用，所以语言应当是掷地有声、铿锵有力的，你可以写作最后一部分时优化语言表达。\n7.在每个分论点之间，尽可能避免使用“首先”“其次”“再次”“最后”等非常明显的衔接词，你可以用其他方式让分论点之间的衔接更加自然，\n8.再次强调，你之前在提纲中给出的素材不一定都要使用，你可以根据论证的需要适当取舍，要关注素材之间的衔接关系和逻辑关系，也要关注素材和论点之间的关系，将素材自然地融入论证之中。\n9.确保思想健康，内容充实，语言流畅，逻辑清晰，符合社会主义核心价值观。\n现在，请输出你的整篇文章吧。`;
    const userPrompt = `# 原始输入材料\n## 论文题目: ${formData.title || '未指定'}\n## 写作要求: ${formData.requirements}\n## 参考教材: ${formData.textbooks}\n## 往年优秀论文: ${formData.sampleEssays || '无'}\n## 我的选题思路: ${formData.userIdea || '无'}\n\n# 最终确认的论文提纲\n${formData.outline}`;
    callChatAPIStream(systemPrompt, userPrompt, () => { setFormData(prev => ({ ...prev, essay: '' })); setStep(STEPS.FINAL_ESSAY); }, (delta) => setFormData(prev => ({ ...prev, essay: prev.essay + delta })), () => {});
  };

  const handleReviseEssay = () => {
    const systemPrompt = "请根据用户的修改意见，对下面的论文进行修改。请仔细阅读用户的反馈，并对文章进行相应的调整。返回修改后的完整论文，使用Markdown格式。";
    const userPrompt = `原始论文:\n${formData.essay}\n\n我的修改意见:\n${formData.feedback}`;
    callChatAPIStream(systemPrompt, userPrompt, () => { setFormData(prev => ({ ...prev, essay: '', feedback: '' })); }, (delta) => setFormData(prev => ({ ...prev, essay: prev.essay + delta })), () => toast.success("论文已更新"));
  };

  const wordCount = useMemo(() => formData.essay.replace(/\s+/g, '').length, [formData.essay]);

  const renderStepContent = () => {
    switch (step) {
      case STEPS.PREPARATION:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">论文题目 (可选)</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="请输入论文题目" />
              </div>
              <div>
                <Label htmlFor="requirements">论文要求 (必填)</Label>
                <Textarea id="requirements" name="requirements" value={formData.requirements} onChange={handleChange} placeholder="请输入老师布置的写作要求" rows={6} />
              </div>
              <div>
                <Label htmlFor="userIdea">个人选题思路 (可选)</Label>
                <Textarea id="userIdea" name="userIdea" value={formData.userIdea} onChange={handleChange} placeholder="描述你的选题想法和思路" rows={6} />
              </div>
              <div>
                <Label htmlFor="textbooks">参考教材 (必填, Markdown)</Label>
                <Textarea id="textbooks" name="textbooks" value={formData.textbooks} onChange={handleChange} placeholder="粘贴教材内容（Markdown格式）" rows={10} />
              </div>
              <div>
                <Label htmlFor="sampleEssays">往年优秀论文 (选填, Markdown)</Label>
                <Textarea id="sampleEssays" name="sampleEssays" value={formData.sampleEssays} onChange={handleChange} placeholder="粘贴优秀论文内容（Markdown格式）" rows={10} />
              </div>
            </div>
            <Button onClick={handleGenerateOutline} disabled={loading || !formData.requirements || !formData.textbooks || !selectedModelId} className="w-full">
              {loading ? '处理中...' : '生成提纲'}
            </Button>
          </div>
        );
      case STEPS.OUTLINE_REVISION:
      case STEPS.FINAL_ESSAY:
        const isEssayStep = step === STEPS.FINAL_ESSAY;
        return (
          <div className="flex flex-col h-full">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                <Label>{isEssayStep ? "AI生成论文" : "AI生成提纲"} (生成完毕后可编辑)</Label>
                {isEssayStep && <span className="text-sm text-gray-500 dark:text-gray-400">{wordCount} 字</span>}
              </div>
              <div className="flex-grow border rounded-md bg-white dark:bg-gray-900 min-h-[300px] flex flex-col">
                <Textarea
                  name={isEssayStep ? "essay" : "outline"}
                  value={isEssayStep ? formData.essay : formData.outline}
                  onChange={handleChange}
                  className="flex-grow w-full resize-none border-none focus:ring-0 p-2 font-mono text-sm bg-transparent overflow-y-auto"
                  readOnly={loading}
                />
              </div>
            </div>
            <div className="flex-shrink-0 mt-4">
              <Label>修改要求</Label>
              <Textarea name="feedback" value={formData.feedback} onChange={handleChange} placeholder="输入你的修改意见..." rows={3} disabled={loading} />
              <div className="flex justify-end mt-2">
                <Button onClick={isEssayStep ? handleReviseEssay : handleReviseOutline} disabled={loading || !formData.feedback}>
                  {loading ? '修改中...' : (isEssayStep ? '修改论文' : '修改提纲')}
                </Button>
              </div>
            </div>
          </div>
        );
      case STEPS.DISPLAY:
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <Button variant="outline" onClick={() => setStep(STEPS.FINAL_ESSAY)}><ArrowLeft size={16} className="mr-2" /> 返回修改</Button>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{wordCount} 字</span>
            </div>
            <ScrollArea className="h-[calc(100vh-12rem)] border rounded-lg p-4 bg-white dark:bg-gray-900">
              <ReactMarkdown className="prose dark:prose-invert max-w-none">{formData.essay}</ReactMarkdown>
            </ScrollArea>
          </div>
        );
    }
  };

  const stepConfig = [
    { title: '前期准备', icon: Pencil },
    { title: '提纲修改', icon: BrainCircuit },
    { title: '最终成文', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <aside className="w-64 flex-shrink-0 p-4 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col">
        <div className="p-2 mb-6">
          <Link href="/" className="inline-block mb-4">
            <Button variant="ghost" className="w-full justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Home className="w-5 h-5 mr-3" />
                返回主页
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">思政论文助手</h1>
        </div>
        <nav className="space-y-2 flex-grow">
          {stepConfig.map((item, index) => (
            <div key={index} className={`flex items-center p-3 rounded-lg transition-all cursor-default ${step === index ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.title}</span>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="max-w-md mx-auto">
            <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">选择模型</Label>
            <Select onValueChange={setSelectedModelId} value={selectedModelId || ''}>
              <SelectTrigger><SelectValue placeholder="选择一个AI模型..." /></SelectTrigger>
              <SelectContent>
                {modelOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto h-full">
            {renderStepContent()}
          </div>
        </div>

        {step < STEPS.DISPLAY && (
          <footer className="flex-shrink-0 p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto flex justify-between gap-4">
              <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={loading || step === 0}>上一步</Button>
              {step === STEPS.OUTLINE_REVISION && <Button onClick={handleGenerateEssay} disabled={loading || !formData.outline} className="flex-1">生成完整论文</Button>}
              {step === STEPS.FINAL_ESSAY && <Button onClick={() => setStep(STEPS.DISPLAY)} disabled={loading} className="flex-1"><Check className="w-4 h-4 mr-2"/>最终敲定</Button>}
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}