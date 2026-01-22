-- Миграция: Изменение типа group_id в таблице files
-- Дата: 2026-01-22
-- Описание: Изменение типа group_id с INT UNSIGNED на VARCHAR(191) для поддержки UUID

ALTER TABLE files MODIFY COLUMN group_id VARCHAR(191) NULL COMMENT 'Ссылка на study_groups';
