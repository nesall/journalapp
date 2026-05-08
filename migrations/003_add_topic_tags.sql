CREATE TABLE topic_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE entries ADD COLUMN tag_id UUID REFERENCES topic_tags(id) ON DELETE SET NULL;

CREATE INDEX idx_topic_tags_topic_id ON topic_tags(topic_id);
CREATE INDEX idx_entries_tag_id ON entries(tag_id);
