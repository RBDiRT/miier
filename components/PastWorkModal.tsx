'use client';

import React from 'react';
import { Sparkles, X, Search, Loader2, ArrowLeft, Star } from 'lucide-react';
import { AnimeWork, CastInfo } from '../types/anime';

interface PastWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  searchResults: AnimeWork[];
  selectedWork: AnimeWork | null;
  setSelectedWork: (work: AnimeWork | null) => void;
  onSelectWork: (work: AnimeWork) => void;
  workCasts: CastInfo[];
  loadingCasts: boolean;
  favCasts: string[];
  onToggleFavCast: (castName: string) => void;
  onRegisterAllCasts: () => void;
}

export const PastWorkModal: React.FC<PastWorkModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  onSearch,
  isSearching,
  searchResults,
  selectedWork,
  setSelectedWork,
  onSelectWork,
  workCasts,
  loadingCasts,
  favCasts,
  onToggleFavCast,
  onRegisterAllCasts,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-extrabold text-slate-900">過去作・ゲームから声優を一括登録</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 space-y-2 bg-white">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                /* 🌟 プレースホルダー例をワンピース・Fate・リコリス・鬼滅に変更！ */
                placeholder="作品名（例: ワンピース, Fate, リコリス, 鬼滅...）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
              />
            </div>
            <button
              onClick={onSearch}
              disabled={isSearching}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '検索'}
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {searchResults.length > 0 && !selectedWork && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500">該当作品を選択してください（最大10件）</p>
              <div className="space-y-1.5">
                {searchResults.map((work) => (
                  <button
                    key={work.id}
                    onClick={() => onSelectWork(work)}
                    className="w-full text-left p-3 rounded-2xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700">{work.title}</p>
                      <p className="text-[10px] text-slate-400">{work.media_text} • {work.season_name_text || '過去作'}</p>
                    </div>
                    <span className="text-xs text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      選択 ➔
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedWork && (
            <div className="space-y-3 bg-purple-50/60 p-4 rounded-2xl border border-purple-200">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-3 gap-2">
                <div>
                  {/* 🌟 戻るボタンのUIをくっきり視認性抜群なデザインに改善！ */}
                  <button
                    onClick={() => setSelectedWork(null)}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 font-bold text-[11px] rounded-lg border border-purple-200 shadow-2xs flex items-center gap-1 mb-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>検索結果一覧に戻る</span>
                  </button>
                  <h3 className="text-xs font-extrabold text-purple-950">{selectedWork.title}</h3>
                </div>

                {workCasts.length > 0 && (
                  <button
                    onClick={onRegisterAllCasts}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 active:scale-95 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>キャストを全員推し登録！</span>
                  </button>
                )}
              </div>

              {loadingCasts ? (
                <div className="flex items-center justify-center py-6 text-xs text-purple-600 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>キャスト情報を取得中...</span>
                </div>
              ) : workCasts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
                  {workCasts.map((c, idx) => {
                    const isFavCast = favCasts.includes(c.cast_name);
                    return (
                      <button
                        key={idx}
                        onClick={() => onToggleFavCast(c.cast_name)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1 font-medium ${
                          isFavCast
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${isFavCast ? 'fill-white text-white' : 'text-purple-400'}`} />
                        <span className={isFavCast ? 'text-purple-100' : 'text-slate-400'}>{c.character_name}:</span>
                        <strong className={isFavCast ? 'text-white' : 'text-purple-700'}>{c.cast_name}</strong>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2 text-center">キャストデータが見つかりませんでした。</p>
              )}
            </div>
          )}

          {searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8 text-slate-400 space-y-1">
              <p className="text-xs font-bold text-slate-500">作品名を入力して検索してください</p>
              <p className="text-[10px]">『ワンピース』『リコリス・リコイル』『鬼滅の刃』など過去の名作アニメが登録できます。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};