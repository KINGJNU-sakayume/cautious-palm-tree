-- Mark an achievement as earned
UPDATE achievements
SET is_earned = true,
    earned_at = CURRENT_DATE,
    progress  = (condition->>'target')::numeric
WHERE id = 'ach-run-003';

-- Update progress
UPDATE achievements SET progress = 75 WHERE id = 'ach-run-004';

-- Reset (un-earn)
UPDATE achievements
SET is_earned = false, earned_at = NULL, progress = 0
WHERE id = 'ach-run-003';

-- Update the condition definition
UPDATE achievements
SET condition = '{"type": "cumulative", "target": 200, "unit": "km"}'::jsonb
WHERE id = 'ach-run-003';

-- Change tier (bronze | silver | gold | platinum | diamond | red_diamond)
UPDATE achievements SET tier = 'diamond' WHERE id = 'ach-run-006';

-- Show / hide
UPDATE achievements SET is_hidden = true  WHERE id = 'ach-run-007';

-- Soft-delete all achievements for a category
UPDATE achievements SET soft_deleted = true WHERE category_id = 'cat-running';

-- View achievements near completion (≥80% progress)
SELECT id, title, progress, (condition->>'target')::numeric AS target
FROM achievements
WHERE is_earned = false
  AND condition->>'target' IS NOT NULL
  AND progress >= (condition->>'target')::numeric * 0.8
ORDER BY progress DESC;
