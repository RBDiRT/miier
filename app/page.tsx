'use client';

import React, { useState } from 'react';
import { Search, Tv, ExternalLink, Calendar, Film, Sparkles, BookOpen } from 'lucide-react';

// 💡 カタカナをひらがなに自動変換して「表記ゆれ」を100%吸収する神関数！
const toHiragana = (str: string) => {
  return str.replace(/[\u30a1-\u30f6]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
};

const ANIME_DATA = [
  {
    id: '1',
    title: '薬屋のひとりごと 第3期',
    hiraganaTitle: 'くすりやのひとりごと',
    totalEpisodes: 12,
    currentEpisode: 3,
    finalEpisodeDate: '2026-12-18',
    broadcastSchedule: '毎週金曜 23:00〜 (日本テレビ系)',
    fastestStream: 'ABEMA / U-NEXT 毎週金曜 24:00〜',
    dayOfWeek: '金',
    tags: ['ミステリー', '後宮', 'ドラマ'],
    vodUrl: 'https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID',
    rakutenUrl: 'https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID',
  },
  {
    id: '2',
    title: 'アオのハコ Season2',
    hiraganaTitle: 'あおのはこ',
    totalEpisodes: 12,
    currentEpisode: 3,
    finalEpisodeDate: '2026-12-20',
    broadcastSchedule: '毎週日曜 16:30〜 (TBS系)',
    fastestStream: 'Netflix / Prime Video 毎週日曜 17:00〜',
    dayOfWeek: '日',
    tags: ['青春', '部活', 'ラブコメ'],
    vodUrl: 'https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID',
    rakutenUrl: 'https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID',
  },
  {
    id: '3',
    title: '「氷の城壁」第2期',
    hiraganaTitle: 'こおりのじょうへき',
    totalEpisodes: 12,
    currentEpisode: 3,
    finalEpisodeDate: '2026-12-17',
    broadcastSchedule: '毎週木曜 23:56〜 (TBS系列)',
    fastestStream: 'dアニメストア / DMM TV 毎週木曜 24:30〜',
    dayOfWeek: '木',
    tags: ['学園', '青春', 'ドラマ'],
    vodUrl: 'https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID',
    rakutenUrl: 'https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID',
  },
  {
    id: '4',
    title: '東京リベンジャーズ 三天戦争編',
    hiraganaTitle: 'とうきょうりべんじゃーず さんてんせんそうへん',
    totalEpisodes: 13,
    currentEpisode: 3,
    finalEpisodeDate: '2026-12-25',
    broadcastSchedule: '毎週金曜 25:23〜 (テレビ東京)',
    fastestStream: 'Disney+ / Prime Video 毎週金曜 26:00〜',
    dayOfWeek: '金',
    tags: ['ヤンキー', 'タイムリープ', 'バトル', 'アクション'],
    vodUrl: 'https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID',
    rakutenUrl: 'https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID',
  },
  {
    id: '5',
    title: 'FX戦士くるみちゃん',
    hiraganaTitle: 'えふえっくせんしくるみちゃん',
    totalEpisodes: 12,
    currentEpisode: 3,
    finalEpisodeDate: '2026-12-17',
    broadcastSchedule: '毎週木曜 22:30〜 (AT-X / TOKYO MX)',
    fastestStream: 'ABEMA / dアニメストア 毎週木曜 23:00〜',
    dayOfWeek: '木',
    tags: ['投資', '日常', 'サスペンス'],
    vodUrl: 'https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID',
    rakutenUrl: 'https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID',
  },
  {
    id: '6',
    title: 'PSYREN -サイレン-',
    hiraganaTitle: 'さいれん',
    totalEpisodes: 24,
    currentEpisode: 3,
    finalEpisodeDate: '2027-03-22',
    broadcastSchedule: '毎週月曜 23:00〜 (テレビ東京系列)',
    fastestStream: 'U-NEXT / dアニメストア 毎週月曜 23:30〜',
    dayOfWeek: '月',
    tags: ['異能力', 'SF', 'バトル'],
    vodUrl: 'https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID',
    rakutenUrl: 'https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID',
  },
  {
    id: '7',
    title: 'らんま1/2 第3期',
    hiraganaTitle: 'らんま',
    totalEpisodes: 12,
    currentEpisode: 3,
    finalEpisodeDate: '2026-12-19',
    broadcastSchedule: '毎週土曜 24:55〜 (日本テレビ)',
    fastestStream: 'Netflix 独占配信 毎週土曜 25:30〜',
    dayOfWeek: '土',
    tags: ['ラブコメ', '格闘', 'コメディ'],
    vodUrl: 'https://px.a8.net/svt/ejp?a8mat=YOUR_A8_ID',
    rakutenUrl: 'https://hb.afl.rakuten.co.jp/hgc/YOUR_RAKUTEN_ID',
  },
];

const DAYS = ['すべて', '月', '火', '水', '木', '金', '土', '日'];

export default function Home() {
  const [selectedDay, setSelectedDay] = useState('すべて');
  const [searchQuery, setSearchQuery] = useState('');

  // 🔍 最強の検索フィルタリングロジック
  const filteredAnime = ANIME_DATA.filter((anime) => {
    const rawQuery = searchQuery.trim().toLowerCase();

    // 検索入力が無いときは曜日で絞り込む
    if (!rawQuery) {
      return selectedDay === 'すべて' || anime.dayOfWeek === selectedDay;
    }

    // 入力文字と全テキストを「ひらがな」に統一変換して判定！
    const normQuery = toHiragana(rawQuery);
    const normTitle = toHiragana(anime.title.toLowerCase());
    const normHiragana = toHiragana((anime.hiraganaTitle || '').toLowerCase());
    const normTags = anime.tags.map((tag) => toHiragana(tag.toLowerCase()));

    const matchesTitle = normTitle.includes(normQuery);
    const matchesHiragana = normHiragana.includes(normQuery);
    const matchesTags = normTags.some((tag) => tag.includes(normQuery));

    return matchesTitle || matchesHiragana || matchesTags;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* 1. ヘッダー */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦡</span>
            <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Miier <span className="text-xs font-normal text-slate-400">（ミーア）</span>
            </span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            怠惰型アニメまとめ
          </span>
        </div>
      </header>

      {/* 2. ヒーローセクション */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 px-4 py-10">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 text-amber-300 text-xs px-3 py-1.5 rounded-full border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            オタクよ、もう背伸びするな。ふんぞり返ってアニメを浴びろ。
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight leading-tight">
            全何話？いつ放送？どこで配信？<br />
            <span className="text-amber-400">1画面でぜんぶ解決。</span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 text-left">
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/30 text-xs space-y-1">
              <div className="font-bold text-red-400 flex items-center gap-1">
                <span>😵‍💫 従来のオタク（背伸びモード）</span>
              </div>
              <p className="text-slate-400">
                各テレビ局・配信サイト・公式Xを行き来してスケジュール確認…検索で何タブも開いてヘトヘト。
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <span>🦡 Miierを使うオタク（怠惰モード）</span>
              </div>
              <p className="text-slate-300">
                コタツでふんぞり返ったまま、今夜の放送・配信・最終回予定日を1秒で確認完了！
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* 曜日タブ */}
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto w-full sm:w-auto">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  selectedDay === day && searchQuery === ''
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* 検索バー */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="作品名・ひらがな・タグ(#ラブコメ)検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* アニメカード一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnime.map((anime) => {
            const isNearFinal = anime.totalEpisodes - anime.currentEpisode <= 2;
            return (
              <div
                key={anime.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">{anime.title}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {anime.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      第{anime.currentEpisode}話 / 全{anime.totalEpisodes}話
                    </span>
                    {isNearFinal && (
                      <div className="text-[10px] text-rose-400 font-bold mt-1 animate-pulse">
                        ⚠️ 最終回目前！
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Tv className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-slate-400">地上波:</span>
                    <span>{anime.broadcastSchedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Film className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="font-semibold text-slate-400">最速配信:</span>
                    <span>{anime.fastestStream}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-400">最終話予定:</span>
                    <span className="font-bold text-emerald-300">{anime.finalEpisodeDate} 頃</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={anime.vodUrl}
                    target="_blank"
                    rel="nofollow noopener"
                    className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <span>最速配信で観る</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={anime.rakutenUrl}
                    target="_blank"
                    rel="nofollow noopener"
                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 px-3 rounded-xl border border-slate-700 transition-all active:scale-95"
                  >
                    <BookOpen className="w-3 h-3 text-amber-400" />
                    <span>原作・グッズ</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAnime.length === 0 && (
          <div className="text-center py-12 space-y-2 text-slate-500 text-sm">
            <p>該当するアニメが見つかりませんでした… 🦡</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 mt-16 py-8 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 Miier (ミーア) - ふんぞり返ってアニメを浴びるWebアプリ</p>
      </footer>
    </div>
  );
}