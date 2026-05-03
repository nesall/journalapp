
export interface NoteMedia {
  id: string;
  type: string;   // 'image' | 'video' | 'file'
  url: string;
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
}

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}