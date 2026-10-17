SELECT 'unique_event_grain' AS check_name, count(*)=count(DISTINCT id) AS passed FROM events
UNION ALL
SELECT 'unique_trial_grain', count(*)=count(DISTINCT id) FROM trials
UNION ALL
SELECT 'unique_product_grain', count(*)=count(DISTINCT id) FROM products
UNION ALL
SELECT 'event_dates_in_snapshot', count(*)=0 FROM events WHERE approval_date<'2024-01-01' OR approval_date>'2026-10-17'
UNION ALL
SELECT 'known_product_references', count(*)=0 FROM (SELECT unnest(product_ids) AS product_id FROM events) p LEFT JOIN products d ON p.product_id=d.id WHERE d.id IS NULL
UNION ALL
SELECT 'known_cited_trial_references', count(*)=0 FROM (SELECT unnest(trial_ids) AS trial_id FROM events) r LEFT JOIN trials t ON r.trial_id=t.id WHERE t.id IS NULL
UNION ALL
SELECT 'evidence_has_event', count(*)=0 FROM evidence p LEFT JOIN events e ON p.event_id=e.id WHERE e.id IS NULL
UNION ALL
SELECT 'missing_trial_status_not_invented', count(*)=0 FROM trials WHERE NOT available AND snapshot_at IS NOT NULL;
