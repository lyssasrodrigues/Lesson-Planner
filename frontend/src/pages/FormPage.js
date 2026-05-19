import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonPlansApi, aiApi } from '../services/api';
import s from './FormPage.module.css';

const EMPTY_FORM = {
  title: '', objective: '', summary: '', scheduled_date: '',
  discipline: '', contents: '', support_resources: '', tags: [],
};

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Título é obrigatório.';
  if (!form.objective.trim()) errors.objective = 'Objetivo é obrigatório.';
  if (!form.summary.trim()) errors.summary = 'Ementa é obrigatória.';
  if (!form.discipline.trim()) errors.discipline = 'Disciplina é obrigatória.';
  return errors;
}

export default function FormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(isEdit);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    lessonPlansApi.get(id)
      .then(plan => {
        setForm({
          title: plan.title || '',
          objective: plan.objective || '',
          summary: plan.summary || '',
          scheduled_date: plan.scheduled_date || '',
          discipline: plan.discipline || '',
          contents: plan.contents || '',
          support_resources: plan.support_resources || '',
          tags: plan.tags || [],
        });
      })
      .catch(err => alert('Erro ao carregar plano: ' + err.message))
      .finally(() => setLoadingPlan(false));
  }, [id, isEdit]);

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (!t || form.tags.includes(t)) return;
    set('tags', [...form.tags, t]);
    setTagInput('');
  };

  const removeTag = (tag) => set('tags', form.tags.filter(t => t !== tag));

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleSmartAssist = async () => {
    if (!form.title.trim() || !form.discipline.trim() || !form.summary.trim()) {
      setAiError('Preencha Título, Disciplina e Ementa antes de usar o Smart Assist.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(false);
    try {
      const rec = await aiApi.recommend({
        title: form.title,
        discipline: form.discipline,
        summary: form.summary,
      });
      setForm(f => ({
        ...f,
        contents: rec.contents || f.contents,
        support_resources: rec.support_resources || f.support_resources,
        tags: rec.tags?.length ? rec.tags : f.tags,
      }));
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 4000);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags };
      if (isEdit) {
        await lessonPlansApi.update(id, payload);
      } else {
        await lessonPlansApi.create(payload);
      }
      navigate('/');
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingPlan) return (
    <div className={s.loadingPage}>
      <div className={s.spinner} />
      <p>Carregando plano...</p>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <button className={s.backBtn} onClick={() => navigate('/')}>← Voltar</button>
        <h1 className={s.title}>{isEdit ? 'Editar Plano de Aula' : 'Novo Plano de Aula'}</h1>
      </div>

      <div className={s.formGrid}>
        {/* LEFT COLUMN */}
        <div className={s.leftCol}>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Informações Básicas</h2>

            <div className={s.field}>
              <label className={s.label}>Título da Aula *</label>
              <input
                className={`${s.input} ${errors.title ? s.inputError : ''}`}
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Introdução ao OSPF"
              />
              {errors.title && <span className={s.errorMsg}>{errors.title}</span>}
            </div>

            <div className={s.row}>
              <div className={s.field}>
                <label className={s.label}>Disciplina *</label>
                <input
                  className={`${s.input} ${errors.discipline ? s.inputError : ''}`}
                  value={form.discipline}
                  onChange={e => set('discipline', e.target.value)}
                  placeholder="Ex: Redes de Computadores"
                />
                {errors.discipline && <span className={s.errorMsg}>{errors.discipline}</span>}
              </div>
              <div className={s.field}>
                <label className={s.label}>Data Prevista</label>
                <input
                  className={s.input}
                  type="date"
                  value={form.scheduled_date}
                  onChange={e => set('scheduled_date', e.target.value)}
                />
              </div>
            </div>

            <div className={s.field}>
              <label className={s.label}>Objetivo *</label>
              <textarea
                className={`${s.textarea} ${errors.objective ? s.inputError : ''}`}
                rows={3}
                value={form.objective}
                onChange={e => set('objective', e.target.value)}
                placeholder="Descreva o objetivo pedagógico da aula..."
              />
              {errors.objective && <span className={s.errorMsg}>{errors.objective}</span>}
            </div>

            <div className={s.field}>
              <label className={s.label}>Ementa / Resumo *</label>
              <textarea
                className={`${s.textarea} ${errors.summary ? s.inputError : ''}`}
                rows={4}
                value={form.summary}
                onChange={e => set('summary', e.target.value)}
                placeholder="Descreva o conteúdo e abordagem da aula..."
              />
              {errors.summary && <span className={s.errorMsg}>{errors.summary}</span>}
            </div>
          </section>

          {/* SMART ASSIST */}
          <section className={s.aiSection}>
            <div className={s.aiHeader}>
              <div>
                <h2 className={s.sectionTitle}>✨ Smart Assist</h2>
                <p className={s.aiDesc}>Gere sugestões com IA baseadas no título, disciplina e ementa.</p>
              </div>
              <button
                className={s.aiBtn}
                onClick={handleSmartAssist}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <><span className={s.spinnerSmall} /> Gerando...</>
                ) : (
                  '🤖 Gerar Recomendações com IA'
                )}
              </button>
            </div>
            {aiError && <div className={s.aiError}>⚠️ {aiError}</div>}
            {aiSuccess && <div className={s.aiSuccess}>✅ Sugestões aplicadas com sucesso!</div>}

            {aiLoading && (
              <div className={s.aiThinking}>
                <div className={s.aiThinkingDots}>
                  <span /><span /><span />
                </div>
                <p>Assistente pedagógico analisando a aula...</p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className={s.rightCol}>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Conteúdo e Recursos</h2>

            <div className={s.field}>
              <label className={s.label}>Conteúdos</label>
              <textarea
                className={s.textarea}
                rows={5}
                value={form.contents}
                onChange={e => set('contents', e.target.value)}
                placeholder="Liste os conteúdos abordados, separados por ponto e vírgula..."
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>Recursos de Apoio</label>
              <textarea
                className={s.textarea}
                rows={4}
                value={form.support_resources}
                onChange={e => set('support_resources', e.target.value)}
                placeholder="Livros, artigos, vídeos, ferramentas..."
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>Tags</label>
              <div className={s.tagWrap}>
                {form.tags.map(tag => (
                  <span key={tag} className={s.tagChip}>
                    {tag}
                    <button className={s.tagRemove} onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
                <input
                  className={s.tagInput}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  onBlur={() => tagInput && addTag(tagInput)}
                  placeholder="Adicionar tag (Enter para confirmar)"
                />
              </div>
            </div>
          </section>

          <div className={s.formActions}>
            <button className={s.cancelBtn} onClick={() => navigate('/')}>Cancelar</button>
            <button
              className={s.saveBtn}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Plano'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
