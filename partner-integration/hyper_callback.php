<?php
/**
 * Hyper Softs SaaS — merged config + wallet callback endpoint (partner server).
 *
 *  File location : /public_html/hyper_callback.php
 *  Callback URL  : https://YOUR-DOMAIN.com/hyper_callback.php
 *                  (paste this into the panel: Callbacks & Tokens -> Callback URL)
 *
 * It does two jobs:
 *   1) When included (e.g. by Login_2.php) it only exposes the config +
 *      hyper_issue_token() helper — no output, no side effects.
 *   2) When requested directly by our server it acts as the wallet callback
 *      for GetBalance / PlaceBet / WinLoss.
 */

if (!defined('HYPER_CONFIG_LOADED')) {
    define('HYPER_CONFIG_LOADED', true);

    /* ============================ CONFIG ============================
     * Panel -> Admin -> Integration Config shows these exact values.
     * HYPER_DATA_KEY  = api key of a key with mode = data     (period/result API)
     * HYPER_CB_KEY    = api key of a key with mode = callback (token + wallet)
     * HYPER_CB_SECRET = that callback key's "Callback secret" (HMAC-SHA256)
     */
    define('HYPER_BASE',      'https://sass.hyperapi.in');
    define('HYPER_DATA_KEY',  'PASTE_DATA_API_KEY');
    define('HYPER_CB_KEY',    'PASTE_CALLBACK_API_KEY');
    define('HYPER_CB_SECRET', 'PASTE_CALLBACK_SECRET');
    define('HYPER_TOKEN_TTL', 300);              // seconds, must match the panel
    define('HYPER_DB_HOST',   '127.0.0.1');
    define('HYPER_DB_NAME',   'your_db');
    define('HYPER_DB_USER',   'your_db_user');
    define('HYPER_DB_PASS',   'your_db_pass');
    /* ================================================================ */

    /** PDO connection to YOUR wallet database. */
    function hyper_db(): PDO {
        static $pdo = null;
        if ($pdo === null) {
            $pdo = new PDO(
                'mysql:host=' . HYPER_DB_HOST . ';dbname=' . HYPER_DB_NAME . ';charset=utf8mb4',
                HYPER_DB_USER, HYPER_DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
            );
        }
        return $pdo;
    }

    function hyper_sign(string $rawBody): string {
        return hash_hmac('sha256', $rawBody, HYPER_CB_SECRET);
    }

    /** Signed POST to our API. */
    function hyper_post(string $path, array $payload): array {
        $payload['api_key'] = HYPER_CB_KEY;
        $raw = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $ch  = curl_init(HYPER_BASE . $path);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $raw,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'X-Signature: ' . hyper_sign($raw),
                'X-Client-Domain: ' . ($_SERVER['HTTP_HOST'] ?? ''),
            ],
        ]);
        $res  = curl_exec($ch);
        $err  = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($res === false) return ['code' => 500, 'msg' => 'curl: ' . $err];
        $json = json_decode($res, true);
        return is_array($json) ? $json : ['code' => $code, 'msg' => 'bad response', 'raw' => $res];
    }

    /**
     * Ask our server for a single-use game token for this user.
     * @return string|null token, or null on failure (see error_log).
     */
    function hyper_issue_token($userId, ?string $unused = null, int $ttl = HYPER_TOKEN_TTL): ?string {
        $r = hyper_post('/api/public/token/issue', [
            'user_id' => (string) $userId,
            'ttl'     => $ttl,
        ]);
        if (($r['code'] ?? -1) === 0 && !empty($r['token'])) return $r['token'];
        error_log('hyper_issue_token failed: ' . json_encode($r));
        return null;
    }

    /** Full player entry URL on OUR domain. */
    function hyper_login_url(string $token): string {
        return HYPER_BASE . '/api/public/token/enter?Token=' . urlencode($token);
    }
}

/* ==================================================================
 * From here on: only run when this file is requested directly
 * (i.e. it IS the callback endpoint). Included files stop above.
 * ================================================================== */
if (realpath(__FILE__) !== realpath($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    return;
}

header('Content-Type: application/json; charset=utf-8');

function hyper_out(array $body, int $status = 200): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
$in  = json_decode($raw, true);
if (!is_array($in)) hyper_out(['status' => 'error', 'message' => 'Invalid JSON'], 400);

/* --- 1. Verify HMAC signature (our server signs the raw body) --- */
$sig = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
if ($sig === '' || !hash_equals(hyper_sign($raw), strtolower(trim($sig)))) {
    hyper_out(['status' => 'error', 'message' => 'Invalid signature'], 401);
}

/* --- 2. Reject stale requests (replay window 5 min) --- */
$ts = (int) ($in['ts'] ?? ($_SERVER['HTTP_X_HYPER_TIMESTAMP'] ?? 0));
if ($ts > 0 && abs(time() - $ts) > 300) {
    hyper_out(['status' => 'error', 'message' => 'Stale request'], 401);
}

$type   = (string) ($in['callback_type'] ?? '');
$userId = (string) ($in['user_id'] ?? '');
$amount = isset($in['amount']) ? (float) $in['amount'] : 0.0;
$ref    = (string) ($in['reference'] ?? '');
if ($userId === '') hyper_out(['status' => 'error', 'message' => 'Missing user_id'], 400);

/* Adjust these two names to your own schema */
$USERS_TABLE   = 'users';
$BALANCE_FIELD = 'money';

try {
    $db = hyper_db();

    if ($type === 'GetBalance') {
        $st = $db->prepare("SELECT `$BALANCE_FIELD` AS bal FROM `$USERS_TABLE` WHERE id = ? LIMIT 1");
        $st->execute([$userId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) hyper_out(['status' => 'error', 'message' => 'User not found'], 404);
        hyper_out(['status' => 'success', 'new_balance' => (float) $row['bal']]);
    }

    if ($type === 'PlaceBet' || $type === 'WinLoss') {
        if ($amount <= 0) hyper_out(['status' => 'error', 'message' => 'Invalid amount'], 400);

        // Idempotency: the same reference must never be applied twice.
        if ($ref !== '') {
            $st = $db->prepare("SELECT id FROM hyper_wallet_log WHERE reference = ? LIMIT 1");
            $st->execute([$ref]);
            if ($st->fetch()) {
                $st = $db->prepare("SELECT `$BALANCE_FIELD` AS bal FROM `$USERS_TABLE` WHERE id = ? LIMIT 1");
                $st->execute([$userId]);
                $bal = (float) ($st->fetchColumn() ?: 0);
                hyper_out(['status' => 'success', 'new_balance' => $bal, 'message' => 'duplicate ignored']);
            }
        }

        $delta = ($type === 'PlaceBet') ? -$amount : $amount;

        $db->beginTransaction();
        $st = $db->prepare("SELECT `$BALANCE_FIELD` AS bal FROM `$USERS_TABLE` WHERE id = ? FOR UPDATE");
        $st->execute([$userId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) { $db->rollBack(); hyper_out(['status' => 'error', 'message' => 'User not found'], 404); }

        $bal = (float) $row['bal'];
        if ($type === 'PlaceBet' && $bal < $amount) {
            $db->rollBack();
            hyper_out(['status' => 'error', 'message' => 'Insufficient balance', 'new_balance' => $bal], 402);
        }

        $new = $bal + $delta;
        $db->prepare("UPDATE `$USERS_TABLE` SET `$BALANCE_FIELD` = ? WHERE id = ?")->execute([$new, $userId]);
        $db->prepare(
            "INSERT INTO hyper_wallet_log (user_id, callback_type, amount, new_balance, reference, payload, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())"
        )->execute([$userId, $type, $delta, $new, $ref !== '' ? $ref : null, $raw]);
        $db->commit();

        hyper_out(['status' => 'success', 'new_balance' => $new]);
    }

    hyper_out(['status' => 'error', 'message' => "Unknown callback_type '$type'"], 400);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('hyper_callback: ' . $e->getMessage());
    hyper_out(['status' => 'error', 'message' => 'Server error'], 500);
}
