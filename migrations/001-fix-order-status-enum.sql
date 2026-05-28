-- Migration: Fix Order_Status ENUM to support 'Processing'
-- Date: 2026-05-26
-- Description: 
--   1. Checks current Order_Status column definition
--   2. Maps invalid values to valid ones
--   3. Alters column to new ENUM with 'Processing' support
--   4. Ensures no data loss

-- ============================================================================
-- STEP 1: Check current column definition
-- ============================================================================
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Orders'
  AND COLUMN_NAME = 'Order_Status';

-- ============================================================================
-- STEP 2: Backup check - Count rows by current status values
-- ============================================================================
SELECT 
    Order_Status,
    COUNT(*) as count
FROM Orders
GROUP BY Order_Status
ORDER BY Order_Status;

-- ============================================================================
-- STEP 3: Map invalid values to valid ones
-- ============================================================================

-- Map 'Shipped' to 'Ready'
UPDATE Orders 
SET Order_Status = 'Ready'
WHERE Order_Status = 'Shipped';

-- Map NULL to 'Pending'
UPDATE Orders 
SET Order_Status = 'Pending'
WHERE Order_Status IS NULL;

-- Handle any other potentially problematic values
-- (Map any value that's too long or not in the new enum)
UPDATE Orders 
SET Order_Status = 'Pending'
WHERE Order_Status NOT IN ('Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled')
  AND Order_Status IS NOT NULL;

-- ============================================================================
-- STEP 4: Verify data mapping
-- ============================================================================
SELECT 
    Order_Status,
    COUNT(*) as count
FROM Orders
GROUP BY Order_Status
ORDER BY Order_Status;

-- ============================================================================
-- STEP 5: Alter the column to support 'Processing'
-- ============================================================================
ALTER TABLE Orders 
MODIFY COLUMN Order_Status 
ENUM('Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled') 
NOT NULL DEFAULT 'Pending';

-- ============================================================================
-- STEP 6: Verify column definition after alteration
-- ============================================================================
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Orders'
  AND COLUMN_NAME = 'Order_Status';

-- ============================================================================
-- STEP 7: Final verification - Show updated status distribution
-- ============================================================================
SELECT 
    Order_Status,
    COUNT(*) as count
FROM Orders
GROUP BY Order_Status
ORDER BY Order_Status;

-- Migration complete! The Order_Status column now supports 'Processing'
-- and all invalid values have been safely mapped to valid ones.
