<?php
/**
 * Login_2.php — partner login (shonu_subjects schema) + Hyper Softs game token.
 *
 * Fixes vs old version:
 *  - akshinak no longer overwritten with the JWT after storing the game token
 *    (that was killing the game session). One single UPDATE now.
 *  - lotteryLoginUrl points to OUR domain via hyper_login_url() — never
 *    api.hgzy.click, and never the JWT as a fallback game token.
 *  - safe handling when the query fails / user row missing.
 *  - prepared statements for the login lookup.
 */

include "../../conn.php";
include "../../functions2.php";

define("HYPER_CONFIG_ONLY", true);
require_once __DIR__ . "/../../callback.php";   // config + hyper_issue_token() + hyper_login_url()

header('Content-Type: application/json; charset=utf-8');
header('Strict-Transport-Security: max-age=31536000');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, AR-REAL-IP');
header('Access-Control-Allow-Credentials: true');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
header('Access-Control-Allow-Origin: ' . $origin);
header('Vary: Origin');

date_default_timezone_set("Asia/Kolkata");
$shnunc = date("Y-m-d H:i:s");

$res = [
    'code'           => 11,
    'msg'            => 'Method not allowed',
    'msgCode'        => 12,
    'serviceNowTime' => $shnunc,
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    http_response_code(405);
    echo json_encode($res);
    exit;
}

$shonubody = file_get_contents("php://input");
$shonupost = json_decode($shonubody, true) ?: $_POST;

if (!isset($shonupost['language'], $shonupost['logintype'], $shonupost['phonetype'], $shonupost['pwd'], $shonupost['username'])) {
    $res['code'] = 1; $res['msg'] = 'Bad request'; $res['msgCode'] = 12;
    echo json_encode($res);
    exit;
}

$logintype = (string) $shonupost['logintype'];
$pwd       = (string) $shonupost['pwd'];
$username  = trim((string) $shonupost['username']);

// ===== REMOVE COUNTRY CODE =====
if (substr($username, 0, 2) === "91") {
    $username = substr($username, 2);
}

// ===== FETCH USER (prepared) =====
$col = ($logintype === 'email') ? 'email' : 'mobile';
$stmt = $conn->prepare("SELECT id, mobile, password, status, ishonup, codechorkamukala
                        FROM shonu_subjects WHERE $col = ? LIMIT 1");
$stmt->bind_param('s', $username);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row) {
    $res['code'] = 1; $res['msg'] = 'User not exists'; $res['msgCode'] = 101;
    echo json_encode($res);
    exit;
}

// ===== PASSWORD =====
if (!hash_equals((string) $row['password'], md5($pwd))) {
    $up = $conn->prepare("UPDATE shonu_subjects SET shonupwderr = shonupwderr + 1 WHERE id = ?");
    $up->bind_param('i', $row['id']); $up->execute(); $up->close();

    $q = $conn->prepare("SELECT shonupwderr FROM shonu_subjects WHERE id = ?");
    $q->bind_param('i', $row['id']); $q->execute();
    $pwderrvalue = (int) ($q->get_result()->fetch_assoc()['shonupwderr'] ?? 0);
    $q->close();

    $res['data'] = [
        'tokenHeader'          => 'Bearer ',
        'token'                => null,
        'expiresIn'            => 0,
        'refreshToken'         => null,
        'passwordErrorNum'     => $pwderrvalue,
        'passwordErrorMaxNum'  => 30,
    ];
    $res['code'] = 1; $res['msg'] = 'Password does not correct'; $res['msgCode'] = 117;
    echo json_encode($res);
    exit;
}

if ((int) $row['status'] !== 1) {
    $res['code'] = 1; $res['msg'] = 'User suspended'; $res['msgCode'] = 116;
    echo json_encode($res);
    exit;
}

$userId = (int) $row['id'];
$mobile = (string) $row['mobile'];

// ===== DEMO ACCOUNT CHECK =====
$isDemoAccount = false;
$d = $conn->prepare("SELECT COUNT(*) AS demo_count FROM demo
                     WHERE balakedara = ? AND (sthiti IS NULL OR sthiti = '1')");
$d->bind_param('i', $userId);
$d->execute();
$isDemoAccount = ((int) ($d->get_result()->fetch_assoc()['demo_count'] ?? 0)) > 0;
$d->close();

// ===== APP JWT =====
$data = [];
$data['expiresIn'] = time() + 86400;

$header  = ['alg' => 'HS256', 'typ' => 'JWT'];
$payload = [
    'id'                => $userId,
    'mobile'            => $mobile,
    'status'            => (int) $row['status'],
    'expire'            => $data['expiresIn'],
    'ishonup'           => $row['ishonup'],
    'codechorkamukala'  => $row['codechorkamukala'],
    'is_demo'           => $isDemoAccount ? 1 : 0,
];

$data['tokenHeader']          = 'Bearer ';
$data['token']                = generate_jwt($header, $payload);
$data['refreshToken']         = generate_jwt($header, ['id' => $userId, 'expire' => $data['expiresIn']]);
$data['passwordErrorNum']     = 0;
$data['passwordErrorMaxNum']  = 30;

// ===== HYPER SOFTS: single-use game token =====
$gameToken = hyper_issue_token($userId, null, HYPER_TOKEN_TTL);
if ($gameToken) {
    $data['gameToken']       = $gameToken;
    $data['gameTokenTtl']    = HYPER_TOKEN_TTL;
    // Player entry point on OUR domain — no api_key / secret in the browser.
    $data['lotteryLoginUrl'] = hyper_login_url($gameToken);
} else {
    // No usable game session: do NOT hand the JWT to the game server.
    error_log("Login_2: hyper_issue_token failed for user $userId");
    $data['gameToken']       = null;
    $data['lotteryLoginUrl'] = null;
    $data['gameError']       = 'Game service unavailable, try again';
}

// ===== SINGLE LOGIN UPDATE (game token wins, JWT never overwrites it) =====
$ipaddress  = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$session    = $gameToken ?: $data['token'];

$u = $conn->prepare("UPDATE shonu_subjects
                     SET shonupwderr = 0, ishonup = ?, shonullgnt = ?, akshinak = ?, tnegaresunohs = ?
                     WHERE id = ?");
$u->bind_param('ssssi', $ipaddress, $shnunc, $session, $user_agent, $userId);
$u->execute();
$u->close();

// ===== LOGIN NOTIFICATION =====
$n = $conn->prepare("INSERT INTO notification (state, title, user_id, created_at) VALUES (0, 'Login Alert', ?, ?)");
$n->bind_param('is', $userId, $shnunc);
$n->execute();
$n->close();

$res['data']    = $data;
$res['code']    = 0;
$res['msg']     = 'Succeed';
$res['msgCode'] = 0;

echo json_encode($res, JSON_UNESCAPED_SLASHES);
