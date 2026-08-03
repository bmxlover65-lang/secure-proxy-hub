<?php
/**
 * Login_2.php — partner login. After the user is authenticated we ask our
 * server for a single-use game token and send the player to OUR domain.
 */

require_once __DIR__ . '/hyper_callback.php';   // config + hyper_issue_token()
require_once __DIR__ . '/conn.php';             // your own $conn / DB (optional)

header('Content-Type: application/json; charset=utf-8');

$in       = json_decode(file_get_contents('php://input') ?: '', true) ?: $_POST;
$username = trim((string) ($in['username'] ?? ''));
$password = (string) ($in['password'] ?? '');

if ($username === '' || $password === '') {
    echo json_encode(['code' => 1, 'msg' => 'Username and password required']);
    exit;
}

try {
    $db = hyper_db();
    $st = $db->prepare("SELECT id, username, password, money FROM users WHERE username = ? LIMIT 1");
    $st->execute([$username]);
    $user = $st->fetch(PDO::FETCH_ASSOC);

    // Supports both password_hash() and legacy md5 rows.
    $ok = $user && (
        password_verify($password, $user['password']) ||
        hash_equals((string) $user['password'], md5($password))
    );
    if (!$ok) {
        echo json_encode(['code' => 1, 'msg' => 'Invalid username or password']);
        exit;
    }

    $userId = (string) $user['id'];

    /* ---- Game token from our server (single-use, short TTL) ---- */
    $gameToken = hyper_issue_token($userId, null, HYPER_TOKEN_TTL);
    if (!$gameToken) {
        echo json_encode(['code' => 1, 'msg' => 'Game service unavailable, try again']);
        exit;
    }

    $data = [
        'token'          => $gameToken,
        'user_id'        => $userId,
        'username'       => $user['username'],
        'balance'        => (float) $user['money'],
        // Player entry point on OUR domain (no api_key / secret in the browser)
        'lotteryLoginUrl'=> hyper_login_url($gameToken),
    ];

    echo json_encode(['code' => 0, 'msg' => 'success', 'data' => $data], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log('Login_2: ' . $e->getMessage());
    echo json_encode(['code' => 1, 'msg' => 'Server error']);
}
