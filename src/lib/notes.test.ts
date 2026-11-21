import { test } from 'node:test';
import assert from 'node:assert';
import { canonicalCourse, courseShort, withPickDefaults, currentSemester, legacyBrowseToNotes, yearFromTitle, titleFromFilename, uploadProblem, formatHelpedPct, mapNote, RESOURCE_REPORT_REASONS, previewKind } from './notes';

const BBA = 'Bachelor of Business Administration (Financial Investment Analysis) [BBA(FIA)]';

test('canonicalCourse maps aliases and exact names, rejects unknown', () => {
  assert.strictEqual(canonicalCourse('Bba '), BBA);
  for (const a of ['bba-fia', 'BBA FIA', 'bba(fia)']) assert.strictEqual(canonicalCourse(a), BBA);
  assert.strictEqual(canonicalCourse('bms'), 'Bachelor of Management Studies (BMS)');
  for (const a of ['bcom', 'b.com', 'B.Com (Hons)']) assert.strictEqual(canonicalCourse(a), 'B.Com. (Hons.)');
  assert.strictEqual(canonicalCourse('skill enhancement course (sec)'), 'Skill Enhancement Course (SEC)');
  assert.strictEqual(canonicalCourse('b.sc. (hons.) mathematics'), 'B.Sc. (Hons.) Mathematics');
  assert.strictEqual(canonicalCourse(null), null);
  assert.strictEqual(canonicalCourse('Physics'), null);
  assert.strictEqual(canonicalCourse('constructor'), null);
});

test('currentSemester counts from a July academic year start', () => {
  assert.strictEqual(currentSemester(2025, new Date('2026-11-21'), 6), 3);
  assert.strictEqual(currentSemester(2025, new Date('2026-03-01'), 6), 2);
  assert.strictEqual(currentSemester(2019, new Date('2026-11-21'), 6), null);
  assert.strictEqual(currentSemester(null, new Date('2026-11-21'), 6), null);
  assert.strictEqual(currentSemester(2027, new Date('2026-11-21'), 6), null);
});

test('legacyBrowseToNotes redirects old browse URLs', () => {
  assert.strictEqual(legacyBrowseToNotes('?resourceId=X1&q=tax'), '/notes/X1');
  assert.strictEqual(legacyBrowseToNotes('?q=tax&type=PYQ'), '/notes?q=tax&type=PYQ');
  assert.strictEqual(legacyBrowseToNotes('?foo=1'), '/notes');
  assert.strictEqual(legacyBrowseToNotes(''), '/notes');
});

test('yearFromTitle, formatHelpedPct, report reasons', () => {
  assert.strictEqual(yearFromTitle('Taxation PYQ 2023 Dec'), 2023);
  assert.strictEqual(yearFromTitle('Code 120234'), null);
  assert.strictEqual(yearFromTitle('PYQ_2022-Dec'), 2022);
  assert.strictEqual(yearFromTitle('PYQ 1999'), null);
  assert.strictEqual(formatHelpedPct(4, 0), null);
  assert.strictEqual(formatHelpedPct(87, 13), '87% found it helpful');
  assert.deepStrictEqual([...RESOURCE_REPORT_REASONS], ['Wrong file', 'Copyright', 'Low quality', 'Spam', 'Other']);
});

test('mapNote maps snake_case to camelCase Resource fields', () => {
  const r = mapNote({ id: 'a', title: 'T', type: 'Note', semester: '3', thumbnail_url: 'u', page_count: 12, rating_avg: '4.5', rating_count: 2, downloads: 7, views: 9, year: 2023, helpful_yes: 5, helpful_no: 1, is_hidden: 1, uploader: 'Aman', uploader_college: 'SRCC', uploader_verified: 1, uploader_role: 'admin', upload_date: '2026-01-02' });
  assert.strictEqual(r.thumbnailUrl, 'u');
  assert.strictEqual(r.pageCount, 12);
  assert.strictEqual(r.ratingAvg, 4.5);
  assert.strictEqual(r.helpfulYes, 5);
  assert.strictEqual(r.isHidden, true);
  assert.strictEqual(r.uploaderVerified, true);
  assert.strictEqual(r.uploaderCollege, 'SRCC');
  assert.strictEqual(r.semester, 3);
  assert.strictEqual(r.link, '');
  assert.strictEqual(mapNote({ id: 'b' }).ratingAvg, null);
});

test('courseShort abbreviates known courses', () => {
  assert.strictEqual(courseShort(BBA), 'BBA(FIA)');
  assert.strictEqual(courseShort('Bachelor of Management Studies (BMS)'), 'BMS');
  assert.strictEqual(courseShort('B.Com. (Hons.)'), 'B.Com (H)');
  assert.strictEqual(courseShort('Other'), 'Other');
});

test('withPickDefaults fills only missing course/semester', () => {
  const pick = { course: 'B.Com. (Hons.)', semester: '3' };
  assert.strictEqual(withPickDefaults(new URLSearchParams('type=PYQ'), pick).toString(), 'type=PYQ&course=B.Com.+%28Hons.%29&semester=3');
  assert.strictEqual(withPickDefaults(new URLSearchParams('type=PYQ&course=BMS&semester=1'), pick).get('course'), 'BMS');
  assert.strictEqual(withPickDefaults(new URLSearchParams('q=tax'), { course: '', semester: '' }).toString(), 'q=tax');
});

test('previewKind: each kind and garbage', () => {
  assert.deepStrictEqual(previewKind('https://pub-abc.r2.dev/notes/a.PDF'), { kind: 'pdf' });
  assert.deepStrictEqual(previewKind('https://drive.google.com/file/d/1aB_-c/view?usp=sharing'), { kind: 'drive', id: '1aB_-c' });
  assert.deepStrictEqual(previewKind('https://drive.google.com/open?id=XyZ9'), { kind: 'drive', id: 'XyZ9' });
  assert.deepStrictEqual(previewKind('https://www.youtube.com/watch?v=abc123&t=5'), { kind: 'youtube', id: 'abc123' });
  assert.deepStrictEqual(previewKind('https://youtu.be/abc123'), { kind: 'youtube', id: 'abc123' });
  assert.deepStrictEqual(previewKind('https://www.youtube.com/embed/abc123'), { kind: 'youtube', id: 'abc123' });
  assert.deepStrictEqual(previewKind('https://x.r2.dev/p.jpg'), { kind: 'image' });
  assert.deepStrictEqual(previewKind('https://example.com/page'), { kind: 'other' });
  assert.deepStrictEqual(previewKind('https://drive.google.com/drive/folders/zzz'), { kind: 'other' });
  assert.deepStrictEqual(previewKind('not a url'), { kind: 'other' });
  assert.deepStrictEqual(previewKind(''), { kind: 'other' });
});

test('titleFromFilename drops the extension and tidies separators', () => {
  assert.strictEqual(titleFromFilename('  Micro_Eco--Unit-1  notes.final.PDF'), 'Micro Eco Unit 1 notes.final');
  assert.strictEqual(titleFromFilename('scan'), 'scan');
});

test('uploadProblem blocks a file or missing link on Playlist, and bad links', () => {
  assert.ok(uploadProblem({ type: 'Playlist', hasFile: true, link: '' }));
  assert.ok(uploadProblem({ type: 'Playlist', hasFile: false, link: '' }));
  assert.strictEqual(uploadProblem({ type: 'Playlist', hasFile: false, link: 'https://youtube.com/playlist?list=x' }), null);
  assert.strictEqual(uploadProblem({ type: 'Note', hasFile: true, link: '' }), null);
  assert.ok(uploadProblem({ type: 'Note', hasFile: false, link: '' }));
  assert.ok(uploadProblem({ type: 'Note', hasFile: false, link: 'drive.google.com/x' }));
});
