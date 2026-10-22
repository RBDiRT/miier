export interface AnimeWork {
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
  studio?: string;
}

export interface CastInfo {
  character_name: string;
  cast_name: string;
}