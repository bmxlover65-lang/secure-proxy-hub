-- Run once on the PARTNER server database (manual).
CREATE TABLE IF NOT EXISTS hyper_wallet_log (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id       VARCHAR(64)     NOT NULL,
  callback_type VARCHAR(32)     NOT NULL,
  amount        DECIMAL(18,4)   NOT NULL,
  new_balance   DECIMAL(18,4)   NOT NULL,
  reference     VARCHAR(128)     NULL,
  payload       TEXT             NULL,
  created_at    DATETIME        NOT NULL,
  UNIQUE KEY uniq_reference (reference),
  KEY idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
