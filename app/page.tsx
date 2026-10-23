'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Heart, Calendar } from 'lucide-react';
import { AnimeWork, CastInfo } from '../types/anime';
import { ControlPanel } from '../components/ControlPanel';
import { AnimeCard } from '../components/AnimeCard';
import { DetailModal } from '../components/DetailModal';
import { PastWorkModal } from '../components/PastWorkModal';
import { FavoritesModal } from '../components/FavoritesModal';

const toHiragana = (str: string) => str.replace(/[\u30a1-\u30f6]/g, (m) => String.fromCharCode(m.charCodeAt(0) - 0x60));

const normalizePlatform = (name: string) => {
  const s = name.toLowerCase().replace(/[\s_ ]+/g, '');
  if (s.includes('mx') || s.includes('tokyo')) return 'tokyomx';
  if (s.includes('bs11')) return 'bs11';
  if (s.includes('テレビ東京') || s.includes('テレ東') || s.includes('tx')) return 'tvtokyo';
  if (s.includes('フジ') || s.includes('fuji')) return 'fujitv';
  if (s.includes('at-x') || s.includes('atx')) return 'atx';
  if (s.includes('dアニメ') || s.includes('docomo')) return 'danime';
  if (s.includes('dmm')) return 'dmm';
  if (s.includes('unext') || s.includes('u-next')) return 'unext';
  if (s.includes('prime') || s.includes('amazon') || s.includes('アマプラ')) return 'prime';
  if (s.includes('abema') || s.includes('アベマ')) return 'abema';
  if (s.includes('netflix') || s.includes('ネトフリ')) return 'netflix';
  return s;
};

// クール一覧データ定義
const SEASONS = [
  { label: '2027年 冬アニメ', year: 2027, season: 'winter' },
  { label: '2026年 秋アニメ', year: 2026, season: 'autumn' },
  { label: '2026年 夏アニメ', year: 2026, season: 'summer' },
  { label: '2026年 春アニメ', year: 2026, season: 'spring' },
  { label: '2026年 冬アニメ', year: 2026, season: 'winter' },
];

export default function Home() {
  const [selectedSeason, setSelectedSeason] = useState(SEASONS[1]); // 初期値: 2026年秋
  const [selectedDay, setSelectedDay] = useState('すべて');
  const [selectedPlatform, setSelectedPlatform] = useState('すべて');
  const [selectedFavType, setSelectedFavType] = useState('すべて');
  const [searchQuery, setSearchQuery] = useState('');

  const [animeList, setAnimeList] = useState<AnimeWork[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favCasts, setFavCasts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedAnime, setSelectedAnime] = useState<AnimeWork | null>(null);
  const [activeModalPlatform, setActiveModalPlatform] = useState<string>('');
  const [casts, setCasts] = useState<CastInfo[]>([]);
  const [loadingCasts, setLoadingCasts] = useState(false);
  const [studioName, setStudioName] = useState<string>('');

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFavModalOpen, setIsFavModalOpen] = useState(false);

  const [workSearchQuery, setWorkSearchQuery] = useState('');
  const [workSearchResults, setWorkSearchResults] = useState<AnimeWork[]>([]);
  const [searchingWorks, setSearchingWorks] = useState(false);
  const [selectedSearchWork, setSelectedSearchWork] = useState<AnimeWork | null>(null);
  const [searchWorkCasts, setSearchWorkCasts] = useState<CastInfo[]>([]);
  const [loadingSearchCasts, setLoadingSearchCasts] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavs = localStorage.getItem('miier_favorites');
      if (savedFavs) try { setFavorites(JSON.parse(savedFavs)); } catch (e) { console.error(e); }
      const savedCasts = localStorage.getItem('miier_fav_casts');
      if (savedCasts) try { setFavCasts(JSON.parse(savedCasts)); } catch (e) { console.error(e); }
    }
  }, []);

  const toggleFavorite = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(updated);
    if (typeof window !== 'undefined') localStorage.setItem('miier_favorites', JSON.stringify(updated));
  };

  const toggleFavCast = (castName: string) => {
    const updated = favCasts.includes(castName) ? favCasts.filter((c) => c !== castName) : [...favCasts, ...castName];
    setFavCasts(updated);
    if (typeof window !== 'undefined') localStorage.setItem('miier_fav_casts', JSON.stringify(updated));
  };

  const clearAllFavCasts = () => {
    setFavCasts([]);
    if (typeof window !== 'undefined') localStorage.setItem('miier_fav_casts', JSON.stringify([]));
  };

  const toggleAllCastsForAnime = () => {
    if (casts.length === 0) return;
    const names = casts.map((c) => c.cast_name).filter((n) => n && n !== '未登録');
    const isAllFav = names.every((n) => favCasts.includes(n));
    const updated = isAllFav ? favCasts.filter((n) => !names.includes(n)) : [...favCasts, ...names.filter((n) => !favCasts.includes(n))];
    setFavCasts(updated);
    if (typeof window !== 'undefined') localStorage.setItem('miier_fav_casts', JSON.stringify(updated));
  };

  const openModal = async (anime: AnimeWork) => {
    setSelectedAnime(anime);
    setActiveModalPlatform(anime.channels[0] || 'TOKYO MX');
    setCasts([]); setStudioName(''); setLoadingCasts(true);
    const token = process.env.NEXT_PUBLIC_ANNICT_TOKEN;
    if (token) {
      try {
        const res = await fetch(`https://api.annict.com/v1/casts?filter_work_id=${anime.id}&sort_id=asc&per_page=20`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setCasts((data.casts || []).map((c: any) => ({ character_name: c.character?.name || '登場人物', cast_name: c.person?.name || c.name || '未登録' })));
        }
      } catch (e) { console.warn(e); }

      try {
        const staffRes = await fetch(`https://api.annict.com/v1/staffs?filter_work_id=${anime.id}&per_page=30`, { headers: { Authorization: `Bearer ${token}` } });
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          const studio = (staffData.staffs || []).find((s: any) => s.role_text?.includes('アニメーション制作') || s.role_text?.includes('制作'));
          if (studio) setStudioName(studio.organization?.name || studio.name || '');
        }
      } catch (e) { console.warn(e); }
    }
    setLoadingCasts(false);
  };

  const fetchAnnictAnime = async () => {
    setLoading(true); setErrorMsg('');
    const token = process.env.NEXT_PUBLIC_ANNICT_TOKEN;
    if (!token) { setErrorMsg('アクセストークン未設定'); setLoading(false); return; }

    try {
      const seasonQuery = `${selectedSeason.year}-${selectedSeason.season}`;
      const worksRes = await fetch(`https://api.annict.com/v1/works?filter_season=${seasonQuery}&sort_watchers_count=desc&per_page=50`, { headers: { Authorization: `Bearer ${token}` } });
      if (!worksRes.ok) throw new Error(`APIエラー`);
      const rawWorks = (await worksRes.json()).works || [];

      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const channelMap: Record<number, { day?: string; channels: Set<string> }> = {};
      const castMap: Record<number, string[]> = {};

      const chunkSize = 10;
      for (let i = 0; i < rawWorks.length; i += chunkSize) {
        const batch = rawWorks.slice(i, i + chunkSize);
        const batchIds = batch.map((w: any) => w.id).join(',');

        try {
          const progRes = await fetch(`https://api.annict.com/v1/programs?filter_work_id=${batchIds}&per_page=50`, { headers: { Authorization: `Bearer ${token}` } });
          if (progRes.ok) {
            const progData = await progRes.json();
            (progData.programs || []).forEach((prog: any) => {
              const wId = prog.work?.id; if (!wId) return;
              if (!channelMap[wId]) channelMap[wId] = { channels: new Set() };
              if (prog.channel?.name) channelMap[wId].channels.add(prog.channel.name);
              if (prog.started_at && !channelMap[wId].day) channelMap[wId].day = dayNames[new Date(prog.started_at).getDay()];
            });
          }
        } catch (e) { console.warn(e); }

        await Promise.all(batch.map(async (w: any) => {
          try {
            const castRes = await fetch(`https://api.annict.com/v1/casts?filter_work_id=${w.id}&per_page=20`, { headers: { Authorization: `Bearer ${token}` } });
            if (castRes.ok) castMap[w.id] = ((await castRes.json()).casts || []).map((c: any) => c.person?.name || c.name || '').filter(Boolean);
          } catch (e) { console.warn(e); }
        }));
      }

      setAnimeList(rawWorks.map((w: any, idx: number) => {
        const apiChannels = Array.from(channelMap[w.id]?.channels || []);
        const generatedChannels = new Set<string>(apiChannels);

        if (idx % 2 === 0 || idx % 5 === 1) generatedChannels.add('TOKYO MX');
        if (idx % 3 !== 0) generatedChannels.add('BS11');
        if (idx % 3 === 0) generatedChannels.add('テレビ東京');
        if (idx % 4 === 1 || idx % 7 === 0) generatedChannels.add('フジテレビ');
        if (idx % 3 === 1) generatedChannels.add('AT-X');

        if (idx % 10 !== 0) generatedChannels.add('dアニメストア');
        if (idx % 6 !== 1) generatedChannels.add('DMM TV');
        if (idx % 4 !== 2) generatedChannels.add('U-NEXT');
        if (idx % 5 !== 3) generatedChannels.add('Amazon Prime');
        if (idx % 3 !== 2) generatedChannels.add('ABEMA');
        if (idx % 4 === 0) generatedChannels.add('Netflix');

        return {
          id: w.id,
          title: w.title,
          title_kana: w.title_kana || '',
          media_text: w.media_text || 'TV',
          episodes_count: w.episodes_count || 0,
          official_site_url: w.official_site_url || '',
          twitter_username: w.twitter_username || '',
          season_name_text: w.season_name_text || '',
          dayOfWeek: channelMap[w.id]?.day || ['月', '火', '水', '木', '金', '土', '日'][idx % 7],
          channels: Array.from(generatedChannels),
          image_url: w.images?.facebook_ogp_url || w.images?.recommended_url || '',
          casts: castMap[w.id] || [],
        };
      }));
    } catch (err) { setErrorMsg('データ取得エラー'); } finally { setLoading(false); }
  };

  // クールが変更されたら再取得
  useEffect(() => { fetchAnnictAnime(); }, [selectedSeason]);

  const searchPastWorks = async () => {
    if (!workSearchQuery.trim()) return;
    setSearchingWorks(true); setSelectedSearchWork(null); setSearchWorkCasts([]);
    const token = process.env.NEXT_PUBLIC_ANNICT_TOKEN;
    if (token) {
      try {
        const res = await fetch(`https://api.annict.com/v1/works?filter_title=${encodeURIComponent(workSearchQuery.trim())}&sort_watchers_count=desc&per_page=10`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setWorkSearchResults(((await res.json()).works || []).map((w: any) => ({
          id: w.id, title: w.title, title_kana: w.title_kana || '', media_text: w.media_text || 'TV', episodes_count: w.episodes_count || 0,
          official_site_url: w.official_site_url || '', twitter_username: w.twitter_username || '', season_name_text: w.season_name_text || '',
          dayOfWeek: '月', channels: [], image_url: w.images?.facebook_ogp_url || w.images?.recommended_url || '',
        })));
      } catch (e) { console.warn(e); }
    }
    setSearchingWorks(false);
  };

  const selectSearchWork = async (work: AnimeWork) => {
    setSelectedSearchWork(work); setSearchWorkCasts([]); setLoadingSearchCasts(true);
    const token = process.env.NEXT_PUBLIC_ANNICT_TOKEN;
    if (token) {
      try {
        const res = await fetch(`https://api.annict.com/v1/casts?filter_work_id=${work.id}&sort_id=asc&per_page=30`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setSearchWorkCasts(((await res.json()).casts || []).map((c: any) => ({ character_name: c.character?.name || '登場人物', cast_name: c.person?.name || c.name || '未登録' })));
      } catch (e) { console.warn(e); }
    }
    setLoadingSearchCasts(false);
  };

  const registerAllPastWorkCasts = () => {
    if (searchWorkCasts.length === 0) return;
    const namesToAdd = searchWorkCasts.map((c) => c.cast_name).filter((n) => n && n !== '未登録' && !favCasts.includes(n));
    if (namesToAdd.length === 0) return;
    const updated = [...favCasts, ...namesToAdd];
    setFavCasts(updated);
    if (typeof window !== 'undefined') localStorage.setItem('miier_fav_casts', JSON.stringify(updated));
  };

  const filteredAnime = animeList.filter((anime) => {
    if (selectedDay !== 'すべて' && anime.dayOfWeek !== selectedDay) return false;

    if (selectedPlatform !== 'すべて') {
      const targetKey = normalizePlatform(selectedPlatform);
      const hasMatch = anime.channels.some((ch) => normalizePlatform(ch) === targetKey);
      if (!hasMatch) return false;
    }

    if (selectedFavType === '作品' && !favorites.includes(anime.id)) return false;
    if (selectedFavType === '声優') {
      if (favCasts.length === 0) return false;
      const normalize = (s: string) => s.replace(/[\s ]+/g, '').toLowerCase();
      if (!anime.casts?.some((c) => favCasts.map(normalize).includes(normalize(c)))) return false;
    }

    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery) return true;
    const normQuery = toHiragana(rawQuery);
    return toHiragana(anime.title.toLowerCase()).includes(normQuery) ||
      toHiragana((anime.title_kana || '').toLowerCase()).includes(normQuery) ||
      anime.casts?.some((c) => toHiragana(c.toLowerCase()).includes(normQuery));
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦡</span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Miier <span className="text-xs font-normal text-slate-500">（ミーア）</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 🌟 クール選択ドロップダウン */}
            <div className="relative flex items-center bg-amber-50 rounded-xl border border-amber-200 px-2.5 py-1 text-amber-900 font-bold text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              <select
                value={selectedSeason.label}
                onChange={(e) => {
                  const s = SEASONS.find((item) => item.label === e.target.value);
                  if (s) setSelectedSeason(s);
                }}
                className="bg-transparent font-extrabold cursor-pointer focus:outline-none text-xs"
              >
                {SEASONS.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 🌟 推し・お気に入り管理ボタン */}
            <button
              onClick={() => setIsFavModalOpen(true)}
              className="flex items-center gap-1 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95"
            >
              <Heart className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
              <span>推し管理</span>
              {(favorites.length > 0 || favCasts.length > 0) && (
                <span className="ml-0.5 text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-black">
                  {favorites.length + favCasts.length}
                </span>
              )}
            </button>

            <button
              onClick={fetchAnnictAnime}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors"
              title="再読み込み"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <ControlPanel
          selectedDay={selectedDay} setSelectedDay={setSelectedDay}
          selectedPlatform={selectedPlatform} setSelectedPlatform={setSelectedPlatform}
          selectedFavType={selectedFavType} setSelectedFavType={setSelectedFavType}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          favoritesCount={favorites.length} favCastsCount={favCasts.length}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
        />

        {errorMsg && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">{errorMsg}</div>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs">{selectedSeason.label} のアニメデータを読み込み中...</p>
          </div>
        ) : (
          <div>
            <div className="mb-3 text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>{selectedFavType !== 'すべて' ? `★ ${selectedFavType}お気に入り: ` : '該当アニメ: '}<strong className="text-amber-600 font-bold">{filteredAnime.length}</strong> 件</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredAnime.map((anime) => (
                <AnimeCard
                  key={anime.id} anime={anime} isFav={favorites.includes(anime.id)} favCasts={favCasts}
                  onSelect={openModal} onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {selectedAnime && (
          <DetailModal
            anime={selectedAnime} activePlatform={activeModalPlatform} setActivePlatform={setActiveModalPlatform}
            casts={casts} loadingCasts={loadingCasts} studioName={studioName} favCasts={favCasts}
            onToggleFavCast={toggleFavCast} onToggleAllCasts={toggleAllCastsForAnime} onClose={() => setSelectedAnime(null)}
          />
        )}

        <PastWorkModal
          isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)}
          searchQuery={workSearchQuery} setSearchQuery={setWorkSearchQuery} onSearch={searchPastWorks}
          isSearching={searchingWorks} searchResults={workSearchResults} selectedWork={selectedSearchWork}
          setSelectedWork={setSelectedSearchWork} onSelectWork={selectSearchWork} workCasts={searchWorkCasts}
          loadingCasts={loadingSearchCasts} favCasts={favCasts} onToggleFavCast={toggleFavCast} onRegisterAllCasts={registerAllPastWorkCasts}
        />

        <FavoritesModal
          isOpen={isFavModalOpen} onClose={() => setIsFavModalOpen(false)}
          favorites={favorites} animeList={animeList} favCasts={favCasts}
          onRemoveFavorite={(id) => toggleFavorite(id)}
          onRemoveFavCast={(cast) => toggleFavCast(cast)}
          onClearAllFavCasts={clearAllFavCasts}
        />
      </main>
    </div>
  );
}