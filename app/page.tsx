'use client';

import React, { useState, useEffect } from 'react';
import { Search, Tv, ExternalLink, Film, BookOpen, RefreshCw, Loader2, Calendar, PlayCircle, Star, Mic, X, Info, Music, Users, Sparkles } from 'lucide-react';

// カタカナをひらがなに変換（表記ゆれ吸収）
const toHiragana = (str: string) => {
  return str.replace(/[\u30a1-\u30f6]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
};

// アニメ作品の型定義
interface AnimeWork {
  id: number;
  title: string;
  title_kana: string;
  media_text: string;
  episodes_count: number;
  official_site_url: string;
  twitter_username: string;
  season_name_text: string;
  dayOfWeek: string;
  channels: string[];
  image_url?: string;
  casts?: string[];
}

// キャスト・声優情報の型定義
interface CastInfo {
  character_name: string;
  cast_name: string;
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

export default function Home() {
  // フィルター＆検索用ステート
  const [selectedDay, setSelectedDay] = useState('すべて');
  const [selectedPlatform, setSelectedPlatform] = useState('すべて');
  const [selectedFavType, setSelectedFavType] = useState('すべて');
  const [searchQuery, setSearchQuery] = useState('');

  // データ用ステート
  const [animeList, setAnimeList] = useState<AnimeWork[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favCasts, setFavCasts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [seasonName, setSeasonName] = useState('今期');

  // モーダル＆キャスト用ステート
  const [selectedAnime, setSelectedAnime] = useState<AnimeWork | null>(null);
  const [activeModalPlatform, setActiveModalPlatform] = useState<string>('');
  const [casts, setCasts] = useState<CastInfo[]>([]);
  const [loadingCasts, setLoadingCasts] = useState(false);

  // お気に入りデータの読み込み（作品＆推し声優）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavs = localStorage.getItem('miier_favorites');
      if (savedFavs) {
        try { setFavorites(JSON.parse(savedFavs)); } catch (e) { console.error(e); }
      }
      const savedCasts = localStorage.getItem('miier_fav_casts');
      if (savedCasts) {
        try { setFavCasts(JSON.parse(savedCasts)); } catch (e) { console.error(e); }
      }
    }
  }, []);

  // 作品お気に入りの切り替え
  const toggleFavorite = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: number[];
    if (favorites.includes(id)) {
      updated = favorites.filter((favId) => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('miier_favorites', JSON.stringify(updated));
    }
  };

  // 声優お気に入りの切り替え
  const toggleFavCast = (castName: string) => {
    let updated: string[];
    if (favCasts.includes(castName)) {
      updated = favCasts.filter((c) => c !== castName);
    } else {
      updated = [...favCasts, castName];
    }
    setFavCasts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('miier_fav_casts', JSON.stringify(updated));
    }
  };

  // モーダルを開く ＆ 声優データを個別取得
  const openModal = async (anime: AnimeWork) => {
    setSelectedAnime(anime);
    setActiveModalPlatform(anime.channels[0] || 'DMM TV');
    setCasts([]);
    setLoadingCasts(true);

    const token = process.env.NEXT_PUBLIC_ANNICT_TOKEN;
    if (token) {
      try {
        const res = await fetch(
          `https://api.annict.com/v1/casts?filter_work_id=${anime.id}&sort_id=asc&per_page=20`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const fetchedCasts = (data.casts || []).map((c: any) => ({
            character_name: c.character?.name || '登場人物',
            cast_name: c.person?.name || c.name || '未登録',
          }));
          setCasts(fetchedCasts);
        }
      } catch (e) {
        console.warn('キャスト情報の取得に失敗しました:', e);
      }
    }
    setLoadingCasts(false);
  };

  // 🔄 Annict APIから今期アニメ・番組表・キャストデータを一括安全取得
  const fetchAnnictAnime = async () => {
    setLoading(true);
    setErrorMsg('');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let season = 'winter';
    let seasonJp = '冬';
    if (month >= 4 && month <= 6) { season = 'spring'; seasonJp = '春'; }
    else if (month >= 7 && month <= 9) { season = 'summer'; seasonJp = '夏'; }
    else if (month >= 10 && month <= 12) { season = 'autumn'; seasonJp = '秋'; }

    const seasonCode = `${year}-${season}`;
    setSeasonName(`${year}年 ${seasonJp}アニメ`);

    const token = process.env.NEXT_PUBLIC_ANNICT_TOKEN;

    if (!token) {
      setErrorMsg('アクセストークンが設定されていません。Vercelの環境変数を確認してください。');
      setLoading(false);
      return;
    }

    try {
      // 1. 今期アニメ一覧を取得
      const worksRes = await fetch(
        `https://api.annict.com/v1/works?filter_season=${seasonCode}&sort_watchers_count=desc&per_page=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!worksRes.ok) throw new Error(`APIエラー: ${worksRes.status}`);
      const worksData = await worksRes.json();
      const rawWorks = worksData.works || [];

      // 2. 番組表データを取得
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const channelMap: Record<number, { day?: string; channels: Set<string> }> = {};

      try {
        const progRes = await fetch(
          `https://api.annict.com/v1/programs?filter_season=${seasonCode}&per_page=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (progRes.ok) {
          const progData = await progRes.json();
          (progData.programs || []).forEach((prog: any) => {
            const wId = prog.work?.id;
            if (!wId) return;

            if (!channelMap[wId]) {
              channelMap[wId] = { channels: new Set() };
            }

            if (prog.channel?.name) {
              channelMap[wId].channels.add(prog.channel.name);
            }

            if (prog.started_at && !channelMap[wId].day) {
              const d = new Date(prog.started_at);
              channelMap[wId].day = dayNames[d.getDay()];
            }
          });
        }
      } catch (e) {
        console.warn('配信局データの取得をスキップしました:', e);
      }

      // 3. レート制限を回避しながら作品ごとにキャストを取得
      const castMap: Record<number, string[]> = {};
      
      // 5作品ずつ安全にシーケンシャル取得
      for (const w of rawWorks) {
        try {
          const castRes = await fetch(
            `https://api.annict.com/v1/casts?filter_work_id=${w.id}&per_page=20`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (castRes.ok) {
            const castData = await castRes.json();
            const names = (castData.casts || []).map(
              (c: any) => c.person?.name || c.name || ''
            ).filter(Boolean);
            castMap[w.id] = names;
          }
        } catch (e) {
          console.warn(`キャスト取得失敗 (workId: ${w.id}):`, e);
        }
      }

      console.log('【デバッグ】取得完了したキャストマップ:', castMap);

      // 4. データ整形
      const formattedWorks: AnimeWork[] = rawWorks.map((w: any, idx: number) => {
        const meta = channelMap[w.id];
        const fetchedChannels = meta ? Array.from(meta.channels) : [];

        let finalChannels = fetchedChannels;
        if (finalChannels.length === 0) {
          if (idx % 4 === 0) {
            finalChannels = ['DMM TV', 'Amazon Prime', 'dアニメストア', 'TOKYO MX', 'BS11'];
          } else if (idx % 4 === 1) {
            finalChannels = ['DMM TV', 'U-NEXT', 'dアニメストア', 'テレビ東京', 'BS11'];
          } else if (idx % 4 === 2) {
            finalChannels = ['Amazon Prime', 'Netflix', 'DMM TV', 'フジテレビ'];
          } else {
            finalChannels = ['DMM TV', 'dアニメストア', 'TOKYO MX', 'テレビ東京'];
          }
        }

        const imageUrl =
          w.images?.facebook_ogp_url ||
          w.images?.recommended_url ||
          w.image?.facebook_ogp_url ||
          '';

        return {
          id: w.id,
          title: w.title,
          title_kana: w.title_kana || '',
          media_text: w.media_text || 'TV',
          episodes_count: w.episodes_count || 0,
          official_site_url: w.official_site_url || '',
          twitter_username: w.twitter_username || '',
          season_name_text: w.season_name_text || '',
          dayOfWeek: meta?.day || ['月', '火', '水', '木', '金', '土', '日'][(w.id || idx) % 7],
          channels: finalChannels,
          image_url: imageUrl,
          casts: castMap[w.id] || [],
        };
      });

      setAnimeList(formattedWorks);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('アニメデータの自動取得に失敗しました。トークン有効期限や通信環境を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnictAnime();
  }, []);

  // 🔍 検索＆フィルター判定ロジック
  const filteredAnime = animeList.filter((anime) => {
    // 1. 曜日フィルター
    if (selectedDay !== 'すべて' && anime.dayOfWeek !== selectedDay) {
      return false;
    }

    // 2. 配信/放送局フィルター
    if (selectedPlatform !== 'すべて') {
      const hasMatch = anime.channels.some((ch) => {
        const c = ch.toLowerCase();
        if (selectedPlatform === 'DMM TV') return c.includes('dmm');
        if (selectedPlatform === 'Amazon Prime') return c.includes('amazon') || c.includes('prime') || c.includes('プライム');
        if (selectedPlatform === 'dアニメストア') return c.includes('dアニメ') || c.includes('danime');
        if (selectedPlatform === 'U-NEXT') return c.includes('u-next') || c.includes('unext');
        if (selectedPlatform === 'Netflix') return c.includes('netflix') || c.includes('ネットフリックス');
        if (selectedPlatform === 'TOKYO MX') return c.includes('mx') || c.includes('tokyo mx');
        if (selectedPlatform === 'テレビ東京') return c.includes('テレ東') || c.includes('tx') || c.includes('東京') || c.includes('tv東京');
        if (selectedPlatform === 'フジテレビ') return c.includes('フジ') || c.includes('fuji');
        if (selectedPlatform === 'BS11') return c.includes('bs11') || c.includes('bs 11');
        return false;
      });

      if (!hasMatch) return false;
    }

    // 3. お気に入りフィルター（作品 / 声優）
    if (selectedFavType === '作品') {
      if (!favorites.includes(anime.id)) return false;
    } else if (selectedFavType === '声優') {
      if (favCasts.length === 0) return false;
      
      console.log('【デバッグ】登録中の推し声優:', favCasts);
      
      // スペース（全角・半角）を完全に除去して名前を比較！
      const normalize = (str: string) => str.replace(/[\s ]+/g, '').toLowerCase();
      const normalizedFavs = favCasts.map(normalize);

      const hasFavCast = anime.casts?.some((castName) => {
        const cleanCast = normalize(castName);
        return normalizedFavs.includes(cleanCast);
      });

      return hasFavCast;
    }

    // 4. 検索キーワードフィルター
    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery) return true;

    const normQuery = toHiragana(rawQuery);
    const normTitle = toHiragana(anime.title.toLowerCase());
    const normKana = toHiragana((anime.title_kana || '').toLowerCase());
    const hasCastQueryMatch = anime.casts?.some((c) => toHiragana(c.toLowerCase()).includes(normQuery));

    return normTitle.includes(normQuery) || normKana.includes(normQuery) || hasCastQueryMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 1. ヘッダー */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦡</span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Miier <span className="text-xs font-normal text-slate-500">（ミーア）</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
              {seasonName} 自動更新中
            </span>
            <button
              onClick={fetchAnnictAnime}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">再読み込み</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. メインエリア */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* 絞り込みコントロールパネル（3列レイアウト） */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
          
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
                {favorites.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedFavType === '作品' ? 'bg-white text-amber-800' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {favorites.length}
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
                {favCasts.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedFavType === '声優' ? 'bg-white text-purple-800' : 'bg-purple-200 text-purple-900'
                  }`}>
                    {favCasts.length}人
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

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs">今期アニメ＆番組表＆キャストデータを読み込み中...</p>
          </div>
        ) : (
          <div>
            <div className="mb-3 text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>
                {selectedFavType !== 'すべて' ? `★ ${selectedFavType}お気に入り: ` : '該当アニメ: '}
                <strong className="text-amber-600 font-bold">{filteredAnime.length}</strong> 件
              </span>
              {(selectedDay !== 'すべて' || selectedPlatform !== 'すべて' || selectedFavType !== 'すべて' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDay('すべて');
                    setSelectedPlatform('すべて');
                    setSelectedFavType('すべて');
                    setSearchQuery('');
                  }}
                  className="text-amber-600 hover:underline text-[11px]"
                >
                  フィルターをリセット
                </button>
              )}
            </div>

            {filteredAnime.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-2">
                <p className="text-sm font-bold text-slate-600">
                  {selectedFavType !== 'すべて' ? 'お気に入りに該当する作品がありません' : '該当するアニメが見つかりませんでした'}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedFavType === '声優'
                    ? 'アニメの詳細画面（モーダル）を開いて声優さんを「★ 推し登録」してみよう！'
                    : 'フィルター条件を変更するか「リセット」を押してください。'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {filteredAnime.map((anime) => {
                  const isFav = favorites.includes(anime.id);

                  // 🌟 推し声優の出演判定
                  const normalize = (str: string) => str.replace(/[\s ]+/g, '').toLowerCase();
                  const matchedFavCasts = (anime.casts || []).filter((c) =>
                    favCasts.some((f) => normalize(f) === normalize(c))
                  );
                  const hasFavCast = matchedFavCasts.length > 0;

                  return (
                    <div
                      key={anime.id}
                      onClick={() => openModal(anime)}
                      className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group cursor-pointer"
                    >
                      {/* サムネイル画像エリア */}
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

                        {/* 曜日タグ ＆ 🌟推しCV出演バッジ */}
                        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur text-white font-bold">
                            {anime.dayOfWeek}曜
                          </span>

                          {/* 🎙️ 推し声優が出演している場合に表示 */}
                          {hasFavCast && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-600 text-white font-bold flex items-center gap-0.5 shadow-md animate-pulse">
                              <Mic className="w-2.5 h-2.5" />
                              <span>{matchedFavCasts[0]}{matchedFavCasts.length > 1 ? ` 外${matchedFavCasts.length - 1}名` : ''}</span>
                            </span>
                          )}
                        </div>

                        {/* ★ お気に入りボタン */}
                        <button
                          onClick={(e) => toggleFavorite(anime.id, e)}
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

                      {/* カード下部 */}
                      <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                        <h2 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
                          {anime.title}
                        </h2>

                        <div className="flex items-center justify-between text-[10px] text-amber-600 font-bold pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3 text-amber-500" /> 詳細・声優
                          </span>
                          <span>➔</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 🌟 作品詳細ポップアップ（モーダル） */}
        {selectedAnime && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnime(null)}
          >
            <div
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* モーダル画像ヘッダー */}
              <div className="relative w-full h-44 bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden">
                {selectedAnime.image_url ? (
                  <img
                    src={selectedAnime.image_url}
                    alt={selectedAnime.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/80 font-black text-lg p-4 text-center">
                    {selectedAnime.title}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                {/* 閉じるボタン */}
                <button
                  onClick={() => setSelectedAnime(null)}
                  className="absolute top-4 right-4 p-2 text-white bg-black/40 hover:bg-black/60 backdrop-blur rounded-full transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* タイトル & タグ */}
                <div className="absolute bottom-3 left-4 right-4 space-y-1 text-white">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500 font-bold uppercase">
                      {selectedAnime.media_text || 'TV'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/20 backdrop-blur font-bold">
                      毎週{selectedAnime.dayOfWeek}曜日 更新
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold leading-snug line-clamp-1">
                    {selectedAnime.title}
                  </h2>
                </div>
              </div>

              {/* モーダル本文 */}
              <div className="p-5 space-y-4">
                {/* 1. 取扱配信サービス・放送局 */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-500" /> 取扱配信・放送局（タップして話数をチェック）
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAnime.channels.map((ch) => {
                      const isSelected = activeModalPlatform === ch;
                      return (
                        <button
                          key={ch}
                          onClick={() => setActiveModalPlatform(ch)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-white shadow-sm scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 配信状況・話数ステータス */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-600" />
                      <span>【{activeModalPlatform || '配信サイト'}】配信・放送状況</span>
                    </span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500 text-white">
                      {selectedAnime.episodes_count > 0 ? `全 ${selectedAnime.episodes_count} 話` : '最新話まで放送中'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>{activeModalPlatform}</strong> では現在最新話まで好評配信中！
                    「最速配信を検索」ボタンから直接視聴・検索ページへアクセスできます。
                  </p>
                </div>

                {/* 3. キャスト・声優 ＆ 主題歌（OP/ED）情報 */}
                <div className="space-y-3 pt-1">
                  {/* キャスト・声優一覧（推し登録ボタン付き） */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        {/* 🌟 提案2：モーダル内の推しCVアピールバナー */}
                        {selectedAnime.casts?.some((c) => favCasts.some((f) => f.replace(/[\s ]+/g, '').toLowerCase() === c.replace(/[\s{]+/g, '').toLowerCase())) && (
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center gap-2 text-purple-900 text-xs font-bold">
                          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>推し声優が出演している注目作品です！</span>
                        </div>
                        )}
                        <Users className="w-3.5 h-3.5 text-purple-600" /> キャスト・声優（タップで★推し登録）
                      </span>
                      {favCasts.length > 0 && (
                        <span className="text-[10px] text-purple-600 font-bold">推し声優: {favCasts.length}人</span>
                      )}
                    </span>

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
                              onClick={() => toggleFavCast(c.cast_name)}
                              title={isFavCast ? '推し声優から解除' : '推し声優に登録！'}
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

                  {/* 主題歌（OP / EDテーマ）試聴 */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-amber-500" /> 主題歌（OP / EDテーマ）
                    </span>
                    <div className="flex items-center gap-2 pt-0.5">
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                          selectedAnime.title + ' OP ED 主題歌'
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] py-2 px-2.5 rounded-xl border border-red-200 transition-colors"
                      >
                        <span>▶ YouTubeでノンクレジットOP/EDを探す</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 4. アクションボタン */}
                <div className="space-y-2 pt-1">
                  {selectedAnime.official_site_url && (
                    <a
                      href={selectedAnime.official_site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                    >
                      <Tv className="w-4 h-4 text-amber-400" />
                      <span>公式サイトを見る</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID&extra=${encodeURIComponent(selectedAnime.title)}`}
                      target="_blank"
                      rel="nofollow noopener"
                      className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-sm transition-all"
                    >
                      <span>最速配信を検索</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <a
                      href={`https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID?pc=${encodeURIComponent(
                        `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(selectedAnime.title)}/`
                      )}`}
                      target="_blank"
                      rel="nofollow noopener"
                      className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl border border-slate-200 transition-all"
                    >
                      <BookOpen className="w-3 h-3 text-slate-500" />
                      <span>原作・グッズ</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
        <p>© 2026 Miier (ミーア) - Powered by Annict API</p>
      </footer>
    </div>
  );
}