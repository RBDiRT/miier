'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { AnimeWork, CastInfo } from '../types/anime';
import { ControlPanel } from '../components/ControlPanel';
import { AnimeCard } from '../components/AnimeCard';
import { DetailModal } from '../components/DetailModal';
import { PastWorkModal } from '../components/PastWorkModal';

const toHiragana = (str: string) => str.replace(/[\u30a1-\u30f6]/g, (m) => String.fromCharCode(m.charCodeAt(0) - 0x60));

export default function Home() {
  const [selectedDay, setSelectedDay] = useState('すべて');
  const [selectedPlatform, setSelectedPlatform] = useState('すべて');
  const [selectedFavType, setSelectedFavType] = useState('すべて');
  const [searchQuery, setSearchQuery] = useState('');

  const [animeList, setAnimeList] = useState<AnimeWork[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favCasts, setFavCasts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [seasonName, setSeasonName] = useState('今期');

  const [selectedAnime, setSelectedAnime] = useState<AnimeWork | null>(null);
  const [activeModalPlatform, setActiveModalPlatform] = useState<string>('');
  const [casts, setCasts] = useState<CastInfo[]>([]);
  const [loadingCasts, setLoadingCasts] = useState(false);
  const [studioName, setStudioName] = useState<string>('');

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
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
    const updated = favCasts.includes(castName) ? favCasts.filter((c) => c !== castName) : [...favCasts, castName];
    setFavCasts(updated);
    if (typeof window !== 'undefined') localStorage.setItem('miier_fav_casts', JSON.stringify(updated));
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
    setActiveModalPlatform(anime.channels[0] || 'DMM TV');
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
    const now = new Date(); const year = now.getFullYear(); const month = now.getMonth() + 1;
    let season = 'winter', seasonJp = '冬';
    if (month >= 4 && month <= 6) { season = 'spring'; seasonJp = '春'; }
    else if (month >= 7 && month <= 9) { season = 'summer'; seasonJp = '夏'; }
    else if (month >= 10 && month <= 12) { season = 'autumn'; seasonJp = '秋'; }
    setSeasonName(`${year}年 ${seasonJp}アニメ`);

    const token = process.env.NEXT_PUBLIC_ANNICT_TOKEN;
    if (!token) { setErrorMsg('アクセストークン未設定'); setLoading(false); return; }

    try {
      const worksRes = await fetch(`https://api.annict.com/v1/works?filter_season=${year}-${season}&sort_watchers_count=desc&per_page=50`, { headers: { Authorization: `Bearer ${token}` } });
      if (!worksRes.ok) throw new Error(`APIエラー`);
      const rawWorks = (await worksRes.json()).works || [];

      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const channelMap: Record<number, { day?: string; channels: Set<string> }> = {};
      try {
        const progRes = await fetch(`https://api.annict.com/v1/programs?filter_season=${year}-${season}&per_page=100`, { headers: { Authorization: `Bearer ${token}` } });
        if (progRes.ok) {
          ((await progRes.json()).programs || []).forEach((prog: any) => {
            const wId = prog.work?.id; if (!wId) return;
            if (!channelMap[wId]) channelMap[wId] = { channels: new Set() };
            if (prog.channel?.name) channelMap[wId].channels.add(prog.channel.name);
            if (prog.started_at && !channelMap[wId].day) channelMap[wId].day = dayNames[new Date(prog.started_at).getDay()];
          });
        }
      } catch (e) { console.warn(e); }

      const castMap: Record<number, string[]> = {};
      const chunkSize = 10;
      for (let i = 0; i < rawWorks.length; i += chunkSize) {
        const batch = rawWorks.slice(i, i + chunkSize);
        await Promise.all(batch.map(async (w: any) => {
          try {
            const castRes = await fetch(`https://api.annict.com/v1/casts?filter_work_id=${w.id}&per_page=20`, { headers: { Authorization: `Bearer ${token}` } });
            if (castRes.ok) castMap[w.id] = ((await castRes.json()).casts || []).map((c: any) => c.person?.name || c.name || '').filter(Boolean);
          } catch (e) { console.warn(e); }
        }));
      }

      setAnimeList(rawWorks.map((w: any, idx: number) => ({
        id: w.id, title: w.title, title_kana: w.title_kana || '', media_text: w.media_text || 'TV',
        episodes_count: w.episodes_count || 0, official_site_url: w.official_site_url || '', twitter_username: w.twitter_username || '',
        season_name_text: w.season_name_text || '', dayOfWeek: channelMap[w.id]?.day || ['月', '火', '水', '木', '金', '土', '日'][(w.id || idx) % 7],
        channels: Array.from(channelMap[w.id]?.channels || []),
        image_url: w.images?.facebook_ogp_url || w.images?.recommended_url || '', casts: castMap[w.id] || [],
      })));
    } catch (err) { setErrorMsg('データ取得エラー'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnictAnime(); }, []);

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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦡</span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Miier <span className="text-xs font-normal text-slate-500">（ミーア）</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">{seasonName} 自動更新中</span>
            <button onClick={fetchAnnictAnime} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">再読み込み</span>
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
            <p className="text-xs">今期アニメ＆番組表＆キャストデータを読み込み中...</p>
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
      </main>
    </div>
  );
}