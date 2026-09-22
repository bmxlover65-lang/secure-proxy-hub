# API Gateway Suite

Create a complete Reseller Panel (Frontend + Backend) for my API proxy system.

### 🔹 Context

I have an API proxy in PHP that fetches data from:

https://saas.sos-hub.site/saas.php

Example endpoint:

?client_key=CLT_0B4FF415B19AF8CF&category=wingo&game=30s&type=current

It returns JSON like:

* gameCode

* intervalMinute

* state

* previous, current, next issue data

I want to build a reseller system where users can access this API using their own keys with IP whitelist security.

---

## 🔐 Backend Requirements

### 1. Admin System

* Admin login (JWT or session-based)

* Dashboard:

  * Total resellers

  * Active API keys

  * Requests count

  * Logs

### 2. Reseller Management

* Create reseller:

  * name

  * api_key (auto generate)

  * allowed_ips (comma separated OR separate table)

  * status (active / suspended)

  * rate limit (optional)

* Edit / Delete reseller

* Enable / Disable reseller

### 3. API Key System

* Each reseller gets unique API key

* API must validate:

  * API key exists

  * IP is whitelisted

  * status is active

### 4. IP Whitelist Logic

* Store multiple IPs per reseller

* Validate $_SERVER['REMOTE_ADDR']

* Block request if IP not allowed

### 5. Proxy Endpoint (Reseller API)

Create endpoint like:

/api/reseller/wingo.php

Features:

* Accept:

  * api_key

  * game (30s, 1min, etc.)

* Validate reseller

* Forward request to original API:

  

* Return JSON response

* Add optional logging

### 6. Logging System

* Store:

  * reseller_id

  * api_key

  * IP

  * endpoint

  * timestamp

* Admin can view logs

---

## 🌐 Frontend Requirements

### Tech:

*react js

### Pages:

#### 1. Admin Panel

* Login page

* Dashboard (stats cards)

* Reseller list table

* Add/Edit reseller form

* API logs viewer

#### 2. Reseller Panel

* Login using API key or credentials

* Show:

  * API Key

  * Allowed IPs

  * Usage stats

* API documentation page:

  Example:

  /api/reseller/wingo.php?api_key=XXXX&game=30s

---

## ⚡ Extra Features (Important)

* Rate limiting per API key

* Secure API (prevent abuse)

* CORS support

* Clean JSON responses

* Error handling:

  * Invalid key

  * IP not allowed

  * Suspended account

---

## 📁 Folder Structure

Provide clean structure like:

* /admin

* /api

* /config

* /includes

* /logs

* /frontend

---

## 🧠 Important Rules

* Use secure coding (prepared statements)

* Do NOT expose main client_key publicly

* Make code production-ready

* Keep code modular

---

## 🎯 Output Needed

* Full backend reactcode

* MySQL database schema

* Frontend UI code

* Example API usage

* Sample reseller data

---

Make it clean, modern UI and scalable architecture.,,,,<?php

/* ================= CORS ================= */

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Headers: *");

header("Access-Control-Allow-Methods: GET, OPTIONS");

header("Content-Type: application/json");

/* ================= OPTIONS ================= */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(204);

    exit;

}

/* ================= API URL ================= */

$url = "https://draw.ar-lottery01.com/WinGo/WinGo_30S.json?ts=" . round(microtime(true) * 1000);

/* ================= CURL ================= */

$ch = curl_init($url);

curl_setopt_array($ch, [

    CURLOPT_RETURNTRANSFER => true,

    CURLOPT_TIMEOUT => 10,

    CURLOPT_SSL_VERIFYPEER => false,

    CURLOPT_SSL_VERIFYHOST => false,

    CURLOPT_HTTPHEADER => [

        "accept: application/json",

        "user-agent: Mozilla/5.0",

        "referer: https://hgzy.click/"

    ]

]);

$response = curl_exec($ch);

$error    = curl_error($ch);

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

/* ================= ERROR ================= */

if ($error) {

    echo json_encode([

        "code" => 500,

        "msg"  => "cURL Error",

        "error"=> $error

    ]);

    exit;

}

if ($httpCode !== 200) {

    echo json_encode([

        "code" => $httpCode,

        "msg"  => "HTTP Error"

    ]);

    exit;

}

/* ================= DIRECT OUTPUT ================= */

echo $response;

?>

अशोक हमने जो file दिया ना अंदर देखा एक API URL use हो रहा है। जो file के through उसकी result ना हमें show करवा रही है। जैसे ये file use हुई है page में ना same हमें ये करेंगे हम आपको सबके structure मैं अपनी दे दूंगा। तो structure wise क्या करती है सबके एक file बनी हुई है structure wise structure। तो उस हिसाब से मेरी सब कुछ बना के मेरी बना के मुझे दे दो और हमारे admin panel पे हमें show भी होनी चाहिए। मैं अगर चाहूं check करने जाऊं health तो क्या response आ रही है तो मैं जिसका चाहूं उसका check कर सकता हूं admin panel से ही response क्या आ रही है।,,<?php

/* ================= CORS ================= */

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Headers: *");

header("Access-Control-Allow-Methods: GET, OPTIONS");

header("Content-Type: application/json; charset=utf-8");

/* ================= OPTIONS ================= */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(204);

    exit;

}

/* ================= API URL ================= */

$url = "https://draw.ar-lottery01.com/D5/D5_10M/GetHistoryIssuePage.json?ts=" . round(microtime(true) * 1000);

/* ================= CURL ================= */

$ch = curl_init();

curl_setopt_array($ch, [

    CURLOPT_URL => $url,

    CURLOPT_RETURNTRANSFER => true,

    CURLOPT_FOLLOWLOCATION => true,

    CURLOPT_TIMEOUT => 15,

    CURLOPT_CONNECTTIMEOUT => 8,

    CURLOPT_SSL_VERIFYPEER => false,

    CURLOPT_SSL_VERIFYHOST => false,

    CURLOPT_HTTPHEADER => [

        "accept: application/json",

        "user-agent: Mozilla/5.0",

        "referer: https://hgzy.click/"

    ],

]);

$response = curl_exec($ch);

$error    = curl_error($ch);

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

/* ================= ERROR ================= */

if ($response === false) {

    echo json_encode([

        "code" => 500,

        "msg" => "Fetch Error",

        "error" => $error

    ]);

    exit;

}

if ($httpCode !== 200) {

    echo json_encode([

        "code" => $httpCode,

        "msg" => "Upstream Error"

    ]);

    exit;

}

/* ================= DIRECT RESPONSE ================= */

echo $response;

?>

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://secure-proxy-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f803ea3a-fb03-4e0a-9285-97882d513aa5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
