import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useTranslation } from '../common/components/LocalizationProvider';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      navigate('/admin');
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? t('loginInvalidCredentials')
          : err.message || t('loginErrorGeneric'),
      );
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
      <div style={{ width: '100%', maxWidth: 400 }}>
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
            {t('loginCompanyPanel')}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>{t('loginEnterCredentials')}</p>
        </div>

        <form
          onSubmit={handleLogin}
          style={{
            padding: 28,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: 6,
              }}
            >
              {t('loginPassword')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </div>

          {error && <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || !password}
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
              opacity: loading || !email || !password ? 0.5 : 1,
            }}
          >
            {loading ? t('loginEntering') : t('loginEnter')}
          </button>
        </form>

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
            {t('loginNoAccount')}{' '}
            <span
              onClick={() => navigate('/onboarding')}
              style={{ color: '#00f5a0', cursor: 'pointer', fontWeight: 600 }}
            >
              {t('loginCreateCompany')}
            </span>
          </p>
          <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
            <span onClick={() => navigate('/')} style={{ color: '#64748b', cursor: 'pointer' }}>
              ← {t('loginGoBack')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
