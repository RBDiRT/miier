'use client';

import React from 'react';
import { Film, Users, Sparkles, Music, Tv, ExternalLink, Building, X, Loader2, Star, PlayCircle } from 'lucide-react';
import { AnimeWork, CastInfo } from '../types/anime';

interface DetailModalProps {
  anime: AnimeWork;
  activePlatform: string;
  setActivePlatform: (platform: string) => void;
  casts: CastInfo[];
  loadingCasts: boolean;
  studioName: string;
  favCasts: string[];
  onToggleFavCast: (castName: string) => void;
  onToggleAllCasts: () => void;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  anime,
  casts,
  loadingCasts,
  studioName,
  favCasts,
  onToggleFavCast,
  onToggleAllCasts,
  onClose,
}) => {
  const a8Id = process.env.NEXT_PUBLIC_A8_ID || '';

  const streamingServices = [
    {
      name: 'ABEMA',
      isAffiliate: !!a8Id,
      url: a8Id
        ? `https://px.a8.net/svt/ejp?a8mat=${a8Id}&extra=${encodeURIComponent(anime.title)}`
        : `https://abema.tv/search?q=${encodeURIComponent(anime.title)}`,
      badge: a8Id ? '🎁 無料体験あり' : '公式',
      color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
    {
      name: 'DMM TV',
      isAffiliate: false,
      url: `https://tv.dmm.com/vod/?season=&search=${encodeURIComponent(anime.title)}`,
      badge: 'アニメ充実',
      color: 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-400/30',
    },
    {
      name: 'dアニメストア',
      isAffiliate: false,
      url: `https://animestore.docomo.ne.jp/animestore/sch_pc?searchKey=${encodeURIComponent(anime.title)}`,
      badge: '作品数No.1',
      color: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    {
      name: 'U-NEXT',
      isAffiliate: false,
      url: `https://video.unext.jp/search?query=${encodeURIComponent(anime.title)}`,
      badge: '見放題豊富',
      color: 'bg-sky-600 hover:bg-sky-700 text-white',
    },
    {
      name: 'Amazon Prime Video',
      isAffiliate: false,
      url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(anime.title + ' アニメ')}&i=instant-video`,
      badge: '定番',
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー画像・タイトル */}
        <div className="relative w-full h-44 bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden">
          {anime.image_url ? (
            <img src={anime.image_url} alt={anime.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/80 font-black text-lg p-4 text-center">
              {anime.title}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white bg-black/40 hover:bg-black/60 backdrop-blur rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 space-y-1 text-white">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500 font-bold uppercase">
                {anime.media_text || 'TV'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/20 backdrop-blur font-bold">
                毎週{anime.dayOfWeek}曜日 放送/更新
              </span>

              {studioName && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur text-amber-300 font-bold flex items-center gap-1">
                  <Building className="w-2.5 h-2.5 text-amber-400" />
                  <span>制作: {studioName}</span>
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold leading-snug line-clamp-1">{anime.title}</h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* 🌟 シンプルに1つに集約した放送・配信ステータス */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-amber-600" />
                <span>放送・配信ステータス</span>
              </span>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500 text-white">
                毎週{anime.dayOfWeek}曜日 放送・更新中
              </span>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed space-y-1.5 pt-0.5">
              <p>
                今期最新エピソードを順次放送・配信中！放送局や各配信サイトにてお楽しみいただけます。
              </p>

              {/* 取扱チャンネルタグ */}
              <div className="flex items-center gap-1 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-slate-500">放送局/チャンネル:</span>
                {(anime.channels.length > 0 ? anime.channels : ['TOKYO MX', 'BS11', '主要配信サイト']).map((ch, idx) => (
                  <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-800 shadow-2xs">
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 🌟 配信先を探す・今すぐ視聴する */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-purple-600" />
              <span>配信先を探す・今すぐ視聴する</span>
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {streamingServices.map((service, idx) => (
                <a
                  key={idx}
                  href={service.url}
                  target="_blank"
                  rel="nofollow noopener"
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-2xs hover:shadow-md active:scale-[0.99] ${service.color}`}
                >
                  <span className="flex items-center gap-2">
                    <span>{service.name} で観る</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/20 backdrop-blur font-bold">
                      {service.badge}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] opacity-90">
                    <span>検索・移動</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* 🌟 キャスト・声優一覧 */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" /> キャスト・声優一覧
                </span>

                {!loadingCasts && casts.length > 0 && (
                  <button
                    onClick={onToggleAllCasts}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>
                      {casts.every((c) => favCasts.includes(c.cast_name))
                        ? 'キャストを全員解除'
                        : 'キャストを全員推し登録！'}
                    </span>
                  </button>
                )}
              </div>

              {loadingCasts ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                  <span>キャストデータを取得中...</span>
                </div>
              ) : casts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                  {casts.map((c, idx) => {
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
                <p className="text-xs text-slate-400 py-1">声優情報が未登録です</p>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-500" /> 主題歌（OP / EDテーマ）
              </span>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' OP ED 主題歌')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] py-2 px-2.5 rounded-xl border border-red-200 transition-colors"
              >
                <span>▶ YouTubeでノンクレジットOP/EDを探す</span>
              </a>
            </div>
          </div>

          {/* 公式サイトリンク */}
          {anime.official_site_url && (
            <div className="pt-1">
              <a
                href={anime.official_site_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                <Tv className="w-4 h-4 text-amber-400" />
                <span>アニメ公式サイトを開く</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};