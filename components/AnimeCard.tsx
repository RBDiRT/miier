'use client';

import React from 'react';
import { Tv, Star, Sparkles, Mic } from 'lucide-react';
import { AnimeWork } from '../types/anime';

interface AnimeCardProps {
  anime: AnimeWork;
  isFav: boolean;
  favCasts: string[];
  onSelect: (anime: AnimeWork) => void;
  onToggleFavorite: (id: number, e: React.MouseEvent) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  isFav,
  favCasts,
  onSelect,
  onToggleFavorite,
}) => {
  const normalize = (str: string) => str.replace(/[\s ]+/g, '').toLowerCase();
  const matchedFavCasts = (anime.casts || []).filter((c) =>
    favCasts.some((f) => normalize(f) === normalize(c))
  );
  const hasFavCast = matchedFavCasts.length > 0;

  return (
    <div
      onClick={() => onSelect(anime)}
      className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group cursor-pointer"
    >
      <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
        {anime.image_url ? (
          <img
            src={anime.image_url}
            alt={anime.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-amber-700/60 p-2 text-center">
            <Tv className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-[10px] font-bold line-clamp-1">{anime.title}</span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur text-white font-bold">
            {anime.dayOfWeek}曜
          </span>

          {hasFavCast && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-600 text-white font-bold flex items-center gap-0.5 shadow-md animate-pulse">
              <Mic className="w-2.5 h-2.5" />
              <span>{matchedFavCasts[0]}{matchedFavCasts.length > 1 ? ` 外${matchedFavCasts.length - 1}名` : ''}</span>
            </span>
          )}
        </div>

        <button
          onClick={(e) => onToggleFavorite(anime.id, e)}
          title={isFav ? 'お気に入りから解除' : 'お気に入りに追加'}
          className={`absolute top-2 right-2 p-1.5 rounded-xl transition-all z-10 ${
            isFav
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-black/40 backdrop-blur text-white/80 hover:text-white'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
        </button>
      </div>

      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <h2 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
          {anime.title}
        </h2>

        {/* 🌟 復活！取扱チャンネル・局タグの表示 */}
        {anime.channels && anime.channels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {anime.channels.slice(0, 2).map((ch, idx) => (
              <span key={idx} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[90px]">
                {ch}
              </span>
            ))}
            {anime.channels.length > 2 && (
              <span className="text-[9px] font-bold text-slate-400 self-center">
                +{anime.channels.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-amber-600 font-bold pt-1 border-t border-slate-100">
          <span className="flex items-center gap-0.5">
            <Sparkles className="w-3 h-3 text-amber-500" /> 詳細・声優
          </span>
          <span>➔</span>
        </div>
      </div>
    </div>
  );
};