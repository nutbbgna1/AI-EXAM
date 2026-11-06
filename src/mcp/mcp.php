<?php
declare(strict_types=1);

require_once __DIR__ . '/../planning/exam.php';

function mcp_config(): array
{
    return store_json_get('settings', '_mcp.json') ?? [];
}

function mcp_enabled(): bool
{
    $c = mcp_config();
    return !empty($c['enabled']) && is_string($c['token'] ?? null) && strlen($c['token']) === 64;
}

function mcp_authorized(): bool
{
    $c = mcp_config();
    $given = (string) ($_GET['token'] ?? '');
    return mcp_enabled() && preg_match('/^[a-f0-9]{64}$/', $given) === 1
        && hash_equals((string) $c['token'], $given);
}

function mcp_tool_definitions(): array
{
    return [
        [
            'name' => 'get_exam_indicators',
            'description' => 'Read the official curriculum indicators available for a Thai grade and subject before drafting an exam.',
            'annotations' => ['readOnlyHint' => true],
            'inputSchema' => ['type' => 'object', 'properties' => [
                'grade' => ['type' => 'string', 'description' => 'Thai grade, e.g. ป.6'],
                'subject' => ['type' => 'string', 'description' => 'Subject name as used in the school'],
            ], 'required' => ['grade', 'subject'], 'additionalProperties' => false],
        ],
        [
            'name' => 'save_exam_draft',
            'description' => 'Save a fully written Thai exam as a NEW draft in the website. First show the questions and answers to the teacher and ask them to review. This never publishes or assigns an exam. Use mc, tf, match, and written parts. Each part has score and items. The response contains a link to open the draft in the website.',
            'annotations' => ['readOnlyHint' => false, 'destructiveHint' => false, 'idempotentHint' => false],
            'inputSchema' => ['type' => 'object', 'properties' => [
                'title' => ['type' => 'string'], 'grade' => ['type' => 'string'], 'subject' => ['type' => 'string'],
                'kind' => ['type' => 'string', 'description' => 'กลางภาค, ปลายภาค, ท้ายหน่วย, etc.'],
                'school' => ['type' => 'string'], 'term' => ['type' => 'string', 'enum' => ['1', '2', '']],
                'year' => ['type' => 'string'], 'minutes' => ['type' => 'integer'],
                'parts' => ['type' => 'object', 'description' => 'Keys mc, tf, match, written. Each value is {score:number, items:array}. mc item: question, choices (exactly 4), answerIndex (0-3), explain. tf: statement, answer (boolean). match: left, right. written: question, answer, solution (array of strings). Optional item fields: level (1-4), indicator (curriculum code).',
                    'properties' => [
                        'mc' => ['$ref' => '#/$defs/part'], 'tf' => ['$ref' => '#/$defs/part'],
                        'match' => ['$ref' => '#/$defs/part'], 'written' => ['$ref' => '#/$defs/part'],
                    ], 'additionalProperties' => false],
            ], 'required' => ['title', 'grade', 'subject', 'parts'], 'additionalProperties' => false,
                '$defs' => ['part' => ['type' => 'object', 'properties' => [
                    'score' => ['type' => 'number'], 'items' => ['type' => 'array', 'items' => ['type' => 'object']],
                ], 'required' => ['score', 'items'], 'additionalProperties' => false]]],
        ],
    ];
}

function mcp_tool_call(string $name, array $args, string $baseUrl): array
{
    if ($name === 'get_exam_indicators') {
        $grade = mb_substr(trim((string) ($args['grade'] ?? '')), 0, 20);
        $subject = mb_substr(trim((string) ($args['subject'] ?? '')), 0, 80);
        if ($grade === '' || $subject === '') {
            throw new InvalidArgumentException('กรุณาระบุชั้นและวิชา');
        }
        $r = cur_indicators_for($grade, $subject);
        return ['grade' => $grade, 'subject' => $subject, 'edition' => $r['edition'] ?? '',
            'indicators' => array_map(fn($i) => ['code' => $i['code'], 'text' => $i['text']], $r['indicators'])];
    }
    if ($name !== 'save_exam_draft') {
        throw new InvalidArgumentException('ไม่พบเครื่องมือนี้');
    }
    $grade = mb_substr(trim((string) ($args['grade'] ?? '')), 0, 20);
    $subject = mb_substr(trim((string) ($args['subject'] ?? '')), 0, 80);
    if ($grade === '' || $subject === '') {
        throw new InvalidArgumentException('กรุณาระบุชั้นและวิชา');
    }
    $raw = (array) ($args['parts'] ?? []);
    $parts = exam_clean_parts($raw);
    $submitted = 0;
    foreach (EXAM_PARTS as $p) {
        $items = (array) (($raw[$p] ?? [])['items'] ?? []);
        if (count($items) > EXAM_PART_MAX[$p]) {
            throw new InvalidArgumentException('จำนวนข้อในส่วน ' . $p . ' เกินขีดจำกัด');
        }
        $submitted += count($items);
    }
    $accepted = array_sum(array_map(fn($p) => count($p['items']), $parts));
    if ($submitted === 0 || $accepted !== $submitted) {
        throw new InvalidArgumentException('ข้อสอบบางข้อไม่ครบรูปแบบ กรุณาตรวจโจทย์ ตัวเลือก และเฉลยก่อนบันทึก');
    }
    $id = date('Ymd-His') . '-' . bin2hex(random_bytes(4));
    $doc = [
        'id' => $id, 'savedAt' => date('c'),
        'title' => mb_substr(trim((string) ($args['title'] ?? '')) ?: 'ข้อสอบจาก ChatGPT', 0, 150),
        'school' => mb_substr(trim((string) ($args['school'] ?? '')), 0, 120),
        'kind' => mb_substr(trim((string) ($args['kind'] ?? '')) ?: 'ปลายภาค', 0, 40),
        'grade' => $grade, 'subject' => $subject,
        'term' => in_array((string) ($args['term'] ?? ''), ['1', '2'], true) ? (string) $args['term'] : '',
        'year' => mb_substr(trim((string) ($args['year'] ?? '')), 0, 8),
        'minutes' => max(0, min(300, (int) ($args['minutes'] ?? 60))),
        'versions' => 1, 'seed' => random_int(1, 2147483000),
        'indicators' => [], 'parts' => $parts,
        'source' => 'chatgpt_mcp',
    ];
    exam_write($id, $doc);
    return ['id' => $id, 'title' => $doc['title'], 'questions' => $accepted,
        'url' => rtrim($baseUrl, '/') . '/exam.php?open=' . rawurlencode($id),
        'message' => 'บันทึกร่างแล้ว ครูสามารถเปิด ตรวจแก้ และพิมพ์จากหน้าเว็บได้'];
}
