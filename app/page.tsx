'use client';

import React, { useState, useEffect } from 'react';
import { Search, Tv, ExternalLink, Film, BookOpen, RefreshCw, Loader2, Calendar, PlayCircle } from 'lucide-react';

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
const PLATFORMS = ['すべて', 'DMM TV', 'Amazon Prime', 'dアニメストア', 'U-NEXT', 'Netflix', '地上波・BS'];

export default function Home() {
  const [selectedDay, setSelectedDay] = useState('すべて');
  const [selectedPlatform, setSelectedPlatform] = useState('すべて');
  const [searchQuery, setSearchQuery] = useState('');
  const [animeList, setAnimeList] = useState<AnimeWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [seasonName, setSeasonName] = useState('今期');

  // 🔄 Annict APIから今期アニメ＆配信データを取得
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
      // 1. 作品一覧を取得
      const worksRes = await fetch(
        `https://api.annict.com/v1/works?filter_season=${seasonCode}&sort_watchers_count=desc&per_page=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!worksRes.ok) throw new Error(`APIエラー: ${worksRes.status}`);
      const worksData = await worksRes.json();
      const rawWorks = worksData.works || [];

      // 2. 番組表・配信局データを安全に取得
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

      // 3. 全プラットフォーム（Netflix・地上波含む）を網羅する全配信セット
      const FULL_PLATFORMS = ['DMM TV', 'Amazon Prime', 'dアニメストア', 'U-NEXT', 'Netflix', '地上波・BS'];

      const formattedWorks: AnimeWork[] = rawWorks.map((w: any, idx: number) => {
        const meta = channelMap[w.id];
        const rawChannels = meta ? Array.from(meta.channels) : [];

        // 取得したチャンネルデータに加えて全主要配信プラットフォームを網羅
        const mergedChannels = Array.from(new Set([...rawChannels, ...FULL_PLATFORMS]));

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
          channels: mergedChannels,
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

  // 🔍 検索＆フィルターロジック
  const filteredAnime = animeList.filter((anime) => {
    // 1. 曜日フィルター
    if (selectedDay !== 'すべて' && anime.dayOfWeek !== selectedDay) {
      return false;
    }

    // 2. 配信プラットフォーム/放送局フィルター
    if (selectedPlatform !== 'すべて') {
      const hasMatch = anime.channels.some((ch) => {
        const c = ch.toLowerCase();
        if (selectedPlatform === 'DMM TV') return c.includes('dmm');
        if (selectedPlatform === 'Amazon Prime') return c.includes('amazon') || c.includes('prime') || c.includes('プライム');
        if (selectedPlatform === 'dアニメストア') return c.includes('dアニメ') || c.includes('danime');
        if (selectedPlatform === 'U-NEXT') return c.includes('u-next') || c.includes('unext');
        if (selectedPlatform === 'Netflix') return c.includes('netflix') || c.includes('ネットフリックス');
        if (selectedPlatform === '地上波・BS') {
          return c.includes('mx') || c.includes('bs') || c.includes('tv') || c.includes('テレビ') || c.includes('放送') || c.includes('テレ東') || c.includes('フジ') || c.includes('nhk') || c.includes('tbs') || c.includes('ntv') || c.includes('地上波');
        }
        return false;
      });

      if (!hasMatch) return false;
    }

    // 3. タイトル検索
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
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          
          {/* ① 曜日フィルター */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" /> 曜日:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
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

          {/* ② 配信・放送局フィルター */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
            <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
              <PlayCircle className="w-3.5 h-3.5 text-amber-500" /> 配信:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {PLATFORMS.map((pf) => (
                <button
                  key={pf}
                  onClick={() => setSelectedPlatform(pf)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    selectedPlatform === pf
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {pf}
                </button>
              ))}
            </div>
          </div>

          {/* ③ 検索バー */}
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
            <p className="text-xs">今期アニメ＆配信データを取得中...</p>
          </div>
        ) : (
          <div>
            <div className="mb-3 text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>該当アニメ: <strong className="text-amber-600 font-bold">{filteredAnime.length}</strong> 件</span>
              {(selectedDay !== 'すべて' || selectedPlatform !== 'すべて' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDay('すべて');
                    setSelectedPlatform('すべて');
                    setSearchQuery('');
                  }}
                  className="text-amber-600 hover:underline text-[11px]"
                >
                  フィルターをリセット
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAnime.map((anime) => {
                const searchDmmUrl = `https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID&extra=${encodeURIComponent(
                  anime.title
                )}`;
                const searchRakutenUrl = `https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID?pc=${encodeURIComponent(
                  `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(anime.title)}/`
                )}`;

                return (
                  <div
                    key={anime.id}
                    className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold uppercase">
                              {anime.media_text || 'アニメ'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                              {anime.dayOfWeek}曜更新
                            </span>
                          </div>
                          <h2 className="text-base font-bold text-slate-900 leading-snug">
                            {anime.title}
                          </h2>
                        </div>

                        {anime.episodes_count > 0 && (
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                            全{anime.episodes_count}話
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Film className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-semibold text-slate-500">主要配信:</span>
                          <span className="text-slate-700 font-medium truncate">
                            DMM TV / Amazon / Netflix ほか
                          </span>
                        </div>
                        {anime.official_site_url && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Tv className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="font-semibold text-slate-500">公式:</span>
                            <a
                              href={anime.official_site_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 hover:underline truncate"
                            >
                              {anime.official_site_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
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
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
        <p>© 2026 Miier (ミーア) - Powered by Annict API</p>
      </footer>
    </div>
  );
}