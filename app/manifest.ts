import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Miier（ミーア）- アニメ放送・配信情報',
    short_name: 'Miier',
    description: '今期アニメの放送日・配信サイト・推し声優出演作をひと目で確認できる完全無料アプリ',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#f59e0b',
    icons: [
      {
        src: 'https://em-content.zobj.net/source/apple/391/badger_1f9a1.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://em-content.zobj.net/source/apple/391/badger_1f9a1.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}