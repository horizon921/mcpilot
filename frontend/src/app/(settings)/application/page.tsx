"use client";

import React, { useState } from 'react'; // Added useState
import { useSettingsStore } from '@/store/settingsStore';
import type { AppSettings } from '@/types/config';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input'; // Added Input
import { Label } from '@/components/Common/Label';   // Added Label
import { Sun, Moon, Laptop } from 'lucide-react';

type ThemeOption = AppSettings["theme"];

const themeOptions: { value: ThemeOption; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: '浅色模式', icon: Sun },
  { value: 'dark', label: '深色模式', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Laptop },
];

export default function ApplicationSettingsPage() {
  const { appSettings, setTheme, updateAppSettings } = useSettingsStore();
  const currentTheme = appSettings.theme;

  // Local state for debouncing or direct update for model params
  // For simplicity, we'll update directly on change for now.
  // Consider debounce for better UX with number inputs if needed.

  const handleThemeChange = (selectedTheme: ThemeOption) => {
    setTheme(selectedTheme);
  };

  const handleAppSettingChange = (key: keyof AppSettings, value: any) => {
    // Basic type coercion for number inputs
    let processedValue = value;
    if (key === 'defaultTemperature' || key === 'defaultTopP') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) processedValue = undefined; // Or set to a default/previous valid value
    } else if (key === 'defaultMaxTokens') {
      processedValue = parseInt(value, 10);
      if (isNaN(processedValue)) processedValue = undefined;
    }
    updateAppSettings({ [key]: processedValue });
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">应用设置</h1>
        <p className="text-gray-600 dark:text-gray-400">管理应用的全局设置。</p>
      </div>

      <div className="space-y-4 p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <h2 className="text-lg font-medium">外观</h2>
        <div>
          <h3 className="text-md font-medium mb-2">主题</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            选择应用界面的外观主题。
          </p>
          <div className="flex space-x-2 rounded-md bg-gray-100 dark:bg-gray-900 p-1 w-fit">
            {themeOptions.map((option) => (
              <Button
                key={option.value}
                variant={currentTheme === option.value ? 'default' : 'ghost'}
                onClick={() => handleThemeChange(option.value)}
                className={`flex items-center justify-center px-4 py-2 text-sm rounded-md transition-colors
                  ${currentTheme === option.value 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
                aria-pressed={currentTheme === option.value}
              >
                <option.icon size={16} className="mr-2" />
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        {/* Future: Add other appearance settings like font size, compact mode, etc. */}
      </div>

      <div className="space-y-4 p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <h2 className="text-lg font-medium">默认模型参数</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          为新对话设置默认的 AI 模型参数。这些参数可以在每个聊天会话中单独覆盖。
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <Label htmlFor="defaultTemperature" className="text-sm font-medium">
              默认 Temperature (0.0 - 2.0)
            </Label>
            <Input
              id="defaultTemperature"
              type="number"
              value={appSettings.defaultTemperature === undefined ? '' : String(appSettings.defaultTemperature)}
              onChange={(e) => handleAppSettingChange('defaultTemperature', e.target.value)}
              placeholder="例如: 0.7"
              min="0"
              max="2"
              step="0.1"
              className="mt-1 w-full"
            />
            <p className="text-xs text-gray-400 mt-1">控制输出的随机性。较低值更保守，较高值更具创造性。</p>
          </div>

          <div>
            <Label htmlFor="defaultTopP" className="text-sm font-medium">
              默认 Top P (0.0 - 1.0)
            </Label>
            <Input
              id="defaultTopP"
              type="number"
              value={appSettings.defaultTopP === undefined ? '' : String(appSettings.defaultTopP)}
              onChange={(e) => handleAppSettingChange('defaultTopP', e.target.value)}
              placeholder="例如: 0.9"
              min="0"
              max="1"
              step="0.01"
              className="mt-1 w-full"
            />
             <p className="text-xs text-gray-400 mt-1">一种替代温度采样的方法，称为核心采样。</p>
          </div>

          <div>
            <Label htmlFor="defaultMaxTokens" className="text-sm font-medium">
              默认 Max Tokens
            </Label>
            <Input
              id="defaultMaxTokens"
              type="number"
              value={appSettings.defaultMaxTokens === undefined ? '' : String(appSettings.defaultMaxTokens)}
              onChange={(e) => handleAppSettingChange('defaultMaxTokens', e.target.value)}
              placeholder="例如: 2048"
              min="0"
              step="1"
              className="mt-1 w-full"
            />
            <p className="text-xs text-gray-400 mt-1">限制模型单次响应生成的最大 token 数量。</p>
          </div>
        </div>
      </div>
      {/* Future: Add other sections like Language etc. */}
    </div>
  );
}