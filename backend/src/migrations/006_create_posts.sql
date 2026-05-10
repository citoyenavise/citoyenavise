-- Migration 006: Create posts table with comments, likes, and tags
-- Date: 2026-05-09
-- Description: Track user posts/ideas with engagement (comments, likes, tags)

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  petition_id INTEGER REFERENCES petitions(id) ON DELETE SET NULL,
  elu_id INTEGER REFERENCES elus(id) ON DELETE SET NULL,
  statut VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published'
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_statut ON posts(statut);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_petition_id ON posts(petition_id);
CREATE INDEX idx_posts_elu_id ON posts(elu_id);
CREATE INDEX idx_posts_titre_fts ON posts USING GIN(to_tsvector('french', titre));
CREATE INDEX idx_posts_contenu_fts ON posts USING GIN(to_tsvector('french', contenu));

-- Constraint: status must be valid
ALTER TABLE posts
ADD CONSTRAINT chk_post_statut_valid
CHECK (statut IN ('draft', 'published'));

-- Constraint: published_at must be after created_at
ALTER TABLE posts
ADD CONSTRAINT chk_post_published_after_created
CHECK (published_at IS NULL OR published_at >= created_at);

-- Table: post_comments (discussion on posts)
CREATE TABLE post_comments (
  id BIGSERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  parent_comment_id BIGINT REFERENCES post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX idx_post_comments_parent_comment_id ON post_comments(parent_comment_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at);

-- Table: post_likes (engagement tracking)
CREATE TABLE post_likes (
  id BIGSERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id) -- Prevent double likes
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- Table: comment_likes (nested engagement)
CREATE TABLE comment_likes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Table: post_tags (categorization)
CREATE TABLE post_tags (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  slug VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_tags_nom ON post_tags(nom);
CREATE INDEX idx_post_tags_slug ON post_tags(slug);

-- Table: post_post_tags (M-N relationship)
CREATE TABLE post_post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES post_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_post_tags_post_id ON post_post_tags(post_id);
CREATE INDEX idx_post_post_tags_tag_id ON post_post_tags(tag_id);

-- Triggers for denormalized counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = NEW.post_id)
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_count_trigger
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Trigger for comment count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = NEW.post_id AND parent_comment_id IS NULL)
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comments_count_trigger
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- Trigger for comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE post_comments SET likes_count = (SELECT COUNT(*) FROM comment_likes WHERE comment_id = NEW.comment_id)
  WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_likes_count_trigger
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();
