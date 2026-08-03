<?php
/**
 * callback.php — Hyper Softs seamless wallet callback (partner server).
 * Handles: GetBalance | PlaceBet (debit) | WinLoss (credit)
 * Legacy aliases kept: GetUserInfo | DeductBalance | AddBalance | UpdateBetStatus
 *
 * Security: HMAC-SHA256 of the RAW body in X-Signature (secret = HYPER_CB_SECRET)
 * Idempotency: unique `reference` in hyper_wallet_log
 */

require_once __DIR__ . '/conn.php';   // must set $conn (mysqli)

/* ---------------- CONFIG ---------------- */
if (!defined('HYPER_CB_SECRET')) {
    define('HYPER_CB_SECRET', '03911a6b7f56837f0fcf81d669ed5a732dac77494addbb159b48097e148bcd3b');
}
if (!defined('HYPER_VERIFY_SIGNATURE')) define('HYPER_VERIFY_SIGNATURE', true);
if (!defined('HYPER_DEBUG_FILES'))      define('HYPER_DEBUG_FILES', false);
if (!defined('HYPER_RESULT_BASE'))      define('HYPER_RESULT_BASE', 'https://sass.hyperapi.in/api/public/proxy');
if (!defined('HYPER_DATA_KEY'))         define('HYPER_DATA_KEY', 'HAPI_CC12143062B1ABF6B4589D63C498BE89839D1FA1');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Signature, X-Hyper-Timestamp');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(200); exit; }

function out(array $payload, int $code = 200) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}
function dbg($msg) { error_log('[hyper-cb] ' . $msg); }

/* ---------------- INPUT ---------------- */
$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data) || !$data) { $data = $_POST ?: $_GET; }

$userId       = trim((string)($data['user_id'] ?? ''));
$callbackType = (string)($data['callback_type'] ?? $data['type'] ?? 'GetBalance');
$amount       = isset($data['amount']) && $data['amount'] !== '' ? floatval($data['amount']) : null;
$reference    = (string)($data['reference'] ?? '');
$betDetails   = $data['bet_details'] ?? null;
$winDetails   = $data['win_details'] ?? null;
$domainName   = (string)($data['domain_name'] ?? 'unknown');

/* normalise type: our platform sends GetBalance / PlaceBet / WinLoss */
$map = [
    'getbalance'      => 'GetBalance',
    'getuserinfo'     => 'GetUserInfo',
    'placebet'        => 'PlaceBet',
    'deductbalance'   => 'PlaceBet',
    'winloss'         => 'WinLoss',
    'addbalance'      => 'WinLoss',
    'updatebetstatus' => 'UpdateBetStatus',
];
$callbackType = $map[strtolower($callbackType)] ?? $callbackType;

if (HYPER_DEBUG_FILES) {
    $dir = __DIR__ . '/callback_logs';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    @file_put_contents($dir . '/cb_' . date('Ymd_His') . '_' . uniqid() . '.json', json_encode([
        'time' => date('c'), 'type' => $callbackType, 'raw' => $raw,
        'headers' => function_exists('getallheaders') ? getallheaders() : [],
    ], JSON_PRETTY_PRINT));
}

/* ---------------- SIGNATURE ---------------- */
if (HYPER_VERIFY_SIGNATURE) {
    $sig = $_SERVER['HTTP_X_SIGNATURE'] ?? $_SERVER['HTTP_X_HYPER_SIGNATURE'] ?? '';
    $expected = hash_hmac('sha256', $raw, HYPER_CB_SECRET);
    if (!$sig || !hash_equals($expected, strtolower(trim($sig)))) {
        dbg("signature mismatch (type=$callbackType)");
        out(['status' => 'error', 'code' => 401, 'message' => 'Invalid signature'], 401);
    }
}

if ($userId === '') out(['status' => 'error', 'code' => 400, 'message' => 'Missing user_id'], 400);
if (!$conn)         out(['status' => 'error', 'code' => 500, 'message' => 'Database connection failed'], 500);
$conn->set_charset('utf8mb4');

/* ---------------- USER + BALANCE ---------------- */
$uid = intval($userId);
$st = $conn->prepare("SELECT id FROM shonu_subjects WHERE id = ? LIMIT 1");
$st->bind_param('i', $uid); $st->execute();
if ($st->get_result()->num_rows === 0) { $st->close(); out(['status' => 'error', 'code' => 404, 'message' => 'User not found'], 404); }
$st->close();

$st = $conn->prepare("SELECT balance FROM argame_balances WHERE user_id = ? LIMIT 1");
$st->bind_param('i', $uid); $st->execute();
$rs = $st->get_result();
if ($rs->num_rows === 0) {
    $st->close();
    $ins = $conn->prepare("INSERT INTO argame_balances (user_id, balance) VALUES (?, 0.00)");
    $ins->bind_param('i', $uid); $ins->execute(); $ins->close();
    $balance = 0.00;
} else {
    $balance = floatval($rs->fetch_assoc()['balance']);
    $st->close();
}

/* ---------------- IDEMPOTENCY ---------------- */
function already_done($conn, $reference) {
    if ($reference === '') return null;
    $st = $conn->prepare("SELECT new_balance FROM hyper_wallet_log WHERE reference = ? LIMIT 1");
    $st->bind_param('s', $reference); $st->execute();
    $rs = $st->get_result(); $row = $rs->fetch_assoc(); $st->close();
    return $row ? floatval($row['new_balance']) : null;
}
function wallet_log($conn, $uid, $type, $amount, $newBalance, $reference, $raw) {
    $st = $conn->prepare("INSERT IGNORE INTO hyper_wallet_log
        (user_id, callback_type, amount, new_balance, reference, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $u = (string)$uid; $ref = $reference !== '' ? $reference : null;
    $st->bind_param('ssddss', $u, $type, $amount, $newBalance, $ref, $raw);
    $st->execute(); $st->close();
}

/* ---------------- HANDLERS ---------------- */
if ($callbackType === 'GetBalance') {
    out(['status' => 'success', 'code' => 0, 'user_id' => $uid, 'balance' => round($balance, 2), 'new_balance' => round($balance, 2)]);
}

if ($callbackType === 'GetUserInfo') {
    out(['status' => 'success', 'code' => 0, 'user_id' => $uid, 'balance' => round($balance, 2)]);
}

if ($callbackType === 'PlaceBet') {
    if ($amount === null || $amount <= 0) out(['status' => 'error', 'code' => 400, 'message' => 'Invalid amount'], 400);

    $done = already_done($conn, $reference);
    if ($done !== null) out(['status' => 'success', 'code' => 0, 'duplicate' => true, 'user_id' => $uid, 'new_balance' => round($done, 2)]);

    // atomic debit — never goes negative
    $st = $conn->prepare("UPDATE argame_balances SET balance = balance - ? WHERE user_id = ? AND balance >= ?");
    $st->bind_param('did', $amount, $uid, $amount);
    $st->execute(); $ok = $st->affected_rows > 0; $st->close();

    if (!$ok) out(['status' => 'error', 'code' => 402, 'message' => 'Insufficient balance', 'balance' => round($balance, 2)], 402);

    $newBalance = $balance - $amount;
    if ($betDetails) storeBetDetails($conn, $uid, $betDetails, 'bet_placed');
    wallet_log($conn, $uid, 'PlaceBet', -$amount, $newBalance, $reference, $raw);
    logCallbackTransaction($conn, $uid, 'PlaceBet', $betDetails, null, $amount, $balance, $newBalance, 'success');

    out(['status' => 'success', 'code' => 0, 'user_id' => $uid, 'amount_deducted' => $amount,
         'old_balance' => round($balance, 2), 'balance' => round($newBalance, 2), 'new_balance' => round($newBalance, 2)]);
}

if ($callbackType === 'WinLoss') {
    if ($amount === null) out(['status' => 'error', 'code' => 400, 'message' => 'Missing amount'], 400);

    $done = already_done($conn, $reference);
    if ($done !== null) out(['status' => 'success', 'code' => 0, 'duplicate' => true, 'user_id' => $uid, 'new_balance' => round($done, 2)]);

    if ($amount > 0) {
        $st = $conn->prepare("UPDATE argame_balances SET balance = balance + ? WHERE user_id = ?");
        $st->bind_param('di', $amount, $uid);
        $st->execute(); $st->close();
    }
    $newBalance = $balance + max(0, $amount);

    if ($winDetails) {
        storeWinDetails($conn, $uid, $winDetails);
        if (!empty($winDetails['bet_status_updates']) && is_array($winDetails['bet_status_updates'])) {
            foreach ($winDetails['bet_status_updates'] as $bu) {
                $orderNo = $bu['order_no'] ?? null;
                if ($orderNo) updateBetStatusByOrderNumber($conn, $uid, $orderNo, $bu['status'] ?? 'lost', floatval($bu['win_amount'] ?? 0));
            }
        }
    }
    wallet_log($conn, $uid, 'WinLoss', $amount, $newBalance, $reference, $raw);
    logCallbackTransaction($conn, $uid, 'WinLoss', null, $winDetails, $amount, $balance, $newBalance, 'success');

    out(['status' => 'success', 'code' => 0, 'user_id' => $uid, 'amount_added' => $amount,
         'old_balance' => round($balance, 2), 'balance' => round($newBalance, 2), 'new_balance' => round($newBalance, 2)]);
}

if ($callbackType === 'UpdateBetStatus') {
    if (!$winDetails) out(['status' => 'error', 'code' => 400, 'message' => 'Missing win_details'], 400);
    $ok = updateBetStatusFromWinDetails($conn, $uid, $winDetails);
    logCallbackTransaction($conn, $uid, 'UpdateBetStatus', null, $winDetails, 0, $balance, $balance, $ok ? 'success' : 'failed');
    out(['status' => $ok ? 'success' : 'error', 'code' => $ok ? 0 : 500, 'user_id' => $uid, 'balance' => round($balance, 2)], $ok ? 200 : 500);
}

out(['status' => 'error', 'code' => 400, 'message' => "Unknown callback_type '$callbackType'"], 400);

/* ================= HELPERS ================= */

function getBetTableName($gameCode) {
    $g = strtolower((string)$gameCode);
    if (strpos($g, 'videowingo') !== false) return 'video_wingo_saas_bets';
    if (strpos($g, 'trxwingo') !== false)   return 'trx_wingo_saas_bets';
    if (strpos($g, 'wingo') !== false)      return 'wingo_saas_bets';
    if (strpos($g, 'k3') !== false)         return 'k3_saas_bets';
    if (strpos($g, 'd5') !== false)         return 'd5_saas_bets';
    if (strpos($g, 'motorace') !== false)   return 'moto_race_saas_bets';
    return 'wingo_saas_bets';
}

function generateOrderNumber($gameCode) {
    $p = 'CB';
    $g = strtolower((string)$gameCode);
    if (strpos($g, 'videowingo') !== false) $p = 'VW';
    elseif (strpos($g, 'trxwingo') !== false) $p = 'TW';
    elseif (strpos($g, 'wingo') !== false) $p = 'WG';
    elseif (strpos($g, 'k3') !== false) $p = 'K3';
    elseif (strpos($g, 'd5') !== false) $p = 'D5';
    elseif (strpos($g, 'motorace') !== false) $p = 'MR';
    return $p . date('YmdHis') . mt_rand(1000, 9999);
}

function storeBetDetails($conn, $userId, $betDetails, $action) {
    if (!is_array($betDetails)) return false;
    $gameCode  = $betDetails['game_code'] ?? '';
    $tableName = getBetTableName($gameCode);
    $chk = $conn->query("SHOW TABLES LIKE '$tableName'");
    if (!$chk || $chk->num_rows === 0) { dbg("table $tableName missing"); return false; }

    $userId      = intval($userId);
    $issueNumber = (string)($betDetails['issue_number'] ?? '');
    $betContent  = (string)($betDetails['bet_content'] ?? '');
    $amount      = floatval($betDetails['amount'] ?? 0);
    $betMultiple = intval($betDetails['bet_multiple'] ?? 1);
    $totalAmount = floatval($betDetails['total_amount'] ?? $amount);
    $playTypeId  = (string)($betDetails['play_type_id'] ?? '');
    $playType    = (string)($betDetails['play_type'] ?? '');
    $playBet     = (string)($betDetails['play_bet'] ?? '');
    $playRate    = floatval($betDetails['play_rate'] ?? 0);
    $orderNo     = (string)($betDetails['order_no'] ?? '');
    if ($orderNo === '') $orderNo = generateOrderNumber($gameCode);
    $commission  = floatval($betDetails['commission'] ?? 0);
    $netAmount   = floatval($betDetails['net_amount'] ?? $totalAmount);

    $st = $conn->prepare("INSERT INTO {$tableName}
        (user_id, game_code, issue_number, bet_content, amount, bet_multiple, total_amount,
         play_type_id, play_type, play_bet, play_rate, order_no, status, commission, net_amount, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?,NOW())");
    if (!$st) { dbg('prepare failed: ' . $conn->error); return false; }
    $st->bind_param('isssdidsssdsdd',
        $userId, $gameCode, $issueNumber, $betContent, $amount, $betMultiple, $totalAmount,
        $playTypeId, $playType, $playBet, $playRate, $orderNo, $commission, $netAmount);
    $ok = $st->execute();
    if (!$ok) dbg('bet insert failed: ' . $st->error);
    $st->close();
    return $ok;
}

function findGameCodeFromIssue($conn, $userId, $issueNumber) {
    foreach (['wingo_saas_bets','k3_saas_bets','d5_saas_bets','moto_race_saas_bets','trx_wingo_saas_bets','video_wingo_saas_bets'] as $t) {
        $chk = $conn->query("SHOW TABLES LIKE '$t'");
        if (!$chk || $chk->num_rows === 0) continue;
        $st = $conn->prepare("SELECT game_code FROM {$t} WHERE user_id = ? AND issue_number = ? LIMIT 1");
        if (!$st) continue;
        $st->bind_param('is', $userId, $issueNumber); $st->execute();
        $row = $st->get_result()->fetch_assoc(); $st->close();
        if ($row) return $row['game_code'];
    }
    return '';
}

/** Results now come from OUR proxy (sass.hyperapi.in), not rivestro. */
function fetchWinningResultsFromAPI($gameCode, $issueNumber) {
    if (!preg_match('/^(wingo|k3|d5|motorace)[_-]?(\d+[sm])$/i', str_replace(' ', '', (string)$gameCode), $m)) {
        dbg("unsupported game for results: $gameCode"); return null;
    }
    $category = strtolower($m[1]);
    $game     = strtolower($m[2]);
    $url = HYPER_RESULT_BASE . '?api_key=' . urlencode(HYPER_DATA_KEY)
         . '&category=' . $category . '&game=' . $game . '&type=history&ts=' . (time() * 1000);

    for ($i = 0; $i < 3; $i++) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 6,
            CURLOPT_HTTPHEADER     => ['Accept: application/json', 'User-Agent: Hyper-Callback/1.0'],
        ]);
        $res  = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code !== 200 || !$res) { usleep(300000); continue; }
        $json = json_decode($res, true);
        $list = $json['data']['list'] ?? ($json['list'] ?? []);
        foreach ($list as $r) {
            if ((string)($r['issueNumber'] ?? '') === (string)$issueNumber) {
                $num = (string)($r['number'] ?? '');
                return [
                    'game_code'         => $gameCode,
                    'issue_number'      => $issueNumber,
                    'winning_number'    => $num,
                    'winning_color'     => $r['color'] ?? null,
                    'winning_big_small' => (intval($num) >= 5) ? 'big' : 'small',
                    'premium'           => $r['premium'] ?? null,
                    'sum'               => $r['sum'] ?? null,
                ];
            }
        }
        usleep(300000);
    }
    dbg("issue $issueNumber not found for $gameCode");
    return null;
}

function updateWinDetailsWithAPI($conn, $userId, $issueNumber, $w) {
    $st = $conn->prepare("UPDATE lottery_win_details
        SET game_code = ?, winning_number = ?, winning_color = ?, winning_big_small = ?, premium = ?, sum = ?, updated_at = NOW()
        WHERE user_id = ? AND issue_number = ?");
    if (!$st) return false;
    $g = (string)($w['game_code'] ?? ''); $n = (string)($w['winning_number'] ?? '');
    $c = (string)($w['winning_color'] ?? ''); $b = (string)($w['winning_big_small'] ?? '');
    $p = (string)($w['premium'] ?? ''); $s = (string)($w['sum'] ?? '');
    $st->bind_param('ssssssis', $g, $n, $c, $b, $p, $s, $userId, $issueNumber);
    $ok = $st->execute(); $st->close();
    return $ok;
}

function storeWinDetails($conn, $userId, $winDetails) {
    if (!is_array($winDetails)) return false;
    $gameCode    = (string)($winDetails['game_code'] ?? '');
    $issueNumber = (string)($winDetails['issue_number'] ?? '');
    if ($gameCode === '' && $issueNumber !== '') {
        $gameCode = findGameCodeFromIssue($conn, intval($userId), $issueNumber);
        $winDetails['game_code'] = $gameCode;
    }

    $st = $conn->prepare("INSERT INTO lottery_win_details
        (user_id, game_code, issue_number, winning_number, winning_color, winning_big_small,
         premium, sum, win_amount, total_bets, total_bet_amount, total_win_amount, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW())");
    if (!$st) { dbg('win prepare failed: ' . $conn->error); return false; }

    $uid = intval($userId);
    $wn  = (string)($winDetails['winning_number'] ?? '');
    $wc  = (string)($winDetails['winning_color'] ?? '');
    $wb  = (string)($winDetails['winning_big_small'] ?? '');
    $pr  = (string)($winDetails['premium'] ?? '');
    $sm  = (string)($winDetails['sum'] ?? '');
    $wa  = floatval($winDetails['win_amount'] ?? 0);
    $tb  = intval($winDetails['total_bets'] ?? 0);
    $tba = floatval($winDetails['total_bet_amount'] ?? 0);
    $twa = floatval($winDetails['total_win_amount'] ?? 0);
    $st->bind_param('issssssidddd', $uid, $gameCode, $issueNumber, $wn, $wc, $wb, $pr, $sm, $wa, $tb, $tba, $twa);
    $ok = $st->execute(); $st->close();
    if (!$ok) { dbg('win insert failed'); return false; }

    if ($wn === '' && $wc === '' && $wb === '') {
        $api = fetchWinningResultsFromAPI($gameCode, $issueNumber);
        if ($api) {
            updateWinDetailsWithAPI($conn, $uid, $issueNumber, $api);
            updateBetStatuses($conn, $uid, $gameCode, $issueNumber, $api);
        } else {
            markAllBetsAsLost($conn, $uid, $gameCode, $issueNumber);
        }
    } else {
        updateBetStatuses($conn, $uid, $gameCode, $issueNumber, $winDetails);
    }
    return true;
}

function markAllBetsAsLost($conn, $userId, $gameCode, $issueNumber) {
    $t = getBetTableName($gameCode);
    $st = $conn->prepare("UPDATE {$t} SET status = 'lost', win_amount = 0, updated_at = NOW()
        WHERE user_id = ? AND issue_number = ? AND status = 'pending'");
    if (!$st) return false;
    $st->bind_param('is', $userId, $issueNumber);
    $st->execute(); $n = $st->affected_rows; $st->close();
    dbg("marked $n bets lost ($issueNumber)");
    return true;
}

function updateBetStatuses($conn, $userId, $gameCode, $issueNumber, $winDetails) {
    $t = getBetTableName($gameCode);
    $st = $conn->prepare("SELECT id, bet_content, play_type, play_bet, play_rate, total_amount, order_no
        FROM {$t} WHERE user_id = ? AND issue_number = ? AND status = 'pending'");
    if (!$st) return false;
    $st->bind_param('is', $userId, $issueNumber); $st->execute();
    $rs = $st->get_result(); $rows = [];
    while ($r = $rs->fetch_assoc()) $rows[] = $r;
    $st->close();

    $count = 0;
    foreach ($rows as $r) {
        $isWin     = checkBetWin($r['bet_content'], $r['play_type'], $r['play_bet'], $winDetails);
        $winAmount = $isWin ? floatval($r['total_amount']) * floatval($r['play_rate']) : 0;
        $status    = $isWin ? 'won' : 'lost';
        $up = $conn->prepare("UPDATE {$t} SET status = ?, win_amount = ?, updated_at = NOW() WHERE id = ?");
        $up->bind_param('sdi', $status, $winAmount, $r['id']);
        if ($up->execute()) $count++;
        $up->close();
    }
    dbg("updateBetStatuses: $count bets updated for $issueNumber");
    return $count > 0;
}

function checkBetWin($betContent, $playType, $playBet, $w) {
    if (!is_array($w)) return false;
    $num = (string)($w['winning_number'] ?? '');
    $col = (string)($w['winning_color'] ?? '');
    $bs  = (string)($w['winning_big_small'] ?? '');
    $sum = (string)($w['sum'] ?? '');
    $pre = (string)($w['premium'] ?? '');
    $pt  = strtolower((string)$playType);
    $pb  = strtolower((string)$playBet);

    if ($pt === 'bigsmall')  return $pb !== '' && $pb === strtolower($bs);
    if ($pt === 'color')     return $pb !== '' && strpos(strtolower($col), $pb) !== false;
    if ($pt === 'number' || $pt === 'num') return $pb !== '' && $pb === strtolower($num);
    if ($pt === 'sum')       return $pb !== '' && $pb === strtolower($sum);
    if ($pt === 'premium')   return $pb !== '' && $pb === strtolower($pre);
    return false;
}

function updateBetStatusFromWinDetails($conn, $userId, $winDetails) {
    return storeWinDetails($conn, $userId, $winDetails);
}

function updateBetStatusByOrderNumber($conn, $userId, $orderNo, $status, $winAmount = 0) {
    foreach (['wingo_saas_bets','k3_saas_bets','d5_saas_bets','video_wingo_saas_bets','moto_race_saas_bets','trx_wingo_saas_bets'] as $t) {
        $chk = $conn->query("SHOW TABLES LIKE '$t'");
        if (!$chk || $chk->num_rows === 0) continue;
        $st = $conn->prepare("UPDATE {$t} SET status = ?, win_amount = ?, updated_at = NOW() WHERE user_id = ? AND order_no = ?");
        if (!$st) continue;
        $st->bind_param('sdis', $status, $winAmount, $userId, $orderNo);
        $st->execute(); $n = $st->affected_rows; $st->close();
        if ($n > 0) { dbg("order $orderNo -> $status in $t"); return true; }
    }
    dbg("order $orderNo not found");
    return false;
}

function logCallbackTransaction($conn, $userId, $type, $betDetails, $winDetails, $amount, $oldBalance, $newBalance, $status) {
    $chk = $conn->query("SHOW TABLES LIKE 'callback_transaction_logs'");
    if (!$chk || $chk->num_rows === 0) return;
    $st = $conn->prepare("INSERT INTO callback_transaction_logs
        (user_id, callback_type, game_code, issue_number, amount, old_balance, new_balance,
         bet_details, win_details, response_data, status, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())");
    if (!$st) return;
    $src = is_array($betDetails) ? $betDetails : (is_array($winDetails) ? $winDetails : []);
    $gameCode = (string)($src['game_code'] ?? '');
    $issue    = (string)($src['issue_number'] ?? '');
    $bj = $betDetails ? json_encode($betDetails) : null;
    $wj = $winDetails ? json_encode($winDetails) : null;
    $rd = json_encode(['old_balance' => $oldBalance, 'new_balance' => $newBalance]);
    $amt = floatval($amount);
    $st->bind_param('isssddsssss', $userId, $type, $gameCode, $issue, $amt, $oldBalance, $newBalance, $bj, $wj, $rd, $status);
    $st->execute(); $st->close();
}
