'use client';

import { useSettingsStore, DEFAULT_SUGGESTIONS_PROMPT, DEFAULT_CHAT_PROMPT } from '@/store/useSettingsStore';
import { Settings, X, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export function SettingsModal({ children, triggerClassName }: { children?: React.ReactNode, triggerClassName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const settings = useSettingsStore();
  const { updateSettings, resetToDefaults } = settings;

  // Local state for form editing
  const [localSettings, setLocalSettings] = useState({
    suggestionsPrompt: settings.suggestionsPrompt,
    chatPrompt: settings.chatPrompt,
    suggestionsContextLines: settings.suggestionsContextLines,
    chatContextLines: settings.chatContextLines,
    model: settings.model,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    suggestionCount: settings.suggestionCount,
    autoRefreshInterval: settings.autoRefreshInterval,
  });

  // API Key State
  const [hasKey, setHasKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState({ type: '', message: '' });

  const [confirmRemoveKey, setConfirmRemoveKey] = useState(false);

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings({
        suggestionsPrompt: settings.suggestionsPrompt,
        chatPrompt: settings.chatPrompt,
        suggestionsContextLines: settings.suggestionsContextLines,
        chatContextLines: settings.chatContextLines,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        suggestionCount: settings.suggestionCount,
        autoRefreshInterval: settings.autoRefreshInterval,
      });
      
      // Fetch API Key status
      const checkKey = async () => {
        try {
          const res = await fetch('/api/user/apikey');
          if (res.ok) {
            const data = await res.json();
            setHasKey(data.hasKey);
          }
        } catch (e) {
          console.error('Failed to check API key status', e);
        }
      };
      checkKey();
    } else {
      // Clear feedback when closing
      setKeyFeedback({ type: '', message: '' });
      setApiKeyInput('');
      setConfirmRemoveKey(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    updateSettings(localSettings);
    setIsOpen(false);
  };

  const handleReset = () => {
    resetToDefaults();
    setLocalSettings({
      suggestionsPrompt: DEFAULT_SUGGESTIONS_PROMPT,
      chatPrompt: DEFAULT_CHAT_PROMPT,
      suggestionsContextLines: 12,
      chatContextLines: 15,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 1024,
      suggestionCount: 3,
      autoRefreshInterval: 25,
    });
  };

  const updateLocal = (key: string, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput.startsWith('gsk_')) {
      setKeyFeedback({ type: 'error', message: 'Key must start with gsk_' });
      return;
    }

    setIsKeyLoading(true);
    setKeyFeedback({ type: '', message: '' });

    try {
      const res = await fetch('/api/user/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groqApiKey: apiKeyInput }),
      });

      if (res.ok) {
        setHasKey(true);
        setApiKeyInput('');
        setKeyFeedback({ type: 'success', message: 'API key saved securely' });
      } else {
        const data = await res.json();
        setKeyFeedback({ type: 'error', message: data.error || 'Failed to save key' });
      }
    } catch {
      setKeyFeedback({ type: 'error', message: 'Network error' });
    } finally {
      setIsKeyLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    setIsKeyLoading(true);
    setKeyFeedback({ type: '', message: '' });

    try {
      const res = await fetch('/api/user/apikey', {
        method: 'DELETE',
      });

      if (res.ok) {
        setHasKey(false);
        setConfirmRemoveKey(false);
        setKeyFeedback({ type: 'success', message: 'API key removed' });
      } else {
        setKeyFeedback({ type: 'error', message: 'Failed to remove key' });
      }
    } catch {
      setKeyFeedback({ type: 'error', message: 'Network error' });
    } finally {
      setIsKeyLoading(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className={triggerClassName || "cursor-pointer inline-block"}>
        {children || (
          <button
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] mx-4 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-none bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-sky-600" />
                <h2 className="text-base font-bold text-[#0f2e4a] tracking-tight">Configuration</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                  title="Reset all to defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">

              {/* API Key Section Removed since it's hardcoded */}

              {/* Model & Parameters Section */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Model &amp; Parameters</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Model</label>
                    <select
                      value={localSettings.model}
                      onChange={(e) => updateLocal('model', e.target.value)}
                      className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 shadow-sm"
                    >
                      <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                      <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                      <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                      <option value="gemma2-9b-it">Gemma 2 9B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      Temperature <span className="text-sky-600 ml-1">{localSettings.temperature}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={localSettings.temperature}
                      onChange={(e) => updateLocal('temperature', parseFloat(e.target.value))}
                      className="w-full accent-sky-600 h-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Max Output Tokens</label>
                    <input
                      type="number"
                      min="128"
                      max="4096"
                      step="128"
                      value={localSettings.maxTokens}
                      onChange={(e) => updateLocal('maxTokens', parseInt(e.target.value) || 1024)}
                      className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Suggestions per batch</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={localSettings.suggestionCount}
                      onChange={(e) => updateLocal('suggestionCount', parseInt(e.target.value) || 3)}
                      className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Context Windows Section */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Context Windows</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      Suggestions Window
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="3"
                        max="50"
                        value={localSettings.suggestionsContextLines}
                        onChange={(e) => updateLocal('suggestionsContextLines', parseInt(e.target.value) || 12)}
                        className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 shadow-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lines</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      Chat Context Window
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="3"
                        max="50"
                        value={localSettings.chatContextLines}
                        onChange={(e) => updateLocal('chatContextLines', parseInt(e.target.value) || 15)}
                        className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 shadow-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lines</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Auto-Refresh Interval</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={localSettings.autoRefreshInterval}
                        onChange={(e) => updateLocal('autoRefreshInterval', parseInt(e.target.value) || 25)}
                        className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 shadow-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Sec</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* System Prompts Section */}
              <section className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 mb-4">Live Suggestions Prompt</h3>
                  <textarea
                    value={localSettings.suggestionsPrompt}
                    onChange={(e) => updateLocal('suggestionsPrompt', e.target.value)}
                    rows={8}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-mono leading-relaxed focus:outline-none focus:border-sky-500 shadow-inner transition-all resize-y custom-scrollbar"
                  />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 mb-4">Chat / Answers Prompt</h3>
                  <textarea
                    value={localSettings.chatPrompt}
                    onChange={(e) => updateLocal('chatPrompt', e.target.value)}
                    rows={8}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-mono leading-relaxed focus:outline-none focus:border-sky-500 shadow-inner transition-all resize-y custom-scrollbar"
                  />
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="flex-none flex items-center justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2.5 text-sm font-bold text-white bg-[#0f2e4a] hover:bg-[#1a3f61] rounded-xl transition-all shadow-md active:scale-95"
              >
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
