import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { supabase } from '../integrations/supabase/client';
import { useTranslation } from '../common/components/LocalizationProvider';
import WhatsAppTab from './whatsapp/WhatsAppTab';

const AdminDashboard = () => {
  const t = useTranslation();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'pwa';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statsData, setStatsData] = useState({
    installations: 0,
    activeSessions: 0,
    expiredSessions: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          navigate('/admin/login');
          return;
        }
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        if (error || !data) {
          console.error('AdminDashboard error fetching tenant:', error);
          navigate('/admin/login');
          return;
        }
        setTenant(data);
      } catch (err) {
        console.error('AdminDashboard checkAuth caught an error:', err);
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!tenant?.id || activeTab !== 'stats') return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [installRes, activeRes, expiredRes] = await Promise.all([
          supabase
            .from('pwa_installations')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id),
          supabase
            .from('traccar_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .gt('expires_at', new Date().toISOString()),
          supabase
            .from('traccar_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .lte('expires_at', new Date().toISOString()),
        ]);
        setStatsData({
          installations: installRes.count || 0,
          activeSessions: activeRes.count || 0,
          expiredSessions: expiredRes.count || 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [tenant?.id, activeTab]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    setMessage('');
    setIsError(false);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          company_name: tenant.company_name,
          color_primary: tenant.color_primary,
          color_secondary: tenant.color_secondary,
          whatsapp_number: tenant.whatsapp_number,
          whatsapp_message: tenant.whatsapp_message,
          logo_url: tenant.logo_url,
          custom_domain: tenant.custom_domain,
          traccar_url: tenant.traccar_url,
          login_sidebar_color: tenant.login_sidebar_color,
          login_bg_image: tenant.login_bg_image,
          login_bg_color: tenant.login_bg_color,
        })
        .eq('id', tenant.id);
      if (error) throw error;
      setIsError(false);
      setMessage(t('adminSavedSuccess'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setIsError(true);
      setMessage(`${t('adminErrorSave')}: ` + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const updateField = (field, value) => {
    setTenant((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setIsError(true);
      setMessage(t('adminErrorFileSize'));
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenant.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(path);
      updateField('logo_url', publicUrl);
      setIsError(false);
      setMessage(t('adminLogoSuccess'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setIsError(true);
      setMessage(`${t('adminErrorLogo')}: ` + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const [uploadingBgImage, setUploadingBgImage] = useState(false);

  const handleBgImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setIsError(true);
      setMessage(t('adminErrorFileSize'));
      return;
    }
    setUploadingBgImage(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenant.id}/login-bg.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(path);
      updateField('login_bg_image', publicUrl);
      setIsError(false);
      setMessage(t('adminBgImageSuccess'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setIsError(true);
      setMessage(`${t('adminErrorLogo')}: ` + err.message);
    } finally {
      setUploadingBgImage(false);
    }
  };

  const getPwaLink = () => {
    if (tenant?.custom_domain) return `https://${tenant.custom_domain}`;
    return `${window.location.origin}/login?tenant=${tenant?.slug}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPwaLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'auto',
          backgroundColor: '#0a0a0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(0,245,160,0.2)',
              borderTopColor: '#00f5a0',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#64748b', fontSize: 14 }}>{t('adminLoadingPanel')}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const cardStyle = {
    padding: 24,
    borderRadius: 16,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const trialDays = tenant?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const tabs = [
    { id: 'pwa', label: `🎨 ${t('adminCustomize')}` },
    { id: 'link', label: `🔗 ${t('adminAppLink')}` },
    { id: 'whatsapp', label: t('whatsappTab') },
    { id: 'plan', label: `📋 ${t('adminPlan')}` },
    { id: 'stats', label: `📊 ${t('adminStatistics')}` },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'auto',
        backgroundColor: '#0a0a0f',
        color: '#e2e8f0',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {tenant?.logo_url ? (
            <img
              src={tenant.logo_url}
              alt="Logo"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                objectFit: 'contain',
              }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 14,
                color: '#0a0a0f',
              }}
            >
              H
            </div>
          )}
          <div>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
              {tenant?.company_name}
            </span>
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                background:
                  tenant?.subscription_status === 'trial'
                    ? 'rgba(255,200,0,0.15)'
                    : 'rgba(0,245,160,0.15)',
                color: tenant?.subscription_status === 'trial' ? '#ffc800' : '#00f5a0',
                fontWeight: 600,
              }}
            >
              {tenant?.subscription_status === 'trial'
                ? `Trial • ${trialDays} ${t('adminDays')}`
                : t('adminPlanActive')}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          {t('adminLogout')}
        </button>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 32,
            padding: 4,
            borderRadius: 12,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                background: activeTab === tab.id ? 'rgba(0,245,160,0.1)' : 'transparent',
                color: activeTab === tab.id ? '#00f5a0' : '#64748b',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PWA Tab */}
        {activeTab === 'pwa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 2-Column Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
                gap: 24,
              }}
            >
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Logo & Identity */}
                <div style={cardStyle}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#fff',
                      margin: '0 0 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    🏢 {t('adminVisualIdentity')}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>{t('adminCompanyName')}</label>
                      <input
                        value={tenant?.company_name || ''}
                        onChange={(e) => updateField('company_name', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('adminCompanyLogo')}</label>
                      {tenant?.logo_url && (
                        <div
                          style={{
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <img
                            src={tenant.logo_url}
                            alt="Logo"
                            style={{
                              maxWidth: 120,
                              maxHeight: 60,
                              width: 'auto',
                              height: 'auto',
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.1)',
                              objectFit: 'contain',
                              background: 'rgba(255,255,255,0.05)',
                              padding: 4,
                            }}
                          />
                          <button
                            onClick={() => updateField('logo_url', '')}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 6,
                              border: '1px solid rgba(255,100,100,0.3)',
                              background: 'rgba(255,100,100,0.1)',
                              color: '#ff6b6b',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: 'inherit',
                            }}
                          >
                            {t('adminRemove')}
                          </button>
                        </div>
                      )}
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '14px 16px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          border: '2px dashed rgba(255,255,255,0.12)',
                          background: 'rgba(255,255,255,0.03)',
                          color: '#94a3b8',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          {uploadingLogo ? t('adminUploading') : `📁 ${t('adminUploadLogo')}`}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={uploadingLogo}
                          onChange={handleLogoUpload}
                        />
                      </label>
                      <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                        {t('adminFileMaxSize')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div style={cardStyle}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#fff',
                      margin: '0 0 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    💬 WhatsApp
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>{t('adminWhatsappNumber')}</label>
                      <input
                        value={tenant?.whatsapp_number || ''}
                        onChange={(e) => updateField('whatsapp_number', e.target.value)}
                        placeholder="5511999999999"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('adminDefaultMessage')}</label>
                      <input
                        value={tenant?.whatsapp_message || ''}
                        onChange={(e) => updateField('whatsapp_message', e.target.value)}
                        placeholder={t('adminWhatsappPlaceholder')}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Login Page Customization */}
                <div style={cardStyle}>
                  <div style={{ marginBottom: 20 }}>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#e2e8f0',
                        margin: '0 0 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      🎨 {t('adminLoginPageSection')}
                    </h3>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                      {t('adminLoginPageDesc')}
                    </p>
                  </div>

                  {/* Color Pickers */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <label style={{ ...labelStyle, marginBottom: 10, display: 'block' }}>
                        {t('adminLoginSidebarColor')}
                      </label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: `2px solid ${tenant?.login_sidebar_color || tenant?.color_primary || '#0f766e'}`,
                            boxShadow: `0 0 12px ${tenant?.login_sidebar_color || tenant?.color_primary || '#0f766e'}40`,
                            flexShrink: 0,
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="color"
                            value={
                              tenant?.login_sidebar_color || tenant?.color_primary || '#0f766e'
                            }
                            onChange={(e) => updateField('login_sidebar_color', e.target.value)}
                            style={{
                              position: 'absolute',
                              inset: -4,
                              width: 'calc(100% + 8px)',
                              height: 'calc(100% + 8px)',
                              border: 'none',
                              cursor: 'pointer',
                              background: 'transparent',
                            }}
                          />
                        </div>
                        <input
                          value={tenant?.login_sidebar_color || ''}
                          onChange={(e) => updateField('login_sidebar_color', e.target.value)}
                          placeholder={tenant?.color_primary || '#0f766e'}
                          style={{
                            ...inputStyle,
                            flex: 1,
                            borderLeft: `3px solid ${tenant?.login_sidebar_color || tenant?.color_primary || '#0f766e'}`,
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <label style={{ ...labelStyle, marginBottom: 10, display: 'block' }}>
                        {t('adminLoginBgColor')}
                      </label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: `2px solid ${tenant?.login_bg_color || '#f5f7fa'}`,
                            boxShadow: `0 0 12px ${tenant?.login_bg_color || '#f5f7fa'}40`,
                            flexShrink: 0,
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="color"
                            value={tenant?.login_bg_color || '#f5f7fa'}
                            onChange={(e) => updateField('login_bg_color', e.target.value)}
                            style={{
                              position: 'absolute',
                              inset: -4,
                              width: 'calc(100% + 8px)',
                              height: 'calc(100% + 8px)',
                              border: 'none',
                              cursor: 'pointer',
                              background: 'transparent',
                            }}
                          />
                        </div>
                        <input
                          value={tenant?.login_bg_color || ''}
                          onChange={(e) => updateField('login_bg_color', e.target.value)}
                          placeholder="#f5f7fa"
                          style={{
                            ...inputStyle,
                            flex: 1,
                            borderLeft: `3px solid ${tenant?.login_bg_color || '#f5f7fa'}`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Background Image Upload */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ ...labelStyle, marginBottom: 10, display: 'block' }}>
                      {t('adminLoginBgImage')}
                    </label>
                    {tenant?.login_bg_image ? (
                      <div
                        style={{
                          position: 'relative',
                          borderRadius: 12,
                          overflow: 'hidden',
                          height: 120,
                          backgroundImage: `url(${tenant.login_bg_image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                          }}
                        >
                          <label
                            style={{
                              padding: '8px 16px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              background: 'rgba(255,255,255,0.15)',
                              color: '#fff',
                              fontSize: 13,
                              fontWeight: 600,
                              backdropFilter: 'blur(4px)',
                              border: '1px solid rgba(255,255,255,0.2)',
                            }}
                          >
                            🔄 {t('adminChangeImage')}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              disabled={uploadingBgImage}
                              onChange={handleBgImageUpload}
                            />
                          </label>
                          <button
                            onClick={() => updateField('login_bg_image', '')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 8,
                              border: '1px solid rgba(255,100,100,0.3)',
                              background: 'rgba(255,80,80,0.2)',
                              color: '#ff8a8a',
                              cursor: 'pointer',
                              fontSize: 13,
                              fontWeight: 600,
                              fontFamily: 'inherit',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            ✕ {t('sharedRemove')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '24px 16px',
                          borderRadius: 12,
                          cursor: 'pointer',
                          border: '2px dashed rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.02)',
                          color: '#64748b',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ fontSize: 28 }}>🖼️</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {uploadingBgImage ? t('adminUploading') : t('adminUploadBgImage')}
                        </span>
                        <span style={{ fontSize: 11, color: '#475569' }}>
                          {t('adminFileMaxSize')}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={uploadingBgImage}
                          onChange={handleBgImageUpload}
                        />
                      </label>
                    )}
                  </div>

                  {/* Realistic Preview */}
                  <div>
                    <label style={{ ...labelStyle, marginBottom: 10, display: 'block' }}>
                      {t('adminLoginPreview')}
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        height: 200,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div
                        style={{
                          width: 100,
                          background: `linear-gradient(180deg, ${tenant?.login_sidebar_color || tenant?.color_primary || '#0f766e'} 0%, ${tenant?.login_sidebar_color || tenant?.color_primary || '#0f766e'}cc 100%)`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              background: 'rgba(255,255,255,0.5)',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            width: 40,
                            height: 3,
                            borderRadius: 2,
                            background: 'rgba(255,255,255,0.2)',
                          }}
                        />
                        <div
                          style={{
                            width: 36,
                            height: 3,
                            borderRadius: 2,
                            background: 'rgba(255,255,255,0.15)',
                          }}
                        />
                        <div
                          style={{
                            width: 44,
                            height: 10,
                            borderRadius: 4,
                            background: 'rgba(255,255,255,0.2)',
                            marginTop: 6,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          flex: 1,
                          position: 'relative',
                          background: tenant?.login_bg_image
                            ? `url(${tenant.login_bg_image}) center/cover`
                            : tenant?.login_bg_color || '#f5f7fa',
                        }}
                      >
                        {tenant?.login_bg_image && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.5)',
                            }}
                          />
                        )}
                        <div
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: 8,
                            padding: 20,
                          }}
                        >
                          <div
                            style={{
                              width: '60%',
                              height: 6,
                              borderRadius: 3,
                              background: tenant?.login_bg_image
                                ? 'rgba(255,255,255,0.3)'
                                : 'rgba(0,0,0,0.08)',
                            }}
                          />
                          <div
                            style={{
                              width: '50%',
                              height: 6,
                              borderRadius: 3,
                              background: tenant?.login_bg_image
                                ? 'rgba(255,255,255,0.2)'
                                : 'rgba(0,0,0,0.06)',
                            }}
                          />
                          <div
                            style={{
                              width: '40%',
                              height: 14,
                              borderRadius: 5,
                              marginTop: 6,
                              background:
                                tenant?.login_sidebar_color || tenant?.color_primary || '#0f766e',
                              opacity: 0.8,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Config */}
                <div style={cardStyle}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#fff',
                      margin: '0 0 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    ⚙️ {t('adminTechnicalConfig')}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>{t('adminTraccarUrl')}</label>
                      <input
                        value={tenant?.traccar_url || ''}
                        onChange={(e) => updateField('traccar_url', e.target.value)}
                        placeholder="https://traccar.example.com"
                        style={inputStyle}
                      />
                      <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                        {t('adminTraccarUrlHint')}
                      </p>
                    </div>
                    <div>
                      <label style={labelStyle}>{t('adminCustomDomain')}</label>
                      <input
                        value={tenant?.custom_domain || ''}
                        onChange={(e) => updateField('custom_domain', e.target.value)}
                        placeholder="app.yourcompany.com"
                        style={inputStyle}
                      />
                      <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                        {t('adminCustomDomainHint')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message + Save Button - Full Width */}
            {message && (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  margin: 0,
                  color: isError ? '#ff6b6b' : '#00f5a0',
                }}
              >
                {message}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '16px 0',
                borderRadius: 12,
                border: 'none',
                cursor: saving ? 'default' : 'pointer',
                fontWeight: 700,
                fontSize: 16,
                fontFamily: 'inherit',
                background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
                color: '#0a0a0f',
                opacity: saving ? 0.5 : 1,
                transition: 'opacity 0.2s, transform 0.1s',
                letterSpacing: '0.02em',
              }}
            >
              {saving ? t('adminSaving') : `💾 ${t('adminSaveChanges')}`}
            </button>
          </div>
        )}

        {/* Link Tab */}
        {activeTab === 'link' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
              style={{
                padding: 32,
                borderRadius: 16,
                textAlign: 'center',
                background:
                  'linear-gradient(180deg, rgba(0,245,160,0.06) 0%, rgba(10,10,15,1) 50%)',
                border: '1px solid rgba(0,245,160,0.2)',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
                {t('adminYourAppLink')}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 24px' }}>
                {t('adminShareLink')}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    color: '#00f5a0',
                    fontSize: 14,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                  }}
                >
                  {getPwaLink()}
                </span>
                <button
                  onClick={handleCopyLink}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    background: copied ? '#00f5a0' : 'rgba(0,245,160,0.15)',
                    color: copied ? '#0a0a0f' : '#00f5a0',
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? t('adminCopied') : t('adminCopy')}
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <a
                  href={getPwaLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  {t('adminOpenApp')} ↗
                </a>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
                {t('adminHowItWorks')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { step: '1', title: t('adminStep1Title'), desc: t('adminStep1Desc') },
                  { step: '2', title: t('adminStep2Title'), desc: t('adminStep2Desc') },
                  { step: '3', title: t('adminStep3Title'), desc: t('adminStep3Desc') },
                ].map((item) => (
                  <div
                    key={item.step}
                    style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: 'rgba(0,245,160,0.1)',
                        color: '#00f5a0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                        {item.title}
                      </div>
                      <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>
                {t('adminAppInfo')}
              </h3>
              {[
                ['Slug', tenant?.slug],
                [t('adminCustomDomain'), tenant?.custom_domain || t('adminCustomDomainNotSet')],
                [t('adminTraccarUrl'), tenant?.traccar_url || t('adminCustomDomainNotSet')],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ color: '#64748b', fontSize: 14 }}>{label}</span>
                  <span
                    style={{
                      color: '#e2e8f0',
                      fontSize: 14,
                      fontWeight: 600,
                      maxWidth: '60%',
                      textAlign: 'right',
                      wordBreak: 'break-all',
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
              style={{
                padding: 32,
                borderRadius: 16,
                textAlign: 'center',
                background:
                  tenant?.subscription_status === 'trial'
                    ? 'linear-gradient(180deg, rgba(255,200,0,0.06) 0%, rgba(10,10,15,1) 50%)'
                    : 'linear-gradient(180deg, rgba(0,245,160,0.06) 0%, rgba(10,10,15,1) 50%)',
                border: `1px solid ${tenant?.subscription_status === 'trial' ? 'rgba(255,200,0,0.2)' : 'rgba(0,245,160,0.2)'}`,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: 20,
                  marginBottom: 16,
                  background:
                    tenant?.subscription_status === 'trial'
                      ? 'rgba(255,200,0,0.1)'
                      : 'rgba(0,245,160,0.1)',
                  color: tenant?.subscription_status === 'trial' ? '#ffc800' : '#00f5a0',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {tenant?.subscription_status === 'trial'
                  ? `⏳ ${t('adminTrialPeriod')}`
                  : `✅ ${t('adminPlanActive')}`}
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
                {t('adminFullPlanTitle')}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 0 24px' }}>
                {t('adminFullPlanPrice')}
              </p>
              {tenant?.subscription_status === 'trial' && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: 'rgba(255,200,0,0.05)',
                    border: '1px solid rgba(255,200,0,0.15)',
                    marginBottom: 16,
                  }}
                >
                  <p style={{ color: '#ffc800', fontSize: 14, fontWeight: 600, margin: 0 }}>
                    {(t('adminTrialEndsIn') || 'Trial ends in {0} days').replace('{0}', trialDays)}(
                    {tenant?.trial_ends_at ? dayjs(tenant.trial_ends_at).format('L') : ''})
                  </p>
                </div>
              )}
              <button
                style={{
                  padding: '14px 40px',
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
                {tenant?.subscription_status === 'trial'
                  ? t('adminSubscribeNow')
                  : t('adminManagePlan')}
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
                {t('adminAccountDetails')}
              </h3>
              {[
                ['Email', tenant?.owner_email],
                [
                  t('adminCreatedAt'),
                  tenant?.created_at ? dayjs(tenant.created_at).format('L') : '-',
                ],
                ['Status', tenant?.subscription_status],
                [t('adminPlan'), tenant?.plan_type],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ color: '#64748b', fontSize: 14 }}>{label}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && <WhatsAppTab t={t} />}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Plano Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[
                {
                  label: 'Status',
                  value: tenant?.subscription_status === 'trial' ? 'Trial' : t('adminPlanActive'),
                  color: '#ffc800',
                },
                { label: t('adminDaysRemaining'), value: trialDays, color: '#00d9f5' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: 24,
                    borderRadius: 16,
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ fontSize: 32, fontWeight: 900, color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Uso em Tempo Real */}
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#e2e8f0',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                📡 {t('adminRealTimeUsage')}
                {statsLoading && (
                  <span style={{ fontSize: 12, color: '#64748b' }}>({t('adminUpdating')})</span>
                )}
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                }}
              >
                {[
                  {
                    label: t('adminPwaInstallations'),
                    value: statsData.installations,
                    color: '#a78bfa',
                    icon: '📲',
                  },
                  {
                    label: t('adminActiveSessions'),
                    value: statsData.activeSessions,
                    color: '#10b981',
                    icon: '🟢',
                  },
                  {
                    label: t('adminExpiredSessions'),
                    value: statsData.expiredSessions,
                    color: '#ef4444',
                    icon: '🔴',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: stat.color }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#475569', marginTop: 16, textAlign: 'center' }}>
                {t('adminAutoUpdate')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
