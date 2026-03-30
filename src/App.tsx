/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, BookOpen, User, Scan, Search, Mic, Image as ImageIcon, Send, X, RotateCcw, FileText, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Patient, Message, Draft } from './types';
import { MOCK_PATIENTS, MOCK_DRAFTS } from './constants';
import { chatWithAI, generateImage } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'assistant' | 'patients' | 'knowledge' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('assistant');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好，我是您的医疗AI助理 MedDoc。您可以直接对我说话、拍照或输入文字，我会为您提供临床辅助。',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  const handleSendMessage = async (text?: string) => {
    const content = text || inputValue;
    if (!content.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Check if it's an image generation request
      if (content.startsWith('画一个') || content.toLowerCase().startsWith('draw a')) {
        const imageUrl = await generateImage(content);
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `已为您生成图像：\n\n![Generated Image](${imageUrl})`,
          timestamp: Date.now(),
          type: 'image',
          metadata: { imageUrl }
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const aiResponse = await chatWithAI(content, currentPatient, apiKey);
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse || '抱歉，我暂时无法处理您的请求。',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，处理您的请求时发生了错误。请确保 API Key 已正确配置。',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const selectPatient = (patient: Patient) => {
    setCurrentPatient(patient);
    setActiveTab('assistant');
    // Clear history for new context as per PRD 5.2
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `已为您切换至患者：**${patient.bed} ${patient.name}** (${patient.diagnosis})。您可以开始查房录音或询问该患者的相关信息。`,
        timestamp: Date.now()
      }
    ]);
  };

  const handleScan = () => {
    const randomPatient = MOCK_PATIENTS[Math.floor(Math.random() * MOCK_PATIENTS.length)];
    selectPatient(randomPatient);
  };

  const handlePhotoAction = () => {
    const mockMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '[图片：外院血生化化验单.jpg] 帮我把异常指标提出来。',
      timestamp: Date.now(),
      type: 'image'
    };
    setMessages(prev => [...prev, mockMsg]);
    setIsTyping(true);
    
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `识别到 3 项异常指标：
- **钾 (K)**：3.1 mmol/L ↓ (偏低)
- **谷丙转氨酶 (ALT)**：65 U/L ↑ (偏高)
- **肌酐 (Cr)**：110 μmol/L ↑ (偏高)

[生成检验小结] [一键填入入院记录]`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-medical-bg overflow-hidden shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 safe-area-top flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-primary flex items-center justify-center text-white font-bold shadow-sm">M</div>
          <h1 className="font-bold text-lg tracking-tight">MedDoc AI</h1>
        </div>
        {(activeTab === 'patients' || activeTab === 'assistant') && (
          <button onClick={handleScan} className="p-2 hover:bg-slate-50 rounded-full transition-colors active:scale-90">
            <Scan size={20} className="text-slate-600" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {activeTab === 'assistant' && (
            <motion.div 
              key="assistant"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full"
            >
              {/* Context Bar */}
              {currentPatient && (
                <div className="bg-blue-50/80 backdrop-blur-sm border-b border-blue-100 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    当前上下文：{currentPatient.bed} {currentPatient.name} ({currentPatient.diagnosis})
                  </div>
                  <button onClick={() => setCurrentPatient(null)} className="p-1 hover:bg-blue-100 rounded-full">
                    <X size={14} className="text-blue-500" />
                  </button>
                </div>
              )}

              {/* Chat Area */}
              <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                      msg.role === 'user' ? "bg-medical-primary text-white rounded-tr-none" : "bg-white border border-slate-100 rounded-tl-none"
                    )}>
                      <div className={cn("prose prose-sm max-w-none", msg.role === 'user' ? "text-white" : "text-slate-800")}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      
                      {msg.role === 'assistant' && msg.id !== '1' && (
                        <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2 overflow-x-auto pb-1">
                          <button className="flex items-center gap-1 px-2 py-1 bg-slate-50 text-[10px] font-medium text-slate-500 rounded-md whitespace-nowrap hover:bg-slate-100">
                            <RotateCcw size={12} /> 重新生成
                          </button>
                          <button className="flex items-center gap-1 px-2 py-1 bg-slate-50 text-[10px] font-medium text-slate-500 rounded-md whitespace-nowrap hover:bg-slate-100">
                            <FileText size={12} /> 存为草稿
                          </button>
                          <button className="flex items-center gap-1 px-2 py-1 bg-slate-50 text-[10px] font-medium text-slate-500 rounded-md whitespace-nowrap hover:bg-slate-100">
                            <Monitor size={12} /> 发送至PC
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              <div className="px-4 py-2 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
                {['帮我写病程', '查询用药禁忌', '总结历史病历', '医学量表评测'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => handleSendMessage(p)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 whitespace-nowrap hover:border-medical-primary hover:text-medical-primary transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <div className="flex items-end gap-2">
                  <button 
                    onClick={handlePhotoAction}
                    className="p-2.5 text-slate-400 hover:text-medical-primary transition-colors active:scale-90"
                  >
                    <ImageIcon size={22} />
                  </button>
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 focus-within:border-medical-primary focus-within:ring-1 focus-within:ring-medical-primary/20 transition-all">
                    <textarea 
                      rows={1}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="说点什么...或按住说话"
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    {inputValue ? (
                      <button onClick={() => handleSendMessage()} className="text-medical-primary p-1">
                        <Send size={20} />
                      </button>
                    ) : (
                      <button 
                        onMouseDown={() => setIsRecording(true)}
                        onMouseUp={() => setIsRecording(false)}
                        className={cn(
                          "p-1 transition-all rounded-full",
                          isRecording ? "text-red-500 scale-125" : "text-slate-400"
                        )}
                      >
                        <Mic size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'patients' && (
            <motion.div 
              key="patients"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['我的患者', '全科患者', '今日入院', '今日出院'].map((f, i) => (
                  <button key={f} className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    i === 0 ? "bg-medical-primary text-white" : "bg-white border border-slate-200 text-slate-600"
                  )}>
                    {f}
                  </button>
                ))}
              </div>
              
              <div className="space-y-3">
                {MOCK_PATIENTS.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => selectPatient(p)}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center text-blue-600">
                        <span className="text-[10px] font-bold uppercase">{p.bed}</span>
                        <span className="text-sm font-bold">{p.name[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{p.name}</h3>
                          <span className="text-xs text-slate-400">{p.gender} {p.age}岁</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{p.diagnosis}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        p.careLevel === '一级' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                      )}>
                        {p.careLevel}
                      </span>
                      <div className="flex gap-1">
                        {p.status.missingAdmissionNote && <span className="w-2 h-2 rounded-full bg-red-500" title="缺入院记录" />}
                        {p.status.needsProgressNote && <span className="w-2 h-2 rounded-full bg-yellow-400" title="需写病程" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'knowledge' && (
            <motion.div 
              key="knowledge"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="搜疾病、搜指南、搜药品..." 
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-medical-primary focus:ring-1 focus:ring-medical-primary/20 transition-all"
                />
              </div>

              <section>
                <h2 className="text-sm font-bold text-slate-800 mb-3 px-1">速查工具箱</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: '用药禁忌核查', desc: '输入药品A+B', icon: '💊' },
                    { title: 'ICD-10编码', desc: '输入俗称查标准', icon: '🔢' },
                    { title: '医学量表', desc: 'Glasgow, APACHE', icon: '📊' },
                    { title: '院内规范', desc: '红头文件快查', icon: '🚩' }
                  ].map(tool => (
                    <div key={tool.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-medical-primary transition-all cursor-pointer">
                      <div className="text-2xl mb-2">{tool.icon}</div>
                      <h3 className="text-xs font-bold text-slate-800">{tool.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">{tool.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-bold text-slate-800 mb-3 px-1">热门指南</h2>
                <div className="space-y-3">
                  {[
                    '2023 高血压防治指南',
                    '2024 糖尿病临床路径',
                    '急性心肌梗死急诊处理规范'
                  ].map(g => (
                    <div key={g} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between group cursor-pointer">
                      <span className="text-xs text-slate-600 group-hover:text-medical-primary transition-colors">{g}</span>
                      <BookOpen size={14} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">王医生</h2>
                  <p className="text-xs text-slate-500">心内科 | 主治医师</p>
                </div>
              </div>

              <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Monitor size={16} className="text-medical-primary" />
                    AI 设置
                  </h2>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gemini API Key</label>
                  <div className="relative">
                    <input 
                      type="password"
                      value={apiKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setApiKey(val);
                        localStorage.setItem('gemini_api_key', val);
                      }}
                      placeholder="输入您的 Gemini API Key"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-medical-primary focus:ring-1 focus:ring-medical-primary/20 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    配置您的 API Key 以获得更稳定的 AI 服务。Key 将仅保存在本地浏览器中。
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-sm font-bold text-slate-800">云端草稿箱</h2>
                  <span className="text-[10px] text-medical-primary font-medium">查看全部</span>
                </div>
                <div className="space-y-3">
                  {MOCK_DRAFTS.map(d => (
                    <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-800">{d.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full">已同步</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{d.content}</p>
                      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                        <span>更新于 {new Date(d.updatedAt).toLocaleString()}</span>
                        <button className="text-medical-primary font-medium">继续编辑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-3">
                <button className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-xs font-bold text-slate-700 flex flex-col items-center gap-2">
                  <Monitor size={20} className="text-slate-400" />
                  多端同步
                </button>
                <button className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-xs font-bold text-slate-700 flex flex-col items-center gap-2">
                  <FileText size={20} className="text-slate-400" />
                  质控审批
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Tab Bar */}
      <nav className="bg-white border-t border-slate-100 px-6 py-3 safe-area-bottom flex items-center justify-between shrink-0">
        {[
          { id: 'assistant', label: 'AI助理', icon: MessageSquare },
          { id: 'patients', label: '患者', icon: Users },
          { id: 'knowledge', label: '知识库', icon: BookOpen },
          { id: 'profile', label: '我的', icon: User },
        ].map((t) => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === t.id ? "text-medical-primary scale-110" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <t.icon size={22} strokeWidth={activeTab === t.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Voice Mode Overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-medical-primary z-50 flex flex-col items-center justify-center p-8 text-white"
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-12">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">连续录音模式</h2>
                <p className="text-white/70 text-sm">正在实时转写并纠正医学术语...</p>
              </div>
              
              {/* Wave Animation */}
              <div className="flex items-center gap-1 h-32">
                {[...Array(12)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [20, 80, 40, 100, 20][i % 5] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }}
                    className="w-1.5 bg-white rounded-full"
                  />
                ))}
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 w-full max-w-xs">
                <p className="text-sm italic text-white/90 leading-relaxed">
                  “李四今天感觉怎么样？...昨天晚上睡得好吗？...伤口敷料有点渗出，换一下药...”
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsRecording(false)}
              className="mb-12 w-20 h-20 bg-white rounded-full flex items-center justify-center text-medical-primary shadow-xl active:scale-90 transition-all"
            >
              <X size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
