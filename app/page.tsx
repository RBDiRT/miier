'use client';

import React, { useState, useEffect } from 'react';
import { Search, Tv, ExternalLink, Film, BookOpen, RefreshCw, Loader2 } from 'lucide-react';

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
}

const DAYS = ['すべて', 'TV・WEB', '映画・OVA'];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [searchQuery, setSearchQuery] = useState('');
  const [animeList, setAnimeList] = useState<AnimeWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [seasonName, setSeasonName] = useState('今期');

  // 🔄 Annict APIから今期アニメを全件自動取得する関数
  const fetchAnnictAnime = async () => {
    setLoading(true);
    setErrorMsg('');

    // 💡 ビルド時のエラーを防ぐため、実行時（ブラウザ側）で日付とシーズンを計算
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
      setErrorMsg('アクセストークンが設定されていません。Vercelの環境変数（Environment Variables）を確認してください。');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.annict.com/v1/works?filter_season=${seasonCode}&sort_watchers_count=desc&per_page=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }

      const data = await response.json();
      setAnimeList(data.works || []);
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

  // 🔍 検索ロジック
  const filteredAnime = animeList.filter((anime) => {
    const rawQuery = searchQuery.trim().toLowerCase();

    if (selectedCategory !== 'すべて') {
      if (selectedCategory === 'TV・WEB' && !['TV', 'WEB'].includes(anime.media_text)) return false;
      if (selectedCategory === '映画・OVA' && !['MOVIE', 'OVA'].includes(anime.media_text)) return false;
    }

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
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* 検索・フィルター */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {DAYS.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
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
            <p className="text-xs">Annict APIから今期アニメ全件を自動読み込み中...</p>
          </div>
        ) : (
          <div>
            <div className="mb-3 text-xs text-slate-500 font-medium">
              今期アニメ {filteredAnime.length} 件取得完了
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
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold uppercase">
                            {anime.media_text || 'アニメ'}
                          </span>
                          <h2 className="text-base font-bold text-slate-900 leading-snug mt-1">
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
                          <span className="font-semibold text-slate-500">配信・検索:</span>
                          <span className="text-slate-700">DMM TV / Amazon / U-NEXT ほか</span>
                        </div>
                        {anime.official_site_url && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Tv className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="font-semibold text-slate-500">公式サイト:</span>
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