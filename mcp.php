<?php
declare(strict_types=1);

require_once __DIR__ . '/src/mcp/mcp.php';

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function mcp_reply(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function mcp_error($id, int $code, string $message, int $status = 200): void
{
    mcp_reply(['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => $code, 'message' => $message]], $status);
}

// host.php อาจกำหนด owner จาก session หน้าเว็บ จึงยังไม่เปิด MCP ในโหมดฝังกับ LMS
if (defined('HOST_EMBEDDED') || store_backend() !== 'file') {
    mcp_error(null, -32000, 'MCP ยังไม่รองรับโหมดฝังใน LMS', 403);
}
if (!mcp_authorized()) {
    mcp_error(null, -32000, 'MCP ไม่ได้เปิดใช้งานหรือ URL ไม่ถูกต้อง', 401);
}
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Allow: POST');
    http_response_code(405);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    mcp_error(null, -32600, 'Method not allowed', 405);
}
$raw = file_get_contents('php://input', false, null, 0, 1048577);
if ($raw === false || strlen($raw) > 1048576) {
    mcp_error(null, -32600, 'Request too large', 413);
}
$request = json_decode($raw, true);
if (!is_array($request) || (isset($request[0]) && !isset($request['jsonrpc'])) || ($request['jsonrpc'] ?? null) !== '2.0') {
    mcp_error(null, -32600, 'Invalid JSON-RPC request', 400);
}
$id = $request['id'] ?? null;
$method = (string) ($request['method'] ?? '');
if ($method === 'notifications/initialized' || str_starts_with($method, 'notifications/')) {
    http_response_code(202);
    exit;
}
if ($id === null || !(is_string($id) || is_int($id))) {
    mcp_error(null, -32600, 'Missing request ID', 400);
}
$params = is_array($request['params'] ?? null) ? $request['params'] : [];
try {
    if ($method === 'initialize') {
        $version = (string) ($params['protocolVersion'] ?? '2025-03-26');
        mcp_reply(['jsonrpc' => '2.0', 'id' => $id, 'result' => [
            'protocolVersion' => $version,
            'capabilities' => ['tools' => ['listChanged' => false]],
            'serverInfo' => ['name' => 'AI Teacher Exam Drafts', 'version' => '1.0.0'],
            'instructions' => 'ช่วยครูสร้างข้อสอบภาษาไทยใน Chat ใช้ get_exam_indicators เมื่อต้องอ้างตัวชี้วัด ให้ครูตรวจโจทย์และเฉลยก่อนใช้ save_exam_draft เครื่องมือนี้บันทึกเป็นร่างเท่านั้น ห้ามอ้างว่าเผยแพร่หรือมอบหมายให้นักเรียนแล้ว',
        ]]);
    }
    if ($method === 'ping') {
        mcp_reply(['jsonrpc' => '2.0', 'id' => $id, 'result' => new stdClass()]);
    }
    if ($method === 'tools/list') {
        mcp_reply(['jsonrpc' => '2.0', 'id' => $id, 'result' => ['tools' => mcp_tool_definitions()]]);
    }
    if ($method === 'tools/call') {
        $name = (string) ($params['name'] ?? '');
        $args = is_array($params['arguments'] ?? null) ? $params['arguments'] : [];
        $base = (($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTPS'] ?? '') === '1' ? 'https' : 'http')
            . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/mcp.php'), '/.');
        $result = mcp_tool_call($name, $args, $base);
        mcp_reply(['jsonrpc' => '2.0', 'id' => $id, 'result' => ['content' => [
            ['type' => 'text', 'text' => json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)],
        ], 'structuredContent' => $result]]);
    }
    mcp_error($id, -32601, 'Method not found');
} catch (Throwable $e) {
    $message = $e instanceof InvalidArgumentException || $e instanceof ApiException ? $e->getMessage() : 'บันทึกข้อสอบไม่สำเร็จ';
    mcp_reply(['jsonrpc' => '2.0', 'id' => $id, 'result' => ['isError' => true, 'content' => [
        ['type' => 'text', 'text' => $message],
    ]]]);
}
