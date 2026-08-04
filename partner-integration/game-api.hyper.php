<?php

/**

 * HyperSofts Gaming — Combined Launcher + Callback v5.3

 * INR Currency | Direct Redirect | Prefix Strip + Fuzzy ID

 * FIX: Absolute URL validation on launch response

 *

 * + HYPER TOKEN SETUP (added, original code untouched):

 *   WinGo_* / K3_* / D5_* (5D_*) / MotoRace_* gameCodes are served by

 *   sass.hyperapi.in — for these we issue a single-use token and return

 *   the entry URL (https://sass.hyperapi.in/api/public/token/enter?Token=..&gameCode=..).

 *   Every other gameCode keeps going to the original api.hyperapi.in flow.

 */

ini_set('display_errors', 0);

ini_set('log_errors', 1);

ini_set('error_log', __DIR__ . '/game_errors.log');

error_reporting(E_ALL);

define('GAME_ACCESS', true);

/* ================= DATABASE CONNECTION ================= */

$servername = "localhost";

$username   = "sbkwini1_lara";

$password   = "sbkwini1_lara";

$dbname     = "sbkwini1_lara";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {

    die("Database Connection Failed: " . $conn->connect_error);

}

$conn->set_charset("utf8mb4");

/* ================= FUNCTIONS ================= */

include_once "../../functions2.php";

/* ================= API CONFIG ================= */

define('API_URL',       'https://api.hyperapi.in/api/game-api');

define('API_TOKEN',     '3006bf10129a19b179ac309ddb30a0cda0e9ebd3caf1268cb4004f8b86ad018c');

define('API_SECRET',    '99fcd0b486f3b4ad8f51cc9bf94c00a71e15b0e0eb83e1ecaec12631029e7e69');

define('PLAYER_PREFIX', 'a64d27');

define('CURRENCY',      'INR');

define('EXIT_URL',      'https://6club.agniwin.com/');

/* ---------- HYPER (sass.hyperapi.in) CONFIG — fill from panel ---------- */

define('HYPER_BASE',      'https://sass.hyperapi.in');

define('HYPER_CB_KEY',    'HAPI_EBA8C281CBF09DC067022A57F6E9DA733DC26D60'); // Callbacks & Tokens -> API key

define('HYPER_CB_SECRET', 'PASTE_HMAC_SECRET_HERE');                        // Callbacks & Tokens -> HMAC secret

define('HYPER_TOKEN_TTL', 300);

/* ---------- CALLBACK URL ----------
   Ye wahi file ka REAL public URL hona chahiye jahan ye script rakhi hai.
   Yahi URL callbacks (bet/win/refund) receive karta hai.
   Agar file ka naam/folder badle to sirf yeh line badalni hai. */

define('CALLBACK_URL_OVERRIDE', 'https://api.agniwinapi.buzz/api/webapi/hyper_callback.php');

$PROTOCOL = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';

if (CALLBACK_URL_OVERRIDE !== '') {

    $CALLBACK_URL = CALLBACK_URL_OVERRIDE;

} else {

    // fallback: exact current script path (extension preserve, query strip)
    $CALLBACK_URL = $PROTOCOL . '://' . $_SERVER['HTTP_HOST'] . strtok($_SERVER['REQUEST_URI'], '?');

}

/* ================= HEADERS ================= */

header('Content-Type: application/json; charset=utf-8');

header('Strict-Transport-Security: max-age=31536000');

header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Signature');

header('Access-Control-Allow-Methods: POST, OPTIONS');

header('Access-Control-Allow-Credentials: true');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (!empty($origin)) {

    header('Access-Control-Allow-Origin: ' . $origin);

}

header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(204);

    exit;

}

date_default_timezone_set("Asia/Kolkata");

$serviceTime = date("Y-m-d H:i:s");

$logFile = __DIR__ . "/game_debug.log";

function logMsg($msg) {

    global $logFile;

    file_put_contents($logFile, date("Y-m-d H:i:s") . " - " . $msg . PHP_EOL, FILE_APPEND);

}

/* ================= HELPER: Ensure Absolute URL ================= */

function ensureAbsoluteUrl($url) {

    $url = trim($url);

    if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) {

        return $url;

    }

    // Strip leading slashes

    $url = ltrim($url, '/');

    return 'https://' . $url;

}

/* ================= HYPER HELPERS (added) ================= */

/** WinGo_30S / WinGo_1M / K3_1M / D5_1M / 5D_1M / MotoRace_1M -> true. TrxWinGo_* -> false. */
function hyper_is_game_code($gameCode) {

    return (bool) preg_match('/^(WinGo|K3|D5|5D|MotoRace)[_-]\d+[SM]$/i', trim((string) $gameCode));

}

/** Normalise 5D_* to D5_* (platform naming). */
function hyper_norm_game_code($gameCode) {

    $gc = trim((string) $gameCode);

    if (preg_match('/^5D[_-](\d+[SM])$/i', $gc, $m)) {

        return 'D5_' . strtoupper($m[1]);

    }

    return $gc;

}

/** Ask sass.hyperapi.in for a single-use game token. Returns token or null. */
function hyper_issue_token($userId, $ttl = HYPER_TOKEN_TTL) {

    $payload = json_encode([

        'api_key' => HYPER_CB_KEY,

        'user_id' => (string) $userId,

        'ttl'     => (int) $ttl,

    ], JSON_UNESCAPED_SLASHES);

    $signature = hash_hmac('sha256', $payload, HYPER_CB_SECRET);

    $ch = curl_init(HYPER_BASE . '/api/public/token/issue');

    curl_setopt_array($ch, [

        CURLOPT_POST           => true,

        CURLOPT_RETURNTRANSFER => true,

        CURLOPT_HTTPHEADER     => [

            'Content-Type: application/json',

            'X-API-Key: ' . HYPER_CB_KEY,

            'X-Signature: ' . $signature,

            'X-Client-Domain: ' . ($_SERVER['HTTP_HOST'] ?? ''),

        ],

        CURLOPT_POSTFIELDS     => $payload,

        CURLOPT_TIMEOUT        => 20,

        CURLOPT_CONNECTTIMEOUT => 10,

        CURLOPT_SSL_VERIFYPEER => true,

    ]);

    $res  = curl_exec($ch);

    $err  = curl_error($ch);

    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    logMsg("HYPER TOKEN | HTTP $code | " . ($err ?: substr((string) $res, 0, 400)));

    if ($err || $code !== 200) return null;

    $j = json_decode((string) $res, true);

    return (is_array($j) && !empty($j['token'])) ? $j['token'] : null;

}

/** Player entry URL on the platform domain. */
function hyper_entry_url($token, $gameCode = '') {

    $url = HYPER_BASE . '/api/public/token/enter?Token=' . urlencode($token);

    if ($gameCode !== '') {

        $url .= '&gameCode=' . urlencode(hyper_norm_game_code($gameCode));

    }

    return $url;

}

/* --- Optional direct browser redirect: game-api.php?hyper_token=..&gameCode=.. --- */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['hyper_token'])) {

    header('Location: ' . hyper_entry_url(trim($_GET['hyper_token']), trim($_GET['gameCode'] ?? '')), true, 302);

    exit;

}

/* ================= READ BODY ================= */

$rawBody = file_get_contents("php://input");

$post = json_decode($rawBody, true);

if (!$post) {

    echo json_encode(['code' => 7, 'msg' => 'Invalid JSON', 'serviceNowTime' => $serviceTime]);

    exit;

}

/* ================= DETECT MODE ================= */

$isCallback = isset($post['serial_number']) && isset($post['member_account']);

$isLaunch   = isset($post['gameCode']) && !$isCallback;

if ($isCallback) {

    handleCallback($post, $conn, $serviceTime, $rawBody);

} elseif ($isLaunch) {

    handleLaunch($post, $conn, $serviceTime);

} else {

    echo json_encode(['code' => 7, 'msg' => 'Invalid request', 'serviceNowTime' => $serviceTime]);

    exit;

}

/* =================================================================

   ========================= LAUNCH ================================

   ================================================================= */

function handleLaunch($post, $conn, $serviceTime) {

    global $CALLBACK_URL;

    $gameCode     = trim($post['gameCode']);

    $gameName     = trim($post['gameName'] ?? '');

    $providerCode = trim($post['providerCode'] ?? '');

    logMsg("=== LAUNCH REQUEST === Game: $gameCode | Provider: $providerCode");

    /* --- JWT AUTH --- */

    $bearer = explode(" ", $_SERVER['HTTP_AUTHORIZATION'] ?? '');

    $token  = $bearer[1] ?? '';

    if (empty($token)) {

        http_response_code(401);

        echo json_encode(['code' => 4, 'msg' => 'Missing Token', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    $is_jwt_valid = is_jwt_valid($token);

    $data_auth    = json_decode($is_jwt_valid, true);

    if (!$data_auth || ($data_auth['status'] ?? '') !== 'Success') {

        http_response_code(401);

        echo json_encode(['code' => 4, 'msg' => 'Permission Denied', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    $user_id = (int)$data_auth['payload']['id'];

    logMsg("AUTH OK | User ID: $user_id");

    /* --- RECHARGE LOCK (min 200) --- */

    $rechargeStmt = $conn->prepare("

        SELECT IFNULL(SUM(motta), 0) as total_recharge

        FROM thevani WHERE balakedara = ? AND sthiti = 1

    ");

    if (!$rechargeStmt) {

        logMsg("PREPARE ERROR (recharge): " . $conn->error);

        echo json_encode(['code' => 9, 'msg' => 'DB Error', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    $rechargeStmt->bind_param("i", $user_id);

    $rechargeStmt->execute();

    $totalRecharge = floatval($rechargeStmt->get_result()->fetch_assoc()['total_recharge'] ?? 0);

    $rechargeStmt->close();

    if ($totalRecharge < 200) {

        logMsg("PLAY LOCKED | User: $user_id | Recharge: $totalRecharge");

        echo json_encode([

            'code' => 403, 'msg' => 'Need Recharge 200',

            'data' => ['requiredRecharge' => 200, 'currentRecharge' => $totalRecharge],

            'serviceNowTime' => $serviceTime

        ]);

        exit;

    }

    /* --- GET BALANCE --- */

    $walletBalance = getBalance($conn, $user_id);

    if ($walletBalance === null) {

        logMsg("WALLET NOT FOUND | User: $user_id");

        echo json_encode(['code' => 404, 'msg' => 'Wallet Not Found', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    if ($walletBalance <= 0) {

        echo json_encode([

            'code' => 403, 'msg' => 'Insufficient balance',

            'data' => ['balance' => $walletBalance],

            'serviceNowTime' => $serviceTime

        ]);

        exit;

    }

    logMsg("WALLET | User: $user_id | Balance: Rs$walletBalance");

    /* ============ HYPER TOKEN LAUNCH (added) ============ */

    if (hyper_is_game_code($gameCode)) {

        $hyperToken = hyper_issue_token($user_id, HYPER_TOKEN_TTL);

        if (!$hyperToken) {

            logMsg("HYPER LAUNCH FAILED | user=$user_id | game=$gameCode");

            echo json_encode(['code' => -1, 'msg' => 'Game service unavailable, try again', 'serviceNowTime' => $serviceTime]);

            exit;

        }

        $launchUrl = hyper_entry_url($hyperToken, $gameCode);

        logMsg("HYPER LAUNCH OK | user=$user_id | game=$gameCode | URL: $launchUrl");

        echo json_encode([

            'code' => 0, 'msg' => 'Success',

            'data' => [

                'url'        => $launchUrl,

                'returnType' => '1',

                'balance'    => $walletBalance,

                'currency'   => CURRENCY

            ],

            'serviceNowTime' => $serviceTime

        ], JSON_UNESCAPED_SLASHES);

        exit;

    }

    /* --- CALL API --- */

    $memberAccount = PLAYER_PREFIX . (string)$user_id;

    $apiPayload = json_encode([

        "action"         => "launch",

        "game_uid"       => $gameCode,

        "game_name"      => $gameName,

        "provider_code"  => $providerCode,

        "credit_amount"  => $walletBalance,

        "member_account" => $memberAccount,

        "currency"       => CURRENCY,

        "callback_url"   => $CALLBACK_URL,

        "home_url"       => EXIT_URL,

        "branding"       => false

    ]);

    logMsg("API CALL | $apiPayload");

    $ch = curl_init(API_URL);

    curl_setopt_array($ch, [

        CURLOPT_POST           => true,

        CURLOPT_RETURNTRANSFER => true,

        CURLOPT_HTTPHEADER     => [

            "Content-Type: application/json",

            "Authorization: Bearer " . API_TOKEN,

            "X-API-Secret: " . API_SECRET

        ],

        CURLOPT_POSTFIELDS     => $apiPayload,

        CURLOPT_TIMEOUT        => 30,

        CURLOPT_CONNECTTIMEOUT => 10,

        CURLOPT_SSL_VERIFYPEER => true

    ]);

    $response  = curl_exec($ch);

    $curlError = curl_error($ch);

    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    logMsg("API RESPONSE | HTTP: $httpCode | Body: " . substr($response, 0, 500));

    if ($curlError) {

        echo json_encode(['code' => 8, 'msg' => 'Connection Error', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    if ($httpCode === 401) {

        echo json_encode(['code' => 4, 'msg' => 'API Token/Secret Invalid', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    if ($httpCode !== 200) {

        echo json_encode(['code' => 8, 'msg' => "Server Error (HTTP $httpCode)", 'serviceNowTime' => $serviceTime]);

        exit;

    }

    $result = json_decode($response, true);

    if (!$result) {

        echo json_encode(['code' => 9, 'msg' => 'Invalid Response', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    if (isset($result['error'])) {

        echo json_encode(['code' => -1, 'msg' => $result['error'], 'serviceNowTime' => $serviceTime]);

        exit;

    }

    if (!empty($result['success']) && !empty($result['game_launch_url'])) {

        // ✅ FIX: Ensure absolute URL — prevents pakwin92.com/api.hyperapi.in/... issue

        $launchUrl = ensureAbsoluteUrl($result['game_launch_url']);

        logMsg("LAUNCH SUCCESS | User: $user_id | Game: $gameCode | Member: $memberAccount | URL: $launchUrl");

        echo json_encode([

            'code' => 0, 'msg' => 'Success',

            'data' => [

                'url'        => $launchUrl,

                'returnType' => '1',

                'balance'    => $walletBalance,

                'currency'   => CURRENCY

            ],

            'serviceNowTime' => $serviceTime

        ]);

        exit;

    }

    echo json_encode([

        'code' => -1,

        'msg'  => $result['msg'] ?? $result['error'] ?? 'Game Launch Failed',

        'serviceNowTime' => $serviceTime

    ]);

    exit;

}

/* =================================================================

   ======================== CALLBACK ===============================

   ================================================================= */

function handleCallback($post, $conn, $serviceTime, $rawBody) {

    $serial_number  = trim($post['serial_number'] ?? '');

    $member_account = trim($post['member_account'] ?? '');

    $bet_amount     = round(floatval($post['bet_amount'] ?? 0), 2);

    $win_amount     = round(floatval($post['win_amount'] ?? 0), 2);

    $game_uid       = trim($post['game_uid'] ?? '');

    $game_round     = trim($post['game_round'] ?? '');

    $currency       = strtoupper(trim($post['currency'] ?? CURRENCY));

    $game_name      = trim($post['game_name'] ?? $game_uid);

    $action         = trim($post['action'] ?? 'bet');

    logMsg("=== CALLBACK === serial=$serial_number | member=$member_account | bet=$bet_amount | win=$win_amount | game=$game_uid ($game_name) | round=$game_round | action=$action");

    /* --- HMAC Signature Verify --- */

    $signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';

    if (!empty($signature)) {

        $expectedSig = hash_hmac('sha256', $rawBody, API_SECRET);

        $hyperSig    = hash_hmac('sha256', $rawBody, HYPER_CB_SECRET);

        if (!hash_equals($expectedSig, $signature) && !hash_equals($hyperSig, $signature)) {

            logMsg("⚠ SIGNATURE MISMATCH");

        } else {

            logMsg("✓ Signature verified");

        }

    }

    /* --- Skip no-op --- */

    if ($bet_amount == 0 && $win_amount == 0) {

        logMsg("SKIP NO-OP | serial=$serial_number");

        echo json_encode(['code' => 0, 'msg' => 'OK (no-op)', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    /* --- Extract User ID --- */

    $cleanAccount = trim($member_account);

    if (strpos($cleanAccount, PLAYER_PREFIX) === 0) {

        $cleanAccount = substr($cleanAccount, strlen(PLAYER_PREFIX));

        logMsg("PREFIX STRIPPED | " . PLAYER_PREFIX . " -> remaining: $cleanAccount");

    }

    if (preg_match('/^(.+?)([a-z0-9]{3})$/i', $cleanAccount, $sfx)) {

        $suffix = $sfx[2];

        if (preg_match('/[a-zA-Z]/', $suffix)) {

            $cleanAccount = $sfx[1];

            logMsg("SUFFIX STRIPPED | removed '$suffix' -> remaining: $cleanAccount");

        }

    }

    $user_id = 0;

    if (is_numeric($cleanAccount)) {

        $user_id = intval($cleanAccount);

    } elseif (preg_match('/(\d{3,})/', $cleanAccount, $m)) {

        $user_id = intval($m[1]);

        logMsg("FUZZY EXTRACT | '$cleanAccount' -> $user_id");

    }

    if ($user_id <= 0) {

        logMsg("INVALID USER | member_account=$member_account | cleaned=$cleanAccount");

        echo json_encode(['code' => 1, 'msg' => 'Invalid user', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    logMsg("USER RESOLVED | member=$member_account -> user_id=$user_id");

    /* --- Ensure table --- */

    ensureTable($conn);

    /* --- Duplicate Check --- */

    $dupStmt = $conn->prepare("

        SELECT id FROM game_bet_logs 

        WHERE serial_number = ? AND game_round = ? AND bet_amount = ? AND win_amount = ?

        LIMIT 1

    ");

    if (!$dupStmt) {

        logMsg("PREPARE ERROR (dup check): " . $conn->error);

        echo json_encode(['code' => 9, 'msg' => 'DB Error (dup check)', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    $dupStmt->bind_param("ssdd", $serial_number, $game_round, $bet_amount, $win_amount);

    $dupStmt->execute();

    $dupResult = $dupStmt->get_result();

    if ($dupResult && $dupResult->num_rows > 0) {

        $dupStmt->close();

        $bal = getBalance($conn, $user_id);

        logMsg("DUPLICATE | serial=$serial_number | balance=$bal");

        echo json_encode(['code' => 0, 'msg' => 'Duplicate', 'balance' => $bal, 'serviceNowTime' => $serviceTime]);

        exit;

    }

    $dupStmt->close();

    /* --- Get Balance --- */

    $currentBalance = getBalance($conn, $user_id);

    if ($currentBalance === null) {

        logMsg("USER NOT FOUND | user_id=$user_id");

        echo json_encode(['code' => 1, 'msg' => 'User not found', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    /* --- Calculate --- */

    $balanceAfterBet = $currentBalance - $bet_amount;

    $newBalance = round($balanceAfterBet + $win_amount, 2);

    logMsg("BALANCE CALC | Before: Rs$currentBalance | Bet: -Rs$bet_amount | Win: +Rs$win_amount | After: Rs$newBalance");

    if ($balanceAfterBet < 0) {

        logMsg("INSUFFICIENT | user=$user_id | balance=$currentBalance | bet=$bet_amount");

        echo json_encode([

            'code' => 1, 'msg' => 'Insufficient balance',

            'balance' => $currentBalance,

            'serviceNowTime' => $serviceTime

        ]);

        exit;

    }

    /* --- Update Balance --- */

    $updateStmt = $conn->prepare("UPDATE shonu_kaichila SET motta = ? WHERE balakedara = ?");

    if (!$updateStmt) {

        logMsg("PREPARE ERROR (update balance): " . $conn->error);

        echo json_encode(['code' => 9, 'msg' => 'DB Error (update)', 'serviceNowTime' => $serviceTime]);

        exit;

    }

    $updateStmt->bind_param("di", $newBalance, $user_id);

    $updateStmt->execute();

    $updateStmt->close();

    logMsg("BALANCE UPDATED | user=$user_id | Rs$currentBalance -> Rs$newBalance");

    /* --- GGR --- */

    $loss = $bet_amount - $win_amount;

    $ggrAmount = 0;

    if ($loss > 0) {

        $ggrAmount = round($loss, 2);

        logMsg("PLAYER LOSS | Rs$loss (GGR handled by panel)");

    } else {

        logMsg("PLAYER WIN | +Rs" . abs($loss));

    }

    /* --- Log Bet --- */

    $insertStmt = $conn->prepare("

        INSERT INTO game_bet_logs 

        (balakedara, serial_number, game_uid, game_round, game_name, bet_amount, win_amount, 

         balance_before, balance_after, currency, ggr_amount, created_at)

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())

    ");

    if (!$insertStmt) {

        logMsg("PREPARE ERROR (insert bet): " . $conn->error);

    } else {

        $insertStmt->bind_param(

            "issssddddsd",

            $user_id, $serial_number, $game_uid, $game_round, $game_name,

            $bet_amount, $win_amount, $currentBalance, $newBalance, $currency, $ggrAmount

        );

        if (!$insertStmt->execute()) {

            logMsg("INSERT ERROR | " . $insertStmt->error);

        } else {

            logMsg("BET LOGGED | user=$user_id | game=$game_name | bet=Rs$bet_amount | win=Rs$win_amount | balance=Rs$newBalance");

        }

        $insertStmt->close();

    }

    /* --- Response --- */

    echo json_encode([

        'code'    => 0,

        'msg'     => 'OK',

        'balance' => $newBalance,

        'data'    => [

            'user_id'        => $user_id,

            'game'           => $game_name,

            'bet'            => $bet_amount,

            'win'            => $win_amount,

            'balance_before' => $currentBalance,

            'balance_after'  => $newBalance,

            'loss'           => max(0, $loss),

            'currency'       => $currency

        ],

        'serviceNowTime' => $serviceTime

    ]);

    exit;

}

/* ================= HELPERS ================= */

function getBalance($conn, $user_id) {

    $stmt = $conn->prepare("SELECT motta FROM shonu_kaichila WHERE balakedara = ?");

    if (!$stmt) { return null; }

    $stmt->bind_param("i", $user_id);

    $stmt->execute();

    $res = $stmt->get_result();

    if (!$res || $res->num_rows == 0) {

        $stmt->close();

        return null;

    }

    $balance = round(floatval($res->fetch_assoc()['motta']), 2);

    $stmt->close();

    return $balance;

}

function ensureTable($conn) {

    static $done = false;

    if ($done) return;

    $done = true;

    $conn->query("

        CREATE TABLE IF NOT EXISTS game_bet_logs (

            id INT AUTO_INCREMENT PRIMARY KEY,

            balakedara INT NOT NULL COMMENT 'User ID',

            serial_number VARCHAR(100) NOT NULL,

            game_uid VARCHAR(100) DEFAULT '',

            game_round VARCHAR(100) DEFAULT '',

            game_name VARCHAR(255) DEFAULT '',

            bet_amount DECIMAL(15,2) DEFAULT 0,

            win_amount DECIMAL(15,2) DEFAULT 0,

            balance_before DECIMAL(15,2) DEFAULT 0,

            balance_after DECIMAL(15,2) DEFAULT 0,

            currency VARCHAR(10) DEFAULT 'INR',

            ggr_amount DECIMAL(15,2) DEFAULT 0,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            INDEX idx_user (balakedara),

            INDEX idx_serial (serial_number),

            INDEX idx_round (game_round),

            INDEX idx_created (created_at)

        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

    ");

    $cols = ['currency', 'ggr_amount', 'game_name', 'balance_before', 'balance_after'];

    foreach ($cols as $col) {

        $check = $conn->query("SHOW COLUMNS FROM game_bet_logs LIKE '$col'");

        if ($check && $check->num_rows == 0) {

            $type = ($col === 'game_name') ? 'VARCHAR(255) DEFAULT \'\'' :

                    (($col === 'currency') ? 'VARCHAR(10) DEFAULT \'INR\'' : 'DECIMAL(15,2) DEFAULT 0');

            $conn->query("ALTER TABLE game_bet_logs ADD COLUMN $col $type");

        }

    }

}

?>
