import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../common/components/LocalizationProvider';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    company_name: '',
    owner_email: '',
    password: '',
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const isValid =
    form.company_name.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.owner_email) &&
    form.password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          company_name: form.company_name,
          owner_email: form.owner_email,
          password: form.password,
          traccar_url: 'https://pending-setup.example.com',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.data);
      } else {
        setError(data.message || t('onboardingErrorCreate'));
      }
    } catch (err) {
      setError(t('onboardingErrorConnection'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#e2e8f0',
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 22,
              color: '#0a0a0f',
            }}
          >
            H
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
            {success ? t('onboardingSuccessTitle') : t('onboardingTitle')}
          </h1>
          {!success && (
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{t('onboardingSubtitle')}</p>
          )}
        </div>

        <div
          style={{
            padding: 28,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {!success ? (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <label style={labelStyle}>{t('onboardingCompanyName')}</label>
                <input
                  type="text"
                  placeholder={t('onboardingCompanyPlaceholder')}
                  value={form.company_name}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>{t('onboardingEmail')}</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={form.owner_email}
                  onChange={(e) => updateField('owner_email', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  {t('onboardingPassword')}{' '}
                  <span style={{ color: '#475569', fontWeight: 400 }}>
                    {t('onboardingPasswordHint')}
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  style={inputStyle}
                />
              </div>

              {error && <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={!isValid || loading}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: 'inherit',
                  background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
                  color: '#0a0a0f',
                  opacity: !isValid || loading ? 0.5 : 1,
                }}
              >
                {loading ? t('onboardingCreating') : t('onboardingCreateButton')}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                {t('onboardingSuccessCompany').replace('{0}', '')}
                <strong style={{ color: '#00f5a0' }}>{success.company_name}</strong>
                <br />
                {t('onboardingSuccessTrial').replace(
                  '{0}',
                  new Date(success.trial_ends_at).toLocaleDateString(),
                )}
              </p>
              <p style={{ color: '#64748b', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                {t('onboardingSuccessDesc')}
              </p>
              <button
                onClick={() => navigate('/admin/login')}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: 'inherit',
                  background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
                  color: '#0a0a0f',
                }}
              >
                {t('onboardingEnterPanel')}
              </button>
            </div>
          )}
        </div>

        {!success && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
              {t('onboardingHasAccount')}{' '}
              <span
                onClick={() => navigate('/admin/login')}
                style={{ color: '#00f5a0', cursor: 'pointer', fontWeight: 600 }}
              >
                {t('onboardingSignIn')}
              </span>
            </p>
            <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
              <span onClick={() => navigate('/')} style={{ color: '#64748b', cursor: 'pointer' }}>
                {t('onboardingGoBack')}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
