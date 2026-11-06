<?php
declare(strict_types=1);

require_once __DIR__ . '/src/core/core.php';
require_once __DIR__ . '/src/core/nav.php';

if (!is_authed()) {
    header('Location: index.php');
    exit;
}
$v = max(@filemtime(__DIR__ . '/assets/js/pages/exam.js') ?: 1, @filemtime(__DIR__ . '/assets/js/pages/live-send.js') ?: 1, @filemtime(__DIR__ . '/assets/js/shared/common.js') ?: 1, @filemtime(__DIR__ . '/assets/css/style.css') ?: 1);
?><!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>สร้างข้อสอบ</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Mali:wght@400;600;700&family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css?v=<?= $v ?>">
<link rel="stylesheet" href="assets/vendor/katex/katex.min.css">
<link rel="stylesheet" href="assets/css/exam.css?v=<?= $v ?>">
</head>
<body>
<div class="app">
  <div id="jserr" class="error hidden"></div>
  <?= nav_html('exam') ?>
  <h1 class="no-print">สร้างข้อสอบ</h1>
  <p class="sub no-print">ตั้งจำนวนข้อและตัวชี้วัดที่ออกสอบ ระบบจะวางตารางวิเคราะห์ข้อสอบ (ตัวชี้วัด × ระดับความยาก) หยิบข้อจากคลังข้อสอบก่อน แล้วให้ AI สร้างเฉพาะข้อที่ยังขาด จากนั้นสลับข้อ/ตัวเลือกเป็นหลายชุด พิมพ์พร้อมกระดาษคำตอบและเฉลย ข้อสอบจาก AI ครูควรตรวจทานทุกข้อก่อนใช้จริง</p>

  <div class="panel no-print">
    <div class="grid">
      <label class="f" style="grid-column:span 2">โรงเรียน (พิมพ์หัวกระดาษ)<input type="text" id="school" maxlength="100" placeholder="เช่น โรงเรียนบ้านตัวอย่าง"></label>
      <label class="f">ประเภทข้อสอบ<select id="kind"><option>กลางภาค</option><option selected>ปลายภาค</option><option>ท้ายหน่วย</option><option>ก่อนเรียน</option><option>หลังเรียน</option></select></label>
      <label class="f">ปีการศึกษา (พ.ศ.)<input type="text" id="year" maxlength="4"></label>
      <label class="f">ชั้น<select id="grade"></select></label>
      <label class="f">วิชา<select id="subject"></select></label>
      <label class="f">ภาคเรียน<select id="term"><option value="">—</option><option value="1">ภาคเรียนที่ 1</option><option value="2">ภาคเรียนที่ 2</option></select></label>
      <label class="f">เวลาสอบ (นาที)<input type="number" id="minutes" min="0" max="300" value="60"></label>
      <label class="f">จำนวนชุดข้อสอบ (สลับข้อ)<select id="versions"><option value="1">1 ชุด</option><option value="2">2 ชุด (ก ข)</option><option value="3">3 ชุด (ก ข ค)</option><option value="4">4 ชุด (ก ข ค ง)</option></select></label>
      <label class="f" style="grid-column:span 2">ชื่อข้อสอบ<input type="text" id="title" maxlength="120" placeholder="ว่างไว้ = ตั้งชื่ออัตโนมัติ"></label>
    </div>

    <h3 class="xh">โครงสร้างข้อสอบ</h3>
    <table class="tbl xparts" id="partsTbl">
      <thead><tr><th>ส่วน</th><th>จำนวนข้อ</th><th>คะแนนต่อข้อ</th><th>รวม</th></tr></thead>
      <tbody>
        <tr data-p="mc"><td>ปรนัย 4 ตัวเลือก</td><td><input type="number" min="0" max="60" value="20" data-f="count"></td><td><input type="number" min="0" max="50" step="0.5" value="1" data-f="score"></td><td class="sum"></td></tr>
        <tr data-p="tf"><td>ถูก / ผิด</td><td><input type="number" min="0" max="30" value="0" data-f="count"></td><td><input type="number" min="0" max="50" step="0.5" value="1" data-f="score"></td><td class="sum"></td></tr>
        <tr data-p="match"><td>จับคู่ (นับเป็นคู่)</td><td><input type="number" min="0" max="12" value="0" data-f="count"></td><td><input type="number" min="0" max="50" step="0.5" value="1" data-f="score"></td><td class="sum"></td></tr>
        <tr data-p="written"><td>อัตนัย (แสดงวิธีทำ)</td><td><input type="number" min="0" max="15" value="0" data-f="count"></td><td><input type="number" min="0" max="50" step="0.5" value="5" data-f="score"></td><td class="sum"></td></tr>
      </tbody>
      <tfoot><tr><td colspan="3" style="text-align:right"><b>คะแนนเต็มทั้งฉบับ</b></td><td id="totalScore"><b>0</b></td></tr></tfoot>
    </table>

    <h3 class="xh">สัดส่วนความยาก</h3>
    <div class="row" style="gap:10px;align-items:flex-end;flex-wrap:wrap">
      <label class="f">ชุดสัดส่วน<select id="mixPreset"><option value="std">มาตรฐาน (20/50/30/0)</option><option value="exam">ข้อสอบ (10/30/40/20)</option><option value="review">ทบทวน (50/40/10/0)</option><option value="contest">แข่งขัน (0/20/40/40)</option><option value="custom">กำหนดเอง</option></select></label>
      <label class="f" style="width:90px">ง่าย %<input type="number" id="mx_easy" min="0" max="100"></label>
      <label class="f" style="width:90px">ปานกลาง %<input type="number" id="mx_medium" min="0" max="100"></label>
      <label class="f" style="width:90px">ยาก %<input type="number" id="mx_hard" min="0" max="100"></label>
      <label class="f" style="width:90px">ยากมาก %<input type="number" id="mx_expert" min="0" max="100"></label>
    </div>

    <h3 class="xh">ตัวชี้วัดที่ออกสอบ <span id="indCount" class="sub" style="margin:0"></span></h3>
    <div class="row" style="margin-bottom:6px"><button class="ghost small" id="indAll">เลือกทั้งหมด</button><button class="ghost small" id="indNone">ล้าง</button><span id="indNote" class="sub" style="margin:0"></span></div>
    <div id="indBox" class="xind">เลือกชั้นและวิชา…</div>

    <div class="grid" style="margin-top:12px">
      <label class="f" style="grid-column:span 3">ขอบเขตเนื้อหาที่ออกสอบ (หน่วย/เรื่อง)<textarea id="scope" rows="2" maxlength="1500" placeholder="ระบบใส่รายชื่อหน่วยให้อัตโนมัติ แก้ไขได้"></textarea></label>
      <label class="f" style="grid-column:span 3">ข้อเสนอแนะเพิ่มเติมถึง AI (ไม่บังคับ)<input type="text" id="hint" maxlength="300" placeholder="เช่น เน้นโจทย์สถานการณ์ในชีวิตประจำวัน"></label>
    </div>
    <label class="xchk" style="margin-top:10px"><input type="checkbox" id="useBank" checked> หยิบข้อจากคลังข้อสอบก่อน (ตรงชั้น วิชา ตัวชี้วัด และระดับ) แล้วให้ AI สร้างเฉพาะข้อที่ขาด</label>
    <div id="planNote" class="xplan"></div>
    <div class="row" style="margin-top:12px"><button class="ghost" id="btnPlan">ดูตารางวิเคราะห์ / ข้อที่มีในคลัง</button><button id="btnGen">สร้างข้อสอบ</button><button type="button" class="ghost hidden" id="btnStop" title="หยุดการสร้างทันที">⏹ หยุด</button><span id="genNote" class="sub" style="margin:0"></span></div>
  </div>

  <div class="panel hidden" id="resBox">
    <div class="no-print">
      <div class="row" style="justify-content:space-between;flex-wrap:wrap">
        <div class="xtabs" id="tabs">
          <button data-t="analysis" class="on">ตารางวิเคราะห์</button>
          <button data-t="edit">แก้ไขข้อสอบ</button>
          <button data-t="paper">ข้อสอบ</button>
          <button data-t="sheet">กระดาษคำตอบ</button>
          <button data-t="key">เฉลย</button>
        </div>
        <span class="row"><button id="btnSave">บันทึก</button><button class="ghost" id="btnPrint">พิมพ์ / PDF แท็บนี้</button><span id="saveNote" class="sub" style="margin:0"></span></span>
      </div>
      <label class="xchk" style="margin:6px 0"><input type="checkbox" id="addBank" checked> ตอนบันทึก เก็บข้อที่ AI สร้าง/ครูแก้ไขเข้าคลังข้อสอบด้วย</label>
      <div id="stats" class="sub" style="margin:4px 0"></div>
      <div id="warns" class="xwarn hidden"></div>
      <div id="verBar" class="xver hidden">ชุดที่ดู: <span id="verBtns"></span></div>
    </div>
    <div class="tabpane on" id="pane-analysis"></div>
    <div class="tabpane" id="pane-edit"></div>
    <div class="tabpane" id="pane-paper"></div>
    <div class="tabpane" id="pane-sheet"></div>
    <div class="tabpane" id="pane-key"></div>
  </div>

  <div class="panel no-print"><strong>ข้อสอบที่บันทึกไว้</strong><div id="saved" style="margin-top:8px;font-size:14px">กำลังโหลด…</div></div>
</div>
<script src="assets/vendor/katex/katex.min.js"></script>
<script src="assets/vendor/katex/auto-render.min.js"></script>
<script src="assets/js/data/curriculum.js"></script>
<script src="assets/js/shared/common.js?v=<?= $v ?>"></script>
<?php if (defined('HOST_EMBEDDED')): ?><script>window.TA_EMBEDDED = true;</script><script src="assets/js/pages/lms-send.js?v=<?= $v ?>"></script><script src="assets/js/pages/live-send.js?v=<?= $v ?>"></script><?php endif; ?>
<script src="assets/js/pages/exam.js?v=<?= $v ?>"></script>
</body>
</html>
