/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  ShieldCheck, 
  Settings, 
  Mic, 
  Image as ImageIcon, 
  Type, 
  Search, 
  Bell, 
  User,
  ChevronRight,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Loader2,
  History,
  Workflow
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_PATIENTS, DOC_TYPES } from './constants';
import { Patient, MedicalDoc, QCResult } from './types';
import { generateMedicalDocument, performQualityCheck } from './services/geminiService';

type Tab = 'dashboard' | 'patients' | 'editor' | 'knowledge' | 'qc' | 'admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState<any>(null);
  const [qcResults, setQcResults] = useState<QCResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [docType, setDocType] = useState(DOC_TYPES[0]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('editor');
  };

  const handleGenerateImage = async () => {
    if (!inputText) return;
    setIsGeneratingImage(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `医疗示意图: ${inputText}` }),
      });
      console.log(response,'res')
      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        alert("图片生成失败: " + (data.error || "未知错误"));
      }
    } catch (error) {
      console.error("Image generation error:", error);
      alert("图片生成请求失败");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPatient || !inputText) return;
    setIsGenerating(true);
    const result = await generateMedicalDocument(selectedPatient, inputText, docType);
    if (result) {
      setGeneratedDoc(result);
      // Automatically run QC after generation
      handleQC(JSON.stringify(result));
    }
    setIsGenerating(false);
  };

  const handleQC = async (content: string) => {
    setIsChecking(true);
    const results = await performQualityCheck(content);
    setQcResults(results);
    setIsChecking(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">MedDoc AI</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="工作看板" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="患者列表" 
            active={activeTab === 'patients'} 
            onClick={() => setActiveTab('patients')} 
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="智能文书" 
            active={activeTab === 'editor'} 
            onClick={() => setActiveTab('editor')} 
          />
          <SidebarItem 
            icon={<BookOpen size={20} />} 
            label="知识库" 
            active={activeTab === 'knowledge'} 
            onClick={() => setActiveTab('knowledge')} 
          />
          <SidebarItem 
            icon={<ShieldCheck size={20} />} 
            label="质控中心" 
            active={activeTab === 'qc'} 
            onClick={() => setActiveTab('qc')} 
          />
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="系统管理" 
            active={activeTab === 'admin'} 
            onClick={() => setActiveTab('admin')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
              <User size={20} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">王医生</p>
              <p className="text-xs text-slate-500">心血管内科</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {activeTab === 'dashboard' && '工作看板'}
              {activeTab === 'patients' && '患者列表'}
              {activeTab === 'editor' && '智能文书编辑器'}
              {activeTab === 'knowledge' && '临床知识库'}
              {activeTab === 'qc' && '文书质控中心'}
              {activeTab === 'admin' && '系统管理'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜索患者、指南、文书..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all w-64"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <DashboardView onPatientSelect={handlePatientSelect} />}
            {activeTab === 'patients' && <PatientsView onPatientSelect={handlePatientSelect} />}
            {activeTab === 'editor' && (
              <EditorView 
                selectedPatient={selectedPatient}
                inputText={inputText}
                setInputText={setInputText}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                generatedDoc={generatedDoc}
                qcResults={qcResults}
                isChecking={isChecking}
                docType={docType}
                setDocType={setDocType}
                onGenerateImage={handleGenerateImage}
                isGeneratingImage={isGeneratingImage}
                generatedImage={generatedImage}
                setGeneratedImage={setGeneratedImage}
              />
            )}
            {activeTab === 'knowledge' && <KnowledgeView />}
            {activeTab === 'qc' && <QCView />}
            {activeTab === 'admin' && <AdminView />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

// --- Views ---

function DashboardView({ onPatientSelect }: { onPatientSelect: (p: Patient) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="今日待写文书" value="12" subValue="+2 较昨日" color="blue" />
        <StatCard title="文书合格率" value="94.5%" subValue="+1.2% 较上月" color="emerald" />
        <StatCard title="平均书写时长" value="8.5 min" subValue="-15% 较上月" color="violet" />
        <StatCard title="质控预警" value="3" subValue="需立即处理" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="medical-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800">我的患者</h3>
              <button className="text-sm text-blue-600 hover:underline">查看全部</button>
            </div>
            <div className="space-y-4">
              {MOCK_PATIENTS.map(patient => (
                <div 
                  key={patient.id} 
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onPatientSelect(patient)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full ${patient.status === '危重' ? 'bg-red-500' : patient.status === '待手术' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    <div>
                      <p className="font-semibold text-slate-800">{patient.name} <span className="text-sm font-normal text-slate-500 ml-2">{patient.gender} | {patient.age}岁</span></p>
                      <p className="text-xs text-slate-500">床位: {patient.bedNo} | 诊断: {patient.diagnosis}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="medical-card p-6">
            <h3 className="font-bold text-slate-800 mb-6">质控动态</h3>
            <div className="space-y-4">
              <QCAlertItem type="error" message="张三 入院记录 逻辑一致性校验失败" time="10分钟前" />
              <QCAlertItem type="warning" message="李四 病程记录 必填项缺失: 查体" time="30分钟前" />
              <QCAlertItem type="info" message="王五 手术记录 已通过AI质控" time="1小时前" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PatientsView({ onPatientSelect }: { onPatientSelect: (p: Patient) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="medical-card p-6"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-slate-800">全院患者列表</h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">心血管内科</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">我的患者</span>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} />
          <span>登记新患者</span>
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <th className="pb-4 pl-4">患者信息</th>
            <th className="pb-4">床位/科室</th>
            <th className="pb-4">入院日期</th>
            <th className="pb-4">主诊断</th>
            <th className="pb-4">状态</th>
            <th className="pb-4 pr-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {MOCK_PATIENTS.map(patient => (
            <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="py-4 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                    {patient.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{patient.name}</p>
                    <p className="text-xs text-slate-500">ID: {patient.id}</p>
                  </div>
                </div>
              </td>
              <td className="py-4">
                <p className="text-sm text-slate-700 font-medium">{patient.bedNo}</p>
                <p className="text-xs text-slate-500">{patient.department}</p>
              </td>
              <td className="py-4 text-sm text-slate-600">{patient.admissionDate}</td>
              <td className="py-4 text-sm text-slate-700">{patient.diagnosis}</td>
              <td className="py-4">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  patient.status === '危重' ? 'bg-red-100 text-red-700' : 
                  patient.status === '待手术' ? 'bg-amber-100 text-amber-700' : 
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {patient.status}
                </span>
              </td>
              <td className="py-4 pr-4 text-right">
                <button 
                  onClick={() => onPatientSelect(patient)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  写文书
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

function EditorView({ 
  selectedPatient, 
  inputText, 
  setInputText, 
  isRecording, 
  setIsRecording, 
  isGenerating, 
  onGenerate,
  generatedDoc,
  qcResults,
  isChecking,
  docType,
  setDocType,
  onGenerateImage,
  isGeneratingImage,
  generatedImage,
  setGeneratedImage
}: any) {
  if (!selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
        <FileText size={64} strokeWidth={1} />
        <p>请先在患者列表选择一名患者开始书写文书</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full"
    >
      {/* Left: Patient Info & Input */}
      <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
        <div className="medical-card overflow-hidden border-blue-100">
          <div className="bg-blue-600 px-5 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {selectedPatient.name[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{selectedPatient.name}</h3>
                <p className="text-blue-100 text-[10px] font-medium uppercase tracking-wider">ID: {selectedPatient.id}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-blue-200 uppercase font-bold">床位</span>
              <span className="text-white font-bold text-lg">{selectedPatient.bedNo}</span>
            </div>
          </div>
          <div className="p-5 space-y-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">性别 / 年龄</span>
                <p className="text-sm font-semibold text-slate-700">{selectedPatient.gender} / {selectedPatient.age}岁</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">入院日期</span>
                <p className="text-sm font-semibold text-slate-700">{selectedPatient.admissionDate}</p>
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t border-slate-50">
              <span className="text-[10px] text-slate-400 uppercase font-bold">主要诊断</span>
              <p className="text-sm font-bold text-blue-600">{selectedPatient.diagnosis}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <VitalItem label="T" value="36.5℃" />
              <VitalItem label="P" value="88次/分" />
              <VitalItem label="BP" value="150/90" />
            </div>
          </div>
        </div>

        <div className="medical-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800">多格式输入</h4>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setInputText("患者，男，54岁。因“胸痛2小时”入院。既往高血压病史10年。查体：T 36.5℃, P 88次/分, R 20次/分, BP 150/90mmHg。心音低钝，未闻及杂音。初步诊断：急性心肌梗死。");
                }}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                title="模拟图片识别 (OCR)"
              >
                <ImageIcon size={18} />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="文本导入"><Type size={18} /></button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase">文书类型</label>
            <select 
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400 uppercase">医生口述 / 自由文本</label>
              {isRecording && <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold animate-pulse"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> REC</span>}
            </div>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请描述病情、查体结果、处理意见等..."
              className="w-full h-48 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Mic size={20} />
              <span>{isRecording ? '停止录音' : '语音输入'}</span>
            </button>
            <button 
              onClick={onGenerate}
              disabled={isGenerating || !inputText}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Workflow size={20} />}
              <span>智能生成</span>
            </button>
          </div>

          <button 
            onClick={onGenerateImage}
            disabled={isGeneratingImage || !inputText}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
          >
            {isGeneratingImage ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
            <span>生成医疗示意图</span>
          </button>
        </div>
      </div>

      {/* Middle: Editor */}
      <div className="lg:col-span-2 flex flex-col space-y-6 overflow-hidden">
        <div className="medical-card flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-700">{docType}</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">AI 已优化</span>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded transition-all"><History size={18} /></button>
              <button className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all">
                <Save size={16} />
                <span>暂存</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm">
                <CheckCircle2 size={16} />
                <span>签名归档</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {!generatedDoc ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                <div className="w-16 h-16 border-4 border-slate-100 border-dashed rounded-full flex items-center justify-center">
                  <Plus size={32} />
                </div>
                <p className="text-sm">生成的结构化文书将在此显示</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-8">
                <h1 className="text-2xl font-bold text-center text-slate-900 border-b-2 border-slate-900 pb-4 mb-8">{generatedDoc.title}</h1>
                
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm mb-12">
                  <p><span className="font-bold">姓名:</span> {selectedPatient.name}</p>
                  <p><span className="font-bold">性别:</span> {selectedPatient.gender}</p>
                  <p><span className="font-bold">年龄:</span> {selectedPatient.age}</p>
                  <p><span className="font-bold">床号:</span> {selectedPatient.bedNo}</p>
                  <p><span className="font-bold">科室:</span> {selectedPatient.department}</p>
                  <p><span className="font-bold">入院日期:</span> {selectedPatient.admissionDate}</p>
                </div>

                {generatedImage && (
                  <div className="mb-12 relative group">
                    <img 
                      src={generatedImage} 
                      alt="医疗示意图" 
                      className="w-full aspect-square rounded-2xl border-2 border-slate-100 shadow-xl"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => setGeneratedImage(null)}
                      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-600 hover:text-red-500 transition-all shadow-md opacity-0 group-hover:opacity-100"
                    >
                      <X size={20} />
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4 italic">AI 生成的医疗示意图，仅供参考</p>
                  </div>
                )}

                {generatedDoc.sections?.map((section: any, idx: number) => (
                  <div key={idx} className="space-y-2 group relative">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                      {section.title}
                    </h3>
                    <div className="text-slate-700 leading-relaxed text-sm p-2 rounded hover:bg-blue-50/30 transition-colors">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: AI Assistant & QC */}
      <div className="lg:col-span-1 space-y-6 overflow-y-auto pl-2">
        <div className="medical-card p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              实时质控
            </h4>
            {isChecking && <Loader2 size={16} className="animate-spin text-blue-600" />}
          </div>

          <div className="space-y-4">
            {qcResults.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs">暂未发现明显逻辑错误或缺项，文书质量良好。</p>
              </div>
            ) : (
              qcResults.map((result, idx) => (
                <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                  result.severity === 'P0' ? 'bg-red-50 border-red-500 text-red-800' :
                  result.severity === 'P1' ? 'bg-amber-50 border-amber-500 text-amber-800' :
                  'bg-blue-50 border-blue-500 text-blue-800'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{result.dimension}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/50">{result.severity}</span>
                  </div>
                  <p className="text-xs font-bold mb-1">{result.issue}</p>
                  <p className="text-[10px] opacity-80 italic">建议: {result.suggestion}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="medical-card p-5 space-y-4">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" />
            知识库联想
          </h4>
          <div className="space-y-3">
            <KBItem title="急性心肌梗死临床路径 (2023版)" type="path" />
            <KBItem title="阿司匹林肠溶片 用药指南" type="drug" />
            <KBItem title="PCI 术后护理规范" type="guide" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KnowledgeView() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800">临床知识库</h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">导入指南</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">管理知识库</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KBSection title="权威指南" count={120} icon={<BookOpen className="text-blue-600" />} />
        <KBSection title="标准规范" count={45} icon={<ShieldCheck className="text-emerald-600" />} />
        <KBSection title="术语体系" count={12} icon={<Type className="text-violet-600" />} />
      </div>

      <div className="medical-card p-6">
        <h4 className="font-bold text-slate-800 mb-6">最新更新</h4>
        <div className="divide-y divide-slate-100">
          {[1,2,3,4].map(i => (
            <div key={i} className="py-4 flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">心力衰竭诊断与治疗指南 2024 更新版</p>
                  <p className="text-xs text-slate-500">发布者: 中华医学会 | 更新时间: 2024-03-10</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function QCView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="medical-card p-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-[spin_3s_linear_infinite] flex items-center justify-center">
            <span className="text-lg font-bold">92%</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500">全院文书合格率</h4>
            <p className="text-2xl font-bold text-slate-800">优秀</p>
          </div>
        </div>
        <StatCard title="待审核缺陷" value="42" subValue="需人工复核" color="amber" />
        <StatCard title="严重逻辑错误" value="0" subValue="今日无 P0 风险" color="emerald" />
      </div>

      <div className="medical-card p-6">
        <div className="flex items-center justify-between mb-8">
          <h4 className="font-bold text-slate-800">质控任务队列</h4>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">全部</button>
            <button className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-md">P0 严重</button>
            <button className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">P1 合规</button>
          </div>
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <AlertCircle size={24} className={i === 1 ? 'text-red-500' : 'text-amber-500'} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">文书逻辑冲突: 诊断与用药不匹配</p>
                  <p className="text-xs text-slate-500">患者: 张三 | 医生: 王医生 | 科室: 心血管内科</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-100 transition-colors">
                立即处理
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function AdminView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="系统在线用户" value="156" subValue="当前活跃" color="blue" />
        <StatCard title="API 调用量" value="12.4k" subValue="今日累计" color="violet" />
        <StatCard title="存储空间" value="85%" subValue="已用 1.2TB" color="amber" />
        <StatCard title="系统健康度" value="99.9%" subValue="运行正常" color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="medical-card p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              用户与权限管理
            </h3>
            <div className="space-y-4">
              <AdminUserItem name="王医生" role="主治医生" dept="心血管内科" status="在线" />
              <AdminUserItem name="李护士" role="护士长" dept="心血管内科" status="在线" />
              <AdminUserItem name="张主任" role="质控主任" dept="医务部" status="离线" />
              <AdminUserItem name="系统管理员" role="超级管理员" dept="信息科" status="在线" />
            </div>
            <button className="w-full mt-6 py-2 border border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
              + 添加新用户
            </button>
          </div>

          <div className="medical-card p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600" />
              API 服务状态
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ServiceStatusItem name="Gemini 3.1 Pro" status="正常" latency="1.2s" />
              <ServiceStatusItem name="AIHUBMIX Image" status="正常" latency="3.5s" />
              <ServiceStatusItem name="Vector DB" status="正常" latency="85ms" />
              <ServiceStatusItem name="HIS Interface" status="预警" latency="2.5s" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="medical-card p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <History size={20} className="text-blue-600" />
              系统审计日志
            </h3>
            <div className="space-y-4">
              <LogItem user="王医生" action="签名归档" target="张三 入院记录" time="2分钟前" />
              <LogItem user="系统" action="自动备份" target="全院数据库" time="15分钟前" />
              <LogItem user="张主任" action="质控驳回" target="李四 病程记录" time="1小时前" />
              <LogItem user="李护士" action="登录系统" target="终端 12-A" time="2小时前" />
            </div>
            <button className="w-full mt-6 text-sm text-blue-600 hover:underline">查看完整日志</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AdminUserItem({ name, role, dept, status }: { name: string, role: string, dept: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-[10px] text-slate-500">{role} | {dept}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === '在线' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
        <span className="text-xs text-slate-500">{status}</span>
      </div>
    </div>
  );
}

function ServiceStatusItem({ name, status, latency }: { name: string, status: string, latency: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-slate-700">{name}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status === '正常' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {status}
        </span>
      </div>
      <p className="text-[10px] text-slate-400">响应延迟: {latency}</p>
    </div>
  );
}

function LogItem({ user, action, target, time }: { user: string, action: string, target: string, time: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-700">
        <span className="font-bold">{user}</span> {action} <span className="text-blue-600">{target}</span>
      </p>
      <p className="text-[10px] text-slate-400">{time}</p>
    </div>
  );
}

function VitalItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-slate-50 p-2 rounded-lg text-center">
      <span className="block text-[9px] text-slate-400 font-bold uppercase">{label}</span>
      <span className="text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}

// --- Helper Components ---

function StatCard({ title, value, subValue, color }: { title: string, value: string, subValue: string, color: 'blue' | 'emerald' | 'violet' | 'amber' }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50',
    amber: 'text-amber-600 bg-amber-50'
  };

  return (
    <div className="medical-card p-6 space-y-2">
      <h4 className="text-sm font-medium text-slate-500">{title}</h4>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-medium text-slate-400">{subValue}</p>
    </div>
  );
}

function QCAlertItem({ type, message, time }: { type: 'error' | 'warning' | 'info', message: string, time: string }) {
  const icons = {
    error: <AlertCircle className="text-red-500" size={16} />,
    warning: <AlertCircle className="text-amber-500" size={16} />,
    info: <CheckCircle2 className="text-blue-500" size={16} />
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-xs text-slate-700 leading-tight">{message}</p>
        <p className="text-[10px] text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

function KBItem({ title, type }: { title: string, type: 'path' | 'drug' | 'guide' }) {
  const colors = {
    path: 'bg-blue-100 text-blue-700',
    drug: 'bg-emerald-100 text-emerald-700',
    guide: 'bg-violet-100 text-violet-700'
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group">
      <div className={`w-1.5 h-8 rounded-full ${type === 'path' ? 'bg-blue-400' : type === 'drug' ? 'bg-emerald-400' : 'bg-violet-400'}`}></div>
      <div className="flex-1">
        <p className="text-xs font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{title}</p>
        <span className={`text-[9px] font-bold uppercase px-1 rounded ${colors[type]}`}>{type}</span>
      </div>
      <ChevronRight size={14} className="text-slate-300" />
    </div>
  );
}

function KBSection({ title, count, icon }: { title: string, count: number, icon: React.ReactNode }) {
  return (
    <div className="medical-card p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-slate-800">{title}</h4>
          <p className="text-xs text-slate-500">{count} 份文档</p>
        </div>
      </div>
      <ChevronRight size={20} className="text-slate-300" />
    </div>
  );
}
