import { useEffect, useState } from 'react';
import './App.css';

type Confession = {
  id: string;
  campusId: string;
  campus: { id: string; name: string; slug: string } | null;
  content: string;
  category: string;
  mood: string | null;
  status: string;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
  deletionCode?: string;
};

type Campus = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

const API_URL = 'http://localhost:3001';
const categoryOptions = ['FUN', 'STUDY', 'LOVE', 'OMG', 'GOOD'];

async function fetchConfessions(search = '', categoryFilter = '', sort = 'latest') {
  const params = new URLSearchParams();

  if (search.trim()) params.set('search', search.trim());
  if (categoryFilter) params.set('category', categoryFilter);
  if (sort) params.set('sort', sort);
  params.set('pageSize', '10');

  const response = await fetch(`${API_URL}/confessions?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Impossible de charger les confessions.');
  }

  return response.json() as Promise<Confession[]>;
}

function App() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [content, setContent] = useState('');
  const [mood, setMood] = useState('fatigué·e');
  const [category, setCategory] = useState('STUDY');
  const [campusId, setCampusId] = useState('');
  const [campuses, setCampuses] = useState<Campus[]>([]);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<Array<{ id: string; motif: string; status: string; confessionId: string | null; detail: string | null; campus?: { id: string; name: string } | null }>>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('');
  const [reportCampusFilter, setReportCampusFilter] = useState('');

  const loadConfessions = async () => {
    setLoading(true);
    try {
      const data = await fetchConfessions(search, categoryFilter, sort);
      setConfessions(data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfessions();
  }, [search, categoryFilter, sort]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const params = new URLSearchParams();
        if (reportStatusFilter) params.set('status', reportStatusFilter);
        if (reportCampusFilter) params.set('campusId', reportCampusFilter);

        const response = await fetch(`${API_URL}/reports${params.toString() ? `?${params.toString()}` : ''}`);
        if (!response.ok) return;
        const data = await response.json();
        setReports(data);
      } catch {
        // ignore report load issues in the UI
      }
    };

    const loadCampuses = async () => {
      try {
        const response = await fetch(`${API_URL}/campuses`);
        if (!response.ok) return;
        const data = await response.json();
        setCampuses(data);
        if (data.length > 0 && !campusId) setCampusId(data[0].id);
      } catch {
        // ignore campus load issues in the UI
      }
    };

    void loadReports();
    void loadCampuses();
  }, [reportStatusFilter, reportCampusFilter, campusId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!content.trim()) {
      setStatus('Écris une confession avant de la publier.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campusId: campusId || undefined,
          content,
          mood,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'La publication a échoué.');
      }

      setStatus(`Confession publiée. Code de suppression: ${data.deletionCode}`);
      setContent('');
      setMood('fatigué·e');
      setCategory('STUDY');
      setCampusId('');
      await loadConfessions();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'La publication a échoué.');
    }
  };

  const handleDelete = async (id: string) => {
    const code = window.prompt('Code de suppression :');
    if (!code) return;

    try {
      const response = await fetch(`${API_URL}/confessions/${id}?code=${encodeURIComponent(code)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'Le code est invalide.');
      }

      setStatus('Confession supprimée.');
      await loadConfessions();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'La suppression a échoué.');
    }
  };

  const handleReaction = async (id: string, type: 'FIRE' | 'HAHA' | 'WOW' | 'OUCH' | 'UNDERSTAND') => {
    try {
      const response = await fetch(`${API_URL}/confessions/${id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          deviceHash: `browser-${navigator.userAgent.slice(0, 12)}`,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'La réaction n’a pas pu être enregistrée.');
      }

      setStatus(`Réaction ${type} ajoutée.`);
      await loadConfessions();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Réaction impossible.');
    }
  };

  const handleCommentSubmit = async (id: string) => {
    const content = (commentDrafts[id] ?? '').trim();
    if (!content) {
      setStatus('Écris un commentaire avant de l’envoyer.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/confessions/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          alias: 'Étudiant anonyme',
          deviceHash: `browser-${navigator.userAgent.slice(0, 12)}-comment`,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Le commentaire n’a pas pu être publié.');
      }

      setCommentDrafts((current) => ({ ...current, [id]: '' }));
      setStatus('Commentaire ajouté.');
      await loadConfessions();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Commentaire impossible.');
    }
  };

  const handleReport = async (id: string) => {
    const reason = window.prompt('Motif du signalement (SPAM, HATE, DANGER, HARASSMENT, PERSONAL_DATA) :');
    if (!reason) return;

    try {
      const response = await fetch(`${API_URL}/confessions/${id}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motif: reason.toUpperCase(),
          detail: 'Signalé depuis l’interface CampusConfessions.',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Le signalement n’a pas pu être enregistré.');
      }

      setStatus('Signalement envoyé à la modération.');
      const nextReports = await fetch(`${API_URL}/reports${reportStatusFilter || reportCampusFilter ? `?${new URLSearchParams({ ...(reportStatusFilter ? { status: reportStatusFilter } : {}), ...(reportCampusFilter ? { campusId: reportCampusFilter } : {}) }).toString()}` : ''}`).then((res) => res.json());
      setReports(nextReports);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Signalement impossible.');
    }
  };

  const handleReportStatus = async (reportId: string, nextStatus: 'OPEN' | 'REVIEWED' | 'RESOLVED') => {
    try {
      const response = await fetch(`${API_URL}/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Le statut du signalement n’a pas pu être mis à jour.');
      }

      setStatus(`Signalement ${nextStatus.toLowerCase()}.`);
      const nextReports = await fetch(`${API_URL}/reports${reportStatusFilter || reportCampusFilter ? `?${new URLSearchParams({ ...(reportStatusFilter ? { status: reportStatusFilter } : {}), ...(reportCampusFilter ? { campusId: reportCampusFilter } : {}) }).toString()}` : ''}`).then((res) => res.json());
      setReports(nextReports);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Mise à jour impossible.');
    }
  };

  const handleMaskConfession = async (confessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/confessions/${confessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'MASKED' }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'La confession n’a pas pu être masquée.');
      }

      setStatus('Confession masquée par la modération.');
      await loadConfessions();
      const nextReports = await fetch(`${API_URL}/reports${reportStatusFilter || reportCampusFilter ? `?${new URLSearchParams({ ...(reportStatusFilter ? { status: reportStatusFilter } : {}), ...(reportCampusFilter ? { campusId: reportCampusFilter } : {}) }).toString()}` : ''}`).then((res) => res.json());
      setReports(nextReports);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Masquage impossible.');
    }
  };

  const reportCounts = {
    OPEN: reports.filter((report) => report.status === 'OPEN').length,
    REVIEWED: reports.filter((report) => report.status === 'REVIEWED').length,
    RESOLVED: reports.filter((report) => report.status === 'RESOLVED').length,
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">CampusConfessions</p>
          <h1>Dis-le sans pression</h1>
        </div>
        <div className="pill">Anonyme • Sans jugement</div>
      </header>

      <main className="layout-grid">
        <section className="moderation-panel card">
          <div className="section-heading">
            <span className="dot accent" />
            <h2>Modération</h2>
          </div>

          <div className="dashboard-stats">
            <div>
              <span>Ouverts</span>
              <strong>{reportCounts.OPEN}</strong>
            </div>
            <div>
              <span>À revoir</span>
              <strong>{reportCounts.REVIEWED}</strong>
            </div>
            <div>
              <span>Résolus</span>
              <strong>{reportCounts.RESOLVED}</strong>
            </div>
          </div>

          <div className="filter-row">
            <label>
              <span>Statut</span>
              <select value={reportStatusFilter} onChange={(event) => setReportStatusFilter(event.target.value)}>
                <option value="">Tous</option>
                <option value="OPEN">Ouverts</option>
                <option value="REVIEWED">À revoir</option>
                <option value="RESOLVED">Résolus</option>
              </select>
            </label>

            <label>
              <span>Campus</span>
              <select value={reportCampusFilter} onChange={(event) => setReportCampusFilter(event.target.value)}>
                <option value="">Tous</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="report-list">
            {reports.length === 0 ? (
              <p className="empty-state compact">Aucun signalement pour le moment.</p>
            ) : (
              reports.slice(0, 5).map((report) => (
                <div key={report.id} className="report-item">
                  <strong>{report.motif}</strong>
                  <span>{report.status}</span>
                  <small>{report.detail ?? 'Sans détail'}</small>
                  {report.campus ? <small>{report.campus.name}</small> : null}
                  <div className="report-actions">
                    <button type="button" onClick={() => handleReportStatus(report.id, 'REVIEWED')}>
                      Examiner
                    </button>
                    <button type="button" onClick={() => handleReportStatus(report.id, 'RESOLVED')}>
                      Résoudre
                    </button>
                    {report.confessionId ? (
                      <button type="button" onClick={() => handleMaskConfession(report.confessionId as string)}>
                        Masquer
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="composer card">
          <div className="section-heading">
            <span className="dot" />
            <h2>Publier une confession</h2>
          </div>

          <form onSubmit={handleSubmit} className="composer-form">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Tu peux parler de ton cours, ton amour, ton stress, ton campus..."
              maxLength={2000}
              rows={7}
            />

            <div className="fields-row">
              <label>
                <span>Catégorie</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Humeur</span>
                <input
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                  placeholder="fatigué·e"
                />
              </label>
            </div>

            <button type="submit" className="primary-btn">
              Publier anonymement
            </button>
          </form>
        </section>

        <aside className="filters card">
          <div className="section-heading">
            <span className="dot accent" />
            <h2>Filtrer</h2>
          </div>

          <label>
            <span>Recherche</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Mot-clé, phrase..."
            />
          </label>

          <label>
            <span>Catégorie</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">Toutes</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Tri</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="latest">Les plus récentes</option>
              <option value="oldest">Les plus anciennes</option>
              <option value="popular">Les plus populaires</option>
            </select>
          </label>
        </aside>

        <section className="feed card">
          <div className="feed-header">
            <div className="section-heading">
              <span className="dot" />
              <h2>Dernières confessions</h2>
            </div>
            <span className="meta">{confessions.length} résultats</span>
          </div>

          {status && <div className="status-banner">{status}</div>}

          {loading ? (
            <div className="empty-state">Chargement des confessions...</div>
          ) : confessions.length === 0 ? (
            <div className="empty-state">Aucune confession pour le moment. Sois le premier·e à partager.</div>
          ) : (
            <div className="confession-list">
              {confessions.map((confession) => (
                <article key={confession.id} className="confession-item">
                  <div className="confession-header">
                    <span className="tag">{confession.category}</span>
                    <span className="time">{new Date(confession.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <p className="confession-content">{confession.content}</p>

                  <div className="confession-meta">
                    <span>{confession.mood ?? 'anonyme'}</span>
                    <span>{confession.campus?.name ?? 'Campus global'}</span>
                    <span>{confession.reactionCount} réactions</span>
                    <span>{confession.commentCount} commentaires</span>
                  </div>

                  <div className="action-row">
                    <button type="button" className="reaction-btn" onClick={() => handleReaction(confession.id, 'FIRE')}>
                      🔥
                    </button>
                    <button type="button" className="reaction-btn" onClick={() => handleReaction(confession.id, 'HAHA')}>
                      😄
                    </button>
                    <button type="button" className="reaction-btn" onClick={() => handleReaction(confession.id, 'WOW')}>
                      😮
                    </button>
                    <button type="button" className="delete-btn" onClick={() => handleDelete(confession.id)}>
                      Supprimer
                    </button>
                    <button type="button" className="report-btn" onClick={() => handleReport(confession.id)}>
                      Signaler
                    </button>
                  </div>

                  <div className="comment-box">
                    <textarea
                      value={commentDrafts[confession.id] ?? ''}
                      onChange={(event) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [confession.id]: event.target.value,
                        }))
                      }
                      placeholder="Répondre à cette confession..."
                      rows={2}
                    />
                    <button type="button" className="comment-btn" onClick={() => handleCommentSubmit(confession.id)}>
                      Commenter
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
