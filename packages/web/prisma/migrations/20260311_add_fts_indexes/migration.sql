-- PostgreSQL 全文搜索（FTS）索引
-- 
-- 使用 'simple' 分词器：按空白拆分 + 小写化，中英文通用。
-- 'simple' 不做词根提取（stemming），但兼容性好、无需额外插件。
-- 
-- 为什么用表达式索引而非新增 tsvector 列：
-- 1. 不需要修改 Prisma schema，避免 schema drift
-- 2. PostgreSQL 会自动维护表达式索引，无需手写触发器
-- 3. 查询时 to_tsvector() 的参数必须与索引表达式完全一致才能命中

-- 对话标题的 GIN 全文索引
CREATE INDEX IF NOT EXISTS "idx_conversation_title_fts"
ON "Conversation"
USING GIN (to_tsvector('simple', "title"));

-- 消息内容的 GIN 全文索引
CREATE INDEX IF NOT EXISTS "idx_message_content_fts"
ON "Message"
USING GIN (to_tsvector('simple', "content"));
