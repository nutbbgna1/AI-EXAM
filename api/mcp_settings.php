<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/mcp/mcp.php';

try {
    $b = api_guard();
    if (defined('TA_IS_ADMIN') && !TA_IS_ADMIN) {
        json_out(['error' => 'เฉพาะผู้ดูแลระบบที่ตั้งค่า MCP ได้'], 403);
    }
    if (defined('HOST_EMBEDDED') || store_backend() !== 'file') {
        json_out(['supported' => false, 'enabled' => false,
            'message' => 'โหมดฝังใน LMS ยังไม่รองรับการเชื่อม ChatGPT MCP เพราะต้องผูกสิทธิ์กับบัญชีครูแต่ละคน']);
    }
    $action = (string) ($b['action'] ?? '');
    $c = mcp_config();
    if ($action === 'enable' || $action === 'rotate') {
        $c = ['enabled' => true, 'token' => bin2hex(random_bytes(32)), 'savedAt' => date('c')];
        store_json_put('settings', '_mcp.json', $c);
    } elseif ($action === 'disable') {
        $c = ['enabled' => false, 'token' => '', 'savedAt' => date('c')];
        store_json_put('settings', '_mcp.json', $c);
    } elseif ($action !== 'get') {
        json_out(['error' => 'action ไม่ถูกต้อง'], 400);
    }
    json_out(['supported' => true, 'enabled' => !empty($c['enabled']),
        'token' => !empty($c['enabled']) ? (string) ($c['token'] ?? '') : '']);
} catch (Throwable $e) {
    json_error($e);
}
