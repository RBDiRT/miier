'use client';

import React from 'react';
import { Calendar, PlayCircle, Star, Tv, Mic, Search, Plus } from 'lucide-react';

interface ControlPanelProps {
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (platform: string) => void;
  selectedFavType: string;
  setSelectedFavType: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  favoritesCount: number;
  favCastsCount: number;
  onOpenSearchModal: () => void;
}

const DAYS = ['すべて', '月', '火', '水', '木', '金', '土', '日'];
const PLATFORMS = [
  'すべて',
  'DMM TV',
  'Amazon Prime',
  'dアニメストア',
  'U-NEXT',
  'Netflix',
  'TOKYO MX',
  'テレビ東京',
  'フジテレビ',
  'BS11',
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedDay,
  setSelectedDay,
  selectedPlatform,
  setSelectedPlatform,
  selectedFavType,
  setSelectedFavType,
  searchQuery,
  setSearchQuery,
  favoritesCount,
  favCastsCount,
  onOpenSearchModal,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
      {/* 🌟 過去作・ゲーム一括登録ボタン（最上部に配置してスマホでも目立つように！） */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="text-xs font-bold text-slate-500">推し声優・作品管理</span>
        <button
          onClick={onOpenSearchModal}
          className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 shadow-2xs active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-purple-600" />
          <span>✨ 過去作・ゲームから声優一括登録</span>
        </button>
      </div>

      {/* 【1列目】 曜日フィルター */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 shrink-0 w-16 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-amber-500" /> 曜日
        </span>
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                selectedDay === day
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {day === 'すべて' ? '全曜日' : `${day}曜`}
            </button>
          ))}
        </div>
      </div>

      {/* 【2列目】 配信・放送局フィルター */}
      <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs font-bold text-slate-400 shrink-0 w-16 flex items-center gap-1">
          <PlayCircle className="w-3.5 h-3.5 text-amber-500" /> 配信/局
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-slate-200">
          {PLATFORMS.map((pf) => (
            <button
              key={pf}
              onClick={() => setSelectedPlatform(pf)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                selectedPlatform === pf
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {pf}
            </button>
          ))}
        </div>
      </div>

      {/* 【3列目】 お気に入りフィルター */}
      <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs font-bold text-slate-400 shrink-0 w-16 flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-500" /> お気に入り
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setSelectedFavType('すべて')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              selectedFavType === 'すべて'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            指定なし
          </button>

          <button
            onClick={() => setSelectedFavType('作品')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
              selectedFavType === '作品'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Tv className="w-3 h-3" />
            <span>★ 作品お気に入り</span>
            {favoritesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedFavType === '作品' ? 'bg-white text-amber-800' : 'bg-amber-200 text-amber-900'
              }`}>
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedFavType('声優')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
              selectedFavType === '声優'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <Mic className="w-3 h-3" />
            <span>🎙️ 声優お気に入り</span>
            {favCastsCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedFavType === '声優' ? 'bg-white text-purple-800' : 'bg-purple-200 text-purple-900'
              }`}>
                {favCastsCount}人
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 検索バー */}
      <div className="relative w-full pt-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="作品名・ひらがな・声優名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
        />
      </div>
    </div>
  );
};