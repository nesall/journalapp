export interface TopicTag {
  id: string;
  topic_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface NoteMedia {
  id: string;
  type: string;   // 'image' | 'video' | 'file'
  url: string;
  thumbnail_url: string | null;
}

export interface Note {
  id: string;
  topic_id: string;
  user_id: string;
  title: string | null;
  body: string;
  mood: number | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
  media: NoteMedia[];
  tag_id: string | null;
  tag?: TopicTag | null;
}

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;  
}