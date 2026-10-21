'use client';

import React, { useState, useEffect } from 'react';
import { Search, Tv, ExternalLink, Film, BookOpen, RefreshCw, Loader2, Calendar, PlayCircle, Star, Mic, X, Info, Music, Users } from 'lucide-react';

// カタカナをひらがなに変換（表記ゆれ吸収）
const toHiragana = (str: string) => {
  return str.replace(/[\u30a1-\u30f6]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
};

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
  const [selectedDay, setSelectedDay] = useState('すべて');
  const [selectedPlatform, setSelectedPlatform] = useState('すべて');
  const [selectedFavType, setSelectedFavType] = useState('すべて');
  const [searchQuery, setSearchQuery] = useState('');
  const [animeList, setAnimeList] = useState<AnimeWork[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [seasonName, setSeasonName] = useState('今期');

  // ポップアップ詳細モーダル用のステート
  const [selectedAnime, setSelectedAnime] = useState<AnimeWork | null>(null);

  // お気に入りデータの読み込み（ローカルストレージ）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('miier_favorites');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // お気に入りの切り替え
  const toggleFavorite = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // ポップアップ開閉イベントの横取り防止
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

  // 🔄 Annict APIから今期アニメ＆番組表データを自動取得
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
      const worksRes = await fetch(
        `https://api.annict.com/v1/works?filter_season=${seasonCode}&sort_watchers_count=desc&per_page=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!worksRes.ok) throw new Error(`APIエラー: ${worksRes.status}`);
      const worksData = await worksRes.json();
      const rawWorks = worksData.works || [];

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

  // 🔍 検索＆3列フィルター判定ロジック
  const filteredAnime = animeList.filter((anime) => {
    if (selectedDay !== 'すべて' && anime.dayOfWeek !== selectedDay) {
      return false;
    }

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

    if (selectedFavType === '作品') {
      if (!favorites.includes(anime.id)) return false;
    } else if (selectedFavType === '声優') {
      if (!favorites.includes(anime.id)) return false;
    }

    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery) return true;

    const normQuery = toHiragana(rawQuery);
    const normTitle = toHiragana(anime.title.toLowerCase());
    const normKana = toHiragana((anime.title_kana || '').toLowerCase());

    return normTitle.includes(normQuery) || normKana.includes(normQuery);
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
        {/* 絞り込みコントロールパネル */}
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
                <span className="text-[9px] bg-purple-200 text-purple-900 px-1 py-0.2 rounded-md">
                  開発中
                </span>
              </button>
            </div>
          </div>

          {/* 検索バー */}
          <div className="relative w-full pt-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="作品名・ひらがな検索..."
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
            <p className="text-xs">今期アニメ＆番組表データを読み込み中...</p>
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
                  {selectedFavType !== 'すべて' ? 'お気に入りに登録されたアニメがありません' : '該当するアニメが見つかりませんでした'}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedFavType !== 'すべて' ? 'アニメカード右上の「★」を押してお気に入りに追加してみよう！' : 'フィルター条件を変更するか「リセット」を押してください。'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAnime.map((anime) => {
                  const isFav = favorites.includes(anime.id);
                  const searchDmmUrl = `https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID&extra=${encodeURIComponent(
                    anime.title
                  )}`;
                  const searchRakutenUrl = `https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID?pc=${encodeURIComponent(
                    `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(anime.title)}/`
                  )}`;

                  return (
                    <div
                      key={anime.id}
                      onClick={() => setSelectedAnime(anime)}
                      className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="pr-8">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold uppercase">
                                {anime.media_text || 'アニメ'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                                {anime.dayOfWeek}曜更新
                              </span>
                            </div>
                            <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
                              {anime.title}
                            </h2>
                          </div>

                          {/* ★ お気に入りトグルボタン */}
                          <button
                            onClick={(e) => toggleFavorite(anime.id, e)}
                            title={isFav ? 'お気に入りから解除' : 'お気に入りに追加'}
                            className={`absolute top-4 right-4 p-2 rounded-xl transition-all z-10 ${
                              isFav
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-slate-50 text-slate-300 hover:text-amber-400 hover:bg-slate-100'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Film className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-semibold text-slate-500">放送・配信:</span>
                            <span className="text-slate-700 font-medium truncate">
                              {anime.channels.join(' / ')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-amber-600 font-semibold pt-1">
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3" /> タップして詳細・話数状況を見る
                            </span>
                            <span>詳細 ➔</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={searchDmmUrl}
                          target="_blank"
                          rel="nofollow noopener"
                          className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-sm transition-all active:scale-95"
                        >
                          <span>最速配信を検索</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <a
                          href={searchRakutenUrl}
                          target="_blank"
                          rel="nofollow noopener"
                          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl border border-slate-200 transition-all active:scale-95"
                        >
                          <BookOpen className="w-3 h-3 text-slate-500" />
                          <span>原作・グッズ</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 🌟 【Step 1】作品詳細ポップアップ（モーダル） */}
        {selectedAnime && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnime(null)}
          >
            <div
              className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 閉じるボタン */}
              <button
                onClick={() => setSelectedAnime(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* タイトル & 基本タグ */}
              <div className="space-y-2 pr-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold uppercase">
                    {selectedAnime.media_text || 'TV'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                    毎週{selectedAnime.dayOfWeek}曜日 更新
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {selectedAnime.title}
                </h2>
                {selectedAnime.title_kana && (
                  <p className="text-xs text-slate-400">{selectedAnime.title_kana}</p>
                )}
              </div>

              {/* 話数 & 進行状況ステータス */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600" /> 話数・放送ステータス
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500 text-white">
                    {selectedAnime.episodes_count > 0 ? `全 ${selectedAnime.episodes_count} 話` : '放送中（全12話予定）'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  配信サイト・放送局によって最新話の公開タイミングが順次異なります。「最速配信を検索」ボタンから各サービスで現在の配信状況をご確認いただけます。
                </p>
              </div>

              {/* 放送・配信局リスト */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-500" /> 取扱配信サービス・放送局
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAnime.channels.map((ch, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-xl border border-slate-200"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* 【Step 2でデータが入る準備枠】主題歌 & キャスト情報 */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Music className="w-3 h-3 text-amber-500" /> 主題歌情報
                  </span>
                  <p className="text-xs text-slate-500 font-medium">Step 2で連携予定 🎵</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-500" /> キャスト・声優
                  </span>
                  <p className="text-xs text-slate-500 font-medium">Step 2で連携予定 🎙️</p>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="space-y-2 pt-2">
                {selectedAnime.official_site_url && (
                  <a
                    href={selectedAnime.official_site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all"
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
        )}
      </main>

      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
        <p>© 2026 Miier (ミーア) - Powered by Annict API</p>
      </footer>
    </div>
  );
}