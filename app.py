import os
import time
import sqlite3
from functools import wraps
from flask import (Flask, render_template, request, redirect,
                   url_for, session, flash)
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY') or 'dev-local-fallback-key-change-in-prod'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'programbook.db')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '')

app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    conn = get_db()
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
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            performance_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (performance_id) REFERENCES performances(id)
        );
    ''')
    conn.commit()
    # Add columns introduced after initial release (safe: ignored if already exist)
    for stmt in [
        "ALTER TABLE staff_members ADD COLUMN play_name TEXT DEFAULT ''",
        "ALTER TABLE staff_members ADD COLUMN photo TEXT",
        "ALTER TABLE cast_members ADD COLUMN message TEXT DEFAULT ''",
        "ALTER TABLE staff_members ADD COLUMN message TEXT DEFAULT ''",
        "ALTER TABLE cast_members ADD COLUMN actor_photo2 TEXT",
        "ALTER TABLE cast_members ADD COLUMN actor_photo3 TEXT",
        "ALTER TABLE staff_members ADD COLUMN photo2 TEXT",
        "ALTER TABLE staff_members ADD COLUMN photo3 TEXT",
        "ALTER TABLE cast_members ADD COLUMN q1 TEXT DEFAULT ''",
        "ALTER TABLE cast_members ADD COLUMN q2 TEXT DEFAULT ''",
        "ALTER TABLE staff_members ADD COLUMN q1 TEXT DEFAULT ''",
        "ALTER TABLE staff_members ADD COLUMN q2 TEXT DEFAULT ''",
        "ALTER TABLE performances ADD COLUMN q1_text TEXT DEFAULT ''",
        "ALTER TABLE performances ADD COLUMN q2_text TEXT DEFAULT ''",
        "ALTER TABLE cast_members ADD COLUMN character_role TEXT DEFAULT ''",
        "ALTER TABLE cast_members ADD COLUMN major TEXT DEFAULT ''",
        "ALTER TABLE cast_members ADD COLUMN student_id TEXT DEFAULT ''",
        "ALTER TABLE cast_members ADD COLUMN history TEXT DEFAULT ''",
        "ALTER TABLE staff_members ADD COLUMN major TEXT DEFAULT ''",
        "ALTER TABLE staff_members ADD COLUMN student_id TEXT DEFAULT ''",
        "ALTER TABLE staff_members ADD COLUMN history TEXT DEFAULT ''",
        "ALTER TABLE plays ADD COLUMN director_note TEXT DEFAULT ''",
        "ALTER TABLE cast_members ADD COLUMN character_intro TEXT DEFAULT ''",
        "ALTER TABLE cast_members ADD COLUMN actor_intro TEXT DEFAULT ''",
    ]:
        try:
            conn.execute(stmt)
            conn.commit()
        except Exception:
            pass
    conn.close()


def allowed_file(filename):
    return ('.' in filename and
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS)


def save_upload(file, prefix='img'):
    if file and file.filename and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = secure_filename(f"{prefix}_{int(time.time() * 1000)}.{ext}")
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        return filename
    return None


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin'):
            flash('로그인이 필요합니다.')
            return redirect(url_for('admin_login', next=request.url))
        return f(*args, **kwargs)
    return decorated


# ── Public routes ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    conn = get_db()
    perf_rows = conn.execute(
        'SELECT * FROM performances WHERE is_published=1 ORDER BY date_start DESC'
    ).fetchall()

    performances = []
    for perf in perf_rows:
        cast_rows = conn.execute(
            'SELECT * FROM cast_members WHERE performance_id=? ORDER BY sort_order',
            (perf['id'],)
        ).fetchall()
        staff_rows = conn.execute(
            'SELECT * FROM staff_members WHERE performance_id=? ORDER BY sort_order',
            (perf['id'],)
        ).fetchall()
        photo_rows = conn.execute(
            'SELECT * FROM photos WHERE performance_id=? ORDER BY sort_order',
            (perf['id'],)
        ).fetchall()
        play_rows = conn.execute(
            'SELECT * FROM plays WHERE performance_id=? ORDER BY sort_order',
            (perf['id'],)
        ).fetchall()
        dept_rows = conn.execute(
            'SELECT * FROM departments WHERE performance_id=? ORDER BY sort_order',
            (perf['id'],)
        ).fetchall()
        performances.append({
            'id': perf['id'],
            'title': perf['title'],
            'subtitle': perf['subtitle'] or '',
            'date_start': perf['date_start'] or '',
            'date_end': perf['date_end'] or '',
            'venue': perf['venue'] or '',
            'synopsis': perf['synopsis'] or '',
            'greeting': perf['greeting'] or '',
            'q1_text': perf['q1_text'] or '',
            'q2_text': perf['q2_text'] or '',
            'poster': url_for('static', filename=f"uploads/{perf['poster_filename']}") if perf['poster_filename'] else None,
            'cast': [
                {
                    'character': c['character_name'] or '',
                    'character_role': c['character_role'] or '',
                    'actor': c['actor_name'],
                    'bio': c['actor_bio'] or '',
                    'photos': [url_for('static', filename=f"uploads/{c[k]}") for k in ('actor_photo','actor_photo2','actor_photo3') if c[k]],
                    'message': c['message'] or '',
                    'q1': c['q1'] or '',
                    'q2': c['q2'] or '',
                    'major': c['major'] or '',
                    'student_id': c['student_id'] or '',
                    'history': c['history'] or '',
                    'character_intro': c['character_intro'] or '',
                    'actor_intro': c['actor_intro'] or '',
                }
                for c in cast_rows
            ],
            'staff': [
                {
                    'department': s['department'] or '스태프',
                    'role': s['role'] or '',
                    'name': s['name'],
                    'play_name': s['play_name'] or '',
                    'photos': [url_for('static', filename=f"uploads/{s[k]}") for k in ('photo','photo2','photo3') if s[k]],
                    'message': s['message'] or '',
                    'q1': s['q1'] or '',
                    'q2': s['q2'] or '',
                    'major': s['major'] or '',
                    'student_id': s['student_id'] or '',
                    'history': s['history'] or '',
                }
                for s in staff_rows
            ],
            'photos': [
                {'src': url_for('static', filename=f"uploads/{p['filename']}"), 'caption': p['caption'] or ''}
                for p in photo_rows
            ],
            'plays': [
                {'name': p['name'], 'description': p['description'] or '', 'director_note': p['director_note'] or ''}
                for p in play_rows
            ],
            'departments': [
                {'name': d['name'], 'description': d['description'] or ''}
                for d in dept_rows
            ],
        })
    conn.close()

    programbook_data = {'club': {'name': '서강연극회'}, 'performances': performances}
    return render_template('index.html', programbook_data=programbook_data)


@app.route('/performance/<int:id>')
def performance_detail(id):
    conn = get_db()
    perf = conn.execute('SELECT * FROM performances WHERE id=?', (id,)).fetchone()
    if not perf or (not perf['is_published'] and not session.get('admin')):
        conn.close()
        return render_template('404.html'), 404

    cast = conn.execute(
        'SELECT * FROM cast_members WHERE performance_id=? ORDER BY sort_order', (id,)
    ).fetchall()
    all_staff = conn.execute(
        'SELECT * FROM staff_members WHERE performance_id=? ORDER BY department, sort_order', (id,)
    ).fetchall()
    photos = conn.execute(
        'SELECT * FROM photos WHERE performance_id=? ORDER BY sort_order', (id,)
    ).fetchall()
    conn.close()

    staff_by_dept = {}
    for s in all_staff:
        dept = s['department'] or '스태프'
        staff_by_dept.setdefault(dept, []).append(s)

    plays = conn.execute(
        'SELECT * FROM plays WHERE performance_id=? ORDER BY sort_order', (id,)
    ).fetchall()
    plays_by_name = {p['name']: {'description': p['description'] or '', 'director_note': p['director_note'] or ''} for p in plays}

    cast_by_play = {}
    for m in cast:
        key = m['character_name'] or ''
        cast_by_play.setdefault(key, []).append(m)

    return render_template('performance.html',
                           performance=perf, cast=cast,
                           cast_by_play=cast_by_play,
                           plays_by_name=plays_by_name,
                           staff_by_dept=staff_by_dept, photos=photos)


@app.route('/gallery')
def gallery():
    conn = get_db()
    perf_id = request.args.get('p', type=int)
    performances = conn.execute(
        'SELECT id, title FROM performances WHERE is_published=1 ORDER BY date_start DESC'
    ).fetchall()
    if perf_id:
        photos = conn.execute(
            '''SELECT ph.*, pf.title as perf_title
               FROM photos ph JOIN performances pf ON ph.performance_id=pf.id
               WHERE ph.performance_id=? ORDER BY ph.sort_order''', (perf_id,)
        ).fetchall()
        current = conn.execute('SELECT * FROM performances WHERE id=?', (perf_id,)).fetchone()
    else:
        photos = conn.execute(
            '''SELECT ph.*, pf.title as perf_title
               FROM photos ph JOIN performances pf ON ph.performance_id=pf.id
               WHERE pf.is_published=1 ORDER BY pf.date_start DESC, ph.sort_order'''
        ).fetchall()
        current = None
    conn.close()
    return render_template('gallery.html', photos=photos,
                           performances=performances, current=current)


@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


# ── Admin routes ───────────────────────────────────────────────────────────────

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        if request.form.get('password') == ADMIN_PASSWORD:
            session['admin'] = True
            return redirect(request.args.get('next') or url_for('admin_dashboard'))
        flash('비밀번호가 올바르지 않습니다.')
    return render_template('admin/login.html')


@app.route('/admin/logout')
def admin_logout():
    session.clear()
    return redirect(url_for('index'))


@app.route('/admin')
@login_required
def admin_dashboard():
    conn = get_db()
    perfs = conn.execute('SELECT * FROM performances ORDER BY created_at DESC').fetchall()
    conn.close()
    return render_template('admin/dashboard.html', performances=perfs)


@app.route('/admin/performance/new', methods=['GET', 'POST'])
@login_required
def admin_new_performance():
    if request.method == 'POST':
        poster = save_upload(request.files.get('poster'), 'poster')
        conn = get_db()
        conn.execute('''
            INSERT INTO performances
              (title, subtitle, date_start, date_end, venue, synopsis, greeting,
               poster_filename, is_published)
            VALUES (?,?,?,?,?,?,?,?,?)
        ''', (request.form['title'], request.form.get('subtitle', ''),
              request.form.get('date_start', ''), request.form.get('date_end', ''),
              request.form.get('venue', ''), request.form.get('synopsis', ''),
              request.form.get('greeting', ''), poster,
              1 if request.form.get('is_published') else 0))
        conn.commit()
        perf_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        conn.close()
        flash('공연이 추가되었습니다.')
        return redirect(url_for('admin_edit_performance', id=perf_id))
    return render_template('admin/performance_form.html',
                           performance=None, cast=[], staff=[], photos=[], plays=[])


@app.route('/admin/performance/<int:id>', methods=['GET', 'POST'])
@login_required
def admin_edit_performance(id):
    conn = get_db()
    perf = conn.execute('SELECT * FROM performances WHERE id=?', (id,)).fetchone()
    if not perf:
        conn.close()
        return render_template('404.html'), 404

    if request.method == 'POST':
        poster = save_upload(request.files.get('poster'), 'poster') or perf['poster_filename']
        conn.execute('''
            UPDATE performances SET
              title=?, subtitle=?, date_start=?, date_end=?, venue=?,
              synopsis=?, greeting=?, poster_filename=?, is_published=?,
              q1_text=?, q2_text=?
            WHERE id=?
        ''', (request.form['title'], request.form.get('subtitle', ''),
              request.form.get('date_start', ''), request.form.get('date_end', ''),
              request.form.get('venue', ''), request.form.get('synopsis', ''),
              request.form.get('greeting', ''), poster,
              1 if request.form.get('is_published') else 0,
              request.form.get('q1_text', ''), request.form.get('q2_text', ''), id))
        conn.commit()
        flash('수정되었습니다.')
        perf = conn.execute('SELECT * FROM performances WHERE id=?', (id,)).fetchone()

    cast = conn.execute(
        'SELECT * FROM cast_members WHERE performance_id=? ORDER BY sort_order', (id,)
    ).fetchall()
    staff = conn.execute(
        'SELECT * FROM staff_members WHERE performance_id=? ORDER BY department, sort_order', (id,)
    ).fetchall()
    photos = conn.execute(
        'SELECT * FROM photos WHERE performance_id=? ORDER BY sort_order', (id,)
    ).fetchall()
    plays = conn.execute(
        'SELECT * FROM plays WHERE performance_id=? ORDER BY sort_order', (id,)
    ).fetchall()
    departments = conn.execute(
        'SELECT * FROM departments WHERE performance_id=? ORDER BY sort_order', (id,)
    ).fetchall()
    conn.close()
    return render_template('admin/performance_form.html',
                           performance=perf, cast=cast, staff=staff,
                           photos=photos, plays=plays, departments=departments)


@app.route('/admin/performance/<int:id>/delete', methods=['POST'])
@login_required
def admin_delete_performance(id):
    conn = get_db()
    conn.execute('DELETE FROM cast_members WHERE performance_id=?', (id,))
    conn.execute('DELETE FROM staff_members WHERE performance_id=?', (id,))
    conn.execute('DELETE FROM photos WHERE performance_id=?', (id,))
    conn.execute('DELETE FROM plays WHERE performance_id=?', (id,))
    conn.execute('DELETE FROM departments WHERE performance_id=?', (id,))
    conn.execute('DELETE FROM performances WHERE id=?', (id,))
    conn.commit()
    conn.close()
    flash('공연이 삭제되었습니다.')
    return redirect(url_for('admin_dashboard'))


# Cast
@app.route('/admin/performance/<int:perf_id>/cast', methods=['POST'])
@login_required
def admin_add_cast(perf_id):
    photos = [save_upload(f, 'cast') for f in request.files.getlist('actor_photos')]
    photo1 = photos[0] if len(photos) > 0 else None
    photo2 = photos[1] if len(photos) > 1 else None
    photo3 = photos[2] if len(photos) > 2 else None
    conn = get_db()
    conn.execute('''
        INSERT INTO cast_members
          (performance_id, character_name, character_role, actor_name, actor_bio, actor_photo, actor_photo2, actor_photo3, message, q1, q2, sort_order, major, student_id, history, character_intro, actor_intro)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', (perf_id, request.form.get('character_name', ''), request.form.get('character_role', ''),
          request.form['actor_name'], request.form.get('actor_bio', ''), photo1, photo2, photo3,
          request.form.get('message', ''), request.form.get('q1', ''),
          request.form.get('q2', ''), int(request.form.get('sort_order', 0) or 0),
          request.form.get('major', ''), request.form.get('student_id', ''),
          request.form.get('history', ''), request.form.get('character_intro', ''),
          request.form.get('actor_intro', '')))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=perf_id) + '#cast')


@app.route('/admin/cast/<int:id>/edit', methods=['POST'])
@login_required
def admin_edit_cast(id):
    conn = get_db()
    row = conn.execute('SELECT performance_id, actor_photo, actor_photo2, actor_photo3 FROM cast_members WHERE id=?', (id,)).fetchone()
    files = [f for f in request.files.getlist('actor_photos') if f and f.filename]
    new_photos = [save_upload(f, 'cast') for f in files]
    p1 = new_photos[0] if len(new_photos) > 0 else row['actor_photo']
    p2 = new_photos[1] if len(new_photos) > 1 else row['actor_photo2']
    p3 = new_photos[2] if len(new_photos) > 2 else row['actor_photo3']
    conn.execute('''
        UPDATE cast_members SET character_name=?, character_role=?, actor_name=?, actor_bio=?,
          message=?, q1=?, q2=?, actor_photo=?, actor_photo2=?, actor_photo3=?, sort_order=?,
          major=?, student_id=?, history=?, character_intro=?, actor_intro=?
        WHERE id=?
    ''', (request.form.get('character_name', ''), request.form.get('character_role', ''),
          request.form['actor_name'], request.form.get('actor_bio', ''),
          request.form.get('message', ''), request.form.get('q1', ''), request.form.get('q2', ''),
          p1, p2, p3, int(request.form.get('sort_order', 0) or 0),
          request.form.get('major', ''), request.form.get('student_id', ''),
          request.form.get('history', ''), request.form.get('character_intro', ''),
          request.form.get('actor_intro', ''), id))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=row['performance_id']) + '#cast')


@app.route('/admin/cast/<int:id>/delete', methods=['POST'])
@login_required
def admin_delete_cast(id):
    conn = get_db()
    row = conn.execute('SELECT performance_id FROM cast_members WHERE id=?', (id,)).fetchone()
    conn.execute('DELETE FROM cast_members WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=row['performance_id']) + '#cast')


# Staff
@app.route('/admin/performance/<int:perf_id>/staff', methods=['POST'])
@login_required
def admin_add_staff(perf_id):
    photos = [save_upload(f, 'staff') for f in request.files.getlist('photos')]
    photo1 = photos[0] if len(photos) > 0 else None
    photo2 = photos[1] if len(photos) > 1 else None
    photo3 = photos[2] if len(photos) > 2 else None
    conn = get_db()
    conn.execute('''
        INSERT INTO staff_members (performance_id, department, role, name, play_name, photo, photo2, photo3, message, q1, q2, sort_order, major, student_id, history)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', (perf_id, request.form.get('department', ''), request.form.get('role', ''),
          request.form['name'], request.form.get('play_name', ''), photo1, photo2, photo3,
          request.form.get('message', ''), request.form.get('q1', ''),
          request.form.get('q2', ''), int(request.form.get('sort_order', 0) or 0),
          request.form.get('major', ''), request.form.get('student_id', ''),
          request.form.get('history', '')))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=perf_id) + '#staff')


@app.route('/admin/staff/<int:id>/edit', methods=['POST'])
@login_required
def admin_edit_staff(id):
    conn = get_db()
    row = conn.execute('SELECT performance_id, photo, photo2, photo3 FROM staff_members WHERE id=?', (id,)).fetchone()
    files = [f for f in request.files.getlist('photos') if f and f.filename]
    new_photos = [save_upload(f, 'staff') for f in files]
    p1 = new_photos[0] if len(new_photos) > 0 else row['photo']
    p2 = new_photos[1] if len(new_photos) > 1 else row['photo2']
    p3 = new_photos[2] if len(new_photos) > 2 else row['photo3']
    conn.execute('''
        UPDATE staff_members SET department=?, role=?, name=?, play_name=?,
          message=?, q1=?, q2=?, photo=?, photo2=?, photo3=?, sort_order=?,
          major=?, student_id=?, history=?
        WHERE id=?
    ''', (request.form.get('department', ''), request.form.get('role', ''),
          request.form['name'], request.form.get('play_name', ''),
          request.form.get('message', ''), request.form.get('q1', ''),
          request.form.get('q2', ''),
          p1, p2, p3, int(request.form.get('sort_order', 0) or 0),
          request.form.get('major', ''), request.form.get('student_id', ''),
          request.form.get('history', ''), id))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=row['performance_id']) + '#staff')


@app.route('/admin/staff/<int:id>/delete', methods=['POST'])
@login_required
def admin_delete_staff(id):
    conn = get_db()
    row = conn.execute('SELECT performance_id FROM staff_members WHERE id=?', (id,)).fetchone()
    conn.execute('DELETE FROM staff_members WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=row['performance_id']) + '#staff')


# Photos
@app.route('/admin/performance/<int:perf_id>/photos', methods=['POST'])
@login_required
def admin_add_photos(perf_id):
    conn = get_db()
    for file in request.files.getlist('photos'):
        filename = save_upload(file, 'photo')
        if filename:
            conn.execute('''
                INSERT INTO photos (performance_id, filename, caption, sort_order)
                VALUES (?,?,?,?)
            ''', (perf_id, filename, request.form.get('caption', ''),
                  int(request.form.get('sort_order', 0) or 0)))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=perf_id) + '#photos')


@app.route('/admin/photo/<int:id>/delete', methods=['POST'])
@login_required
def admin_delete_photo(id):
    conn = get_db()
    row = conn.execute('SELECT * FROM photos WHERE id=?', (id,)).fetchone()
    conn.execute('DELETE FROM photos WHERE id=?', (id,))
    conn.commit()
    conn.close()
    try:
        os.remove(os.path.join(UPLOAD_FOLDER, row['filename']))
    except OSError:
        pass
    return redirect(url_for('admin_edit_performance', id=row['performance_id']) + '#photos')


# Plays
@app.route('/admin/performance/<int:perf_id>/plays', methods=['POST'])
@login_required
def admin_add_play(perf_id):
    conn = get_db()
    conn.execute('''
        INSERT INTO plays (performance_id, name, description, director_note, sort_order)
        VALUES (?,?,?,?,?)
    ''', (perf_id, request.form['name'], request.form.get('description', ''),
          request.form.get('director_note', ''),
          int(request.form.get('sort_order', 0) or 0)))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=perf_id) + '#plays')


@app.route('/admin/play/<int:id>/edit', methods=['POST'])
@login_required
def admin_edit_play(id):
    conn = get_db()
    row = conn.execute('SELECT performance_id FROM plays WHERE id=?', (id,)).fetchone()
    conn.execute(
        'UPDATE plays SET name=?, description=?, director_note=?, sort_order=? WHERE id=?',
        (request.form['name'], request.form.get('description', ''),
         request.form.get('director_note', ''),
         int(request.form.get('sort_order', 0) or 0), id)
    )
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=row['performance_id']) + '#plays')


@app.route('/admin/play/<int:id>/delete', methods=['POST'])
@login_required
def admin_delete_play(id):
    conn = get_db()
    row = conn.execute('SELECT performance_id FROM plays WHERE id=?', (id,)).fetchone()
    conn.execute('DELETE FROM plays WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=row['performance_id']) + '#plays')


# Departments
@app.route('/admin/performance/<int:perf_id>/departments', methods=['POST'])
@login_required
def admin_add_department(perf_id):
    conn = get_db()
    conn.execute('''
        INSERT INTO departments (performance_id, name, description, sort_order)
        VALUES (?,?,?,?)
    ''', (perf_id, request.form['name'], request.form.get('description', ''),
          int(request.form.get('sort_order', 0) or 0)))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=perf_id) + '#depts')


@app.route('/admin/department/<int:id>/edit', methods=['POST'])
@login_required
def admin_edit_department(id):
    conn = get_db()
    row = conn.execute('SELECT performance_id FROM departments WHERE id=?', (id,)).fetchone()
    conn.execute(
        'UPDATE departments SET name=?, description=?, sort_order=? WHERE id=?',
        (request.form['name'], request.form.get('description', ''),
         int(request.form.get('sort_order', 0) or 0), id)
    )
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=row['performance_id']) + '#depts')


@app.route('/admin/department/<int:id>/delete', methods=['POST'])
@login_required
def admin_delete_department(id):
    conn = get_db()
    row = conn.execute('SELECT performance_id FROM departments WHERE id=?', (id,)).fetchone()
    conn.execute('DELETE FROM departments WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_edit_performance', id=row['performance_id']) + '#depts')


# ── Entry point ────────────────────────────────────────────────────────────────

init_db()

if __name__ == '__main__':
    app.run(debug=True)
