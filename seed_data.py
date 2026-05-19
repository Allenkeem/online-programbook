"""
8 by 8 by 8 공연 데이터 시드 스크립트
실행: python seed_data.py
이미 동일한 제목의 공연이 있으면 건너뜁니다.
"""
import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'programbook.db')


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(conn):
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS performances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            subtitle TEXT DEFAULT '',
            date_start TEXT DEFAULT '',
            date_end TEXT DEFAULT '',
            venue TEXT DEFAULT '',
            synopsis TEXT DEFAULT '',
            greeting TEXT DEFAULT '',
            poster_filename TEXT,
            is_published INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS cast_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            performance_id INTEGER NOT NULL,
            character_name TEXT DEFAULT '',
            actor_name TEXT NOT NULL,
            actor_bio TEXT DEFAULT '',
            actor_photo TEXT,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (performance_id) REFERENCES performances(id)
        );
        CREATE TABLE IF NOT EXISTS staff_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            performance_id INTEGER NOT NULL,
            department TEXT DEFAULT '',
            role TEXT NOT NULL,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (performance_id) REFERENCES performances(id)
        );
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            performance_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            caption TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (performance_id) REFERENCES performances(id)
        );
        CREATE TABLE IF NOT EXISTS plays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            performance_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (performance_id) REFERENCES performances(id)
        );
    ''')
    conn.commit()


def seed():
    conn = get_db()
    init_db(conn)

    existing = conn.execute(
        "SELECT id FROM performances WHERE title='8 by 8 by 8'"
    ).fetchone()
    if existing:
        print(f"이미 시드 데이터가 존재합니다. (id={existing['id']})")
        conn.close()
        return

    conn.execute('''
        INSERT INTO performances (title, subtitle, date_start, date_end, venue, is_published)
        VALUES (?, ?, ?, ?, ?, 1)
    ''', ('8 by 8 by 8', '서강연극회 26년도 신입생워크샵',
          '2026.05.29', '2026.05.30', '서강대학교 메리홀 소극장'))
    conn.commit()
    perf_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]

    # character_name = 극 그룹 이름 (공연 제목)
    # actor_bio = 역할 (연출, 조연출, 출연 등)
    cast = [
        ('극 1 · 찰리', '고은채',  '작·연출',   1),
        ('극 1 · 찰리', '백경환',  '조연출',     2),
        ('극 1 · 찰리', '김선준',  '출연',       3),
        ('극 1 · 찰리', '전아침',  '출연',       4),
        ('극 1 · 찰리', '성예건',  '출연',       5),
        ('극 1 · 찰리', '이준우',  '출연',       6),

        ('극 2 · 숨의 무게', '우정완', '연출',   7),
        ('극 2 · 숨의 무게', '김서연', '조연출', 8),
        ('극 2 · 숨의 무게', '조민석', '출연',   9),
        ('극 2 · 숨의 무게', '안다인', '출연',  10),

        ('극 3 · 총천연색의 무지개', '서기수', '작·연출',   11),
        ('극 3 · 총천연색의 무지개', '박세은', '작·조연출', 12),
        ('극 3 · 총천연색의 무지개', '고명진', '출연',      13),
        ('극 3 · 총천연색의 무지개', '김시연', '출연',      14),
    ]
    for char, actor, bio, order in cast:
        conn.execute('''
            INSERT INTO cast_members (performance_id, character_name, actor_name, actor_bio, sort_order)
            VALUES (?, ?, ?, ?, ?)
        ''', (perf_id, char, actor, bio, order))

    staff = [
        ('기획',       '김찬우',  1),
        ('기획',       '장은서',  2),
        ('기획',       '김다빈',  3),
        ('기획',       '박시현',  4),
        ('기획',       '전효린',  5),
        ('무대',       '박준희',  6),
        ('무대',       '부신빈',  7),
        ('무대',       '조예준',  8),
        ('무대',       '김수민',  9),
        ('무대',       '신이수', 10),
        ('의상소품분장', '여혜주', 11),
        ('의상소품분장', '김은비', 12),
        ('의상소품분장', '신정인', 13),
        ('의상소품분장', '이명현', 14),
        ('의상소품분장', '김수빈', 15),
        ('조명',       '김현아', 16),
        ('조명',       '오채은', 17),
        ('조명',       '김보경', 18),
        ('조명',       '엄정현', 19),
        ('디자인',     '고은서', 20),
        ('디자인',     '박지현', 21),
        ('음향',       '김민서', 22),
        ('음향',       '임서린', 23),
        ('음향',       '김지수', 24),
        ('음향',       '이윤아', 25),
    ]
    for dept, name, order in staff:
        conn.execute('''
            INSERT INTO staff_members (performance_id, department, role, name, sort_order)
            VALUES (?, ?, '', ?, ?)
        ''', (perf_id, dept, name, order))

    # Plays (방향성/한줄평 — 비워 둠, 어드민에서 직접 입력)
    plays = [
        ('극 1 · 찰리',           '', 1),
        ('극 2 · 숨의 무게',       '', 2),
        ('극 3 · 총천연색의 무지개', '', 3),
    ]
    for name, desc, order in plays:
        conn.execute('''
            INSERT INTO plays (performance_id, name, description, sort_order)
            VALUES (?, ?, ?, ?)
        ''', (perf_id, name, desc, order))

    conn.commit()
    conn.close()
    print(f"시드 완료: '8 by 8 by 8' (performance_id={perf_id})")
    print(f"  - 출연진 {len(cast)}명")
    print(f"  - 스태프 {len(staff)}명")
    print(f"  - 극 정보 {len(plays)}개 (방향성/한줄평은 어드민에서 입력)")


if __name__ == '__main__':
    seed()
