// GO CARE DRUG — persistent session store backed by SQLite (works across
// server restarts on any host with a persistent disk; no MemoryStore).
const { Store } = require('express-session');

class SQLiteStore extends Store {
  constructor(db) {
    super();
    this.db = db;
    this.qGet = db.prepare('SELECT sess, expires FROM sessions WHERE sid=?');
    this.qSet = db.prepare('INSERT INTO sessions(sid,sess,expires) VALUES(?,?,?) ON CONFLICT(sid) DO UPDATE SET sess=excluded.sess, expires=excluded.expires');
    this.qDel = db.prepare('DELETE FROM sessions WHERE sid=?');
    this.qTouch = db.prepare('UPDATE sessions SET expires=? WHERE sid=?');
    this.qGc = db.prepare('DELETE FROM sessions WHERE expires < ?');
    const t = setInterval(() => { try { this.qGc.run(Date.now()); } catch { /* ignore */ } }, 15 * 60 * 1000);
    if (t.unref) t.unref();
  }
  get(sid, cb) {
    try {
      const r = this.qGet.get(sid);
      if (!r || r.expires < Date.now()) {
        if (r) { try { this.qDel.run(sid); } catch { /* ignore */ } }
        cb(null, null);
        return;
      }
      cb(null, JSON.parse(r.sess));
    } catch (err) { cb(err); }
  }
  set(sid, sess, cb) {
    try {
      const exp = sess && sess.cookie && sess.cookie.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;
      this.qSet.run(sid, JSON.stringify(sess), exp);
      cb(null);
    } catch (err) { cb(err); }
  }
  destroy(sid, cb) {
    try { this.qDel.run(sid); cb(null); } catch (err) { cb(err); }
  }
  touch(sid, sess, cb) {
    try {
      const exp = sess && sess.cookie && sess.cookie.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;
      this.qTouch.run(exp, sid);
      cb(null);
    } catch (err) { cb(err); }
  }
}

module.exports = SQLiteStore;
