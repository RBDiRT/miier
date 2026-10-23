'use client';

import React from 'react';
import { X, Star, User, Trash2, Heart } from 'lucide-react';
import { AnimeWork } from '../types/anime';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: number[];
  animeList: AnimeWork[];
  favCasts: string[];
  onRemoveFavorite: (id: number) => void;
  onRemoveFavCast: (castName: string) => void;
  onClearAllFavCasts: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  animeList,
  favCasts,
  onRemoveFavorite,
  onRemoveFavCast,
  onClearAllFavCasts,
}) => {
  if (!isOpen) return null;

  // お気に入り登録中のアニメ作品を抽出
  const favAnimeList = animeList.filter((a) => favorites.includes(a.id));

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 relative max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-white text-white" />
            <h2 className="font-extrabold text-base">推し・お気に入り管理</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* 🌟 1. 推し声優一覧 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-purple-600" />
                <span>推し声優（{favCasts.length}名）</span>
              </h3>
              {favCasts.length > 0 && (
                <button
                  onClick={onClearAllFavCasts}
                  className="text-[10px] text-red-500 hover:text-red-700 font-bold underline"
                >
                  全解除
                </button>
              )}
            </div>

            {favCasts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {favCasts.map((cast) => (
                  <span
                    key={cast}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl shadow-2xs group"
                  >
                    <span>{cast}</span>
                    <button
                      onClick={() => onRemoveFavCast(cast)}
                      title="推しから解除"
                      className="text-purple-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-2xl text-center">
                登録中の推し声優はいません。アニメ詳細や過去作検索から追加できます！
              </p>
            )}
          </div>

          {/* 🌟 2. お気に入りアニメ作品一覧 */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>お気に入りアニメ（{favorites.length}作品）</span>
            </h3>

            {favAnimeList.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {favAnimeList.map((anime) => (
                  <div
                    key={anime.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {anime.image_url ? (
                        <img
                          src={anime.image_url}
                          alt={anime.title}
                          className="w-10 h-10 object-cover rounded-xl flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {anime.title.slice(0, 1)}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate">{anime.title}</p>
                        <p className="text-[10px] text-slate-400">毎週{anime.dayOfWeek}曜日</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveFavorite(anime.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                      title="お気に入りから解除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-2xl text-center">
                お気に入り登録された作品はありません。カードの★ボタンから追加できます！
              </p>
            )}
          </div>
        </div>

        {/* 閉じるボタン */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            とじる
          </button>
        </div>
      </div>
    </div>
  );
};