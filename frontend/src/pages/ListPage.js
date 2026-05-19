import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonPlansApi } from '../services/api';
import s from './ListPage.module.css';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ListPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [filters, setFilters] = useState({
    search: '', discipline: '', tag: '', scheduled_date: '',
    sort_by: 'created_at', sort_order: 'desc', page: 1,
  });

  const debouncedSearch = useDebounce(filters.search, 350);
  const debouncedDiscipline = useDebounce(filters.discipline, 350);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await lessonPlansApi.list({
        page: filters.page,
        per_page: 8,
        search: debouncedSearch,
        discipline: debouncedDiscipline,
        tag: filters.tag,
        scheduled_date: filters.scheduled_date,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      });
      setPlans(data.items);
      setMeta({ total: data.total, page: data.page, pages: data.pages });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.tag, filters.scheduled_date, filters.sort_by, filters.sort_order, debouncedSearch, debouncedDiscipline]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value, page: key === 'page' ? value : 1 }));

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await lessonPlansApi.delete(id);
      setConfirmDelete(null);
      fetchPlans();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Planos de Aula</h1>
          <p className={s.subtitle}>{meta.total} plano{meta.total !== 1 ? 's' : ''} cadastrado{meta.total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className={s.filters}>
        <div className={s.searchWrap}>
          <span className={s.searchIcon}>🔍</span>
          <input
            className={s.searchInput}
            placeholder="Buscar por título..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>
        <input
          className={s.filterInput}
          placeholder="Disciplina"
          value={filters.discipline}
          onChange={e => setFilter('discipline', e.target.value)}
        />
        <input
          className={s.filterInput}
          placeholder="Tag"
          value={filters.tag}
          onChange={e => setFilter('tag', e.target.value)}
        />
        <input
          className={s.filterInput}
          type="date"
          value={filters.scheduled_date}
          onChange={e => setFilter('scheduled_date', e.target.value)}
          title="Filtrar por data prevista"
        />
        <div className={s.sortWrap}>
          <select className={s.select} value={filters.sort_by} onChange={e => setFilter('sort_by', e.target.value)}>
            <option value="created_at">Data de cadastro</option>
            <option value="title">Título</option>
          </select>
          <button
            className={s.sortDir}
            onClick={() => setFilter('sort_order', filters.sort_order === 'desc' ? 'asc' : 'desc')}
            title="Inverter ordem"
          >
            {filters.sort_order === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {error && <div className={s.error}>⚠️ {error}</div>}

      {loading ? (
        <div className={s.loadingGrid}>
          {[...Array(6)].map((_, i) => <div key={i} className={s.skeleton} />)}
        </div>
      ) : plans.length === 0 ? (
        <div className={s.empty}>
          <span className={s.emptyIcon}>📝</span>
          <p>Nenhum plano de aula encontrado.</p>
          <button className={s.emptyBtn} onClick={() => navigate('/novo')}>Criar primeiro plano</button>
        </div>
      ) : (
        <div className={s.grid}>
          {plans.map(plan => (
            <div key={plan.id} className={s.card}>
              <div className={s.cardTop}>
                <span className={s.discipline}>{plan.discipline}</span>
                {plan.scheduled_date && (
                  <span className={s.date}>{formatDate(plan.scheduled_date)}</span>
                )}
              </div>
              <h3 className={s.cardTitle}>{plan.title}</h3>
              <p className={s.cardSummary}>{plan.summary}</p>
              {plan.tags?.length > 0 && (
                <div className={s.tags}>
                  {plan.tags.slice(0, 4).map(t => (
                    <span key={t} className={s.tag}>{t}</span>
                  ))}
                </div>
              )}
              <div className={s.cardActions}>
                <button className={s.editBtn} onClick={() => navigate(`/editar/${plan.id}`)}>Editar</button>
                <button
                  className={s.deleteBtn}
                  onClick={() => setConfirmDelete(plan.id)}
                >Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta.pages > 1 && (
        <div className={s.pagination}>
          <button disabled={meta.page <= 1} onClick={() => setFilter('page', meta.page - 1)} className={s.pageBtn}>← Anterior</button>
          <span className={s.pageInfo}>Página {meta.page} de {meta.pages}</span>
          <button disabled={meta.page >= meta.pages} onClick={() => setFilter('page', meta.page + 1)} className={s.pageBtn}>Próxima →</button>
        </div>
      )}

      {confirmDelete && (
        <div className={s.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <h3>Confirmar exclusão</h3>
            <p>Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.</p>
            <div className={s.modalActions}>
              <button className={s.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button
                className={s.confirmDeleteBtn}
                disabled={deleting === confirmDelete}
                onClick={() => handleDelete(confirmDelete)}
              >
                {deleting === confirmDelete ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
