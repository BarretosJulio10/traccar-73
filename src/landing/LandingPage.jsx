import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../common/components/LocalizationProvider';
import { PRODUCT_NAME } from '../common/util/constants';

const LandingPage = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  const monthlyPrice = '24,90';
  const yearlyPrice = '21,90';

  const allFeatures = [
    t('landingAllFeature1'),
    t('landingAllFeature2'),
    t('landingAllFeature3'),
    t('landingAllFeature4'),
    t('landingAllFeature5'),
    t('landingAllFeature6'),
    t('landingAllFeature7'),
    t('landingAllFeature8'),
    t('landingAllFeature9'),
    t('landingAllFeature10'),
  ];

  const features = [
    { icon: '📱', title: t('landingFeature1Title'), description: t('landingFeature1Desc') },
    { icon: '🎨', title: t('landingFeature2Title'), description: t('landingFeature2Desc') },
    { icon: '🗺️', title: t('landingFeature3Title'), description: t('landingFeature3Desc') },
    { icon: '📊', title: t('landingFeature4Title'), description: t('landingFeature4Desc') },
    { icon: '🔔', title: t('landingFeature5Title'), description: t('landingFeature5Desc') },
    { icon: '💬', title: t('landingFeature6Title'), description: t('landingFeature6Desc') },
  ];

  const faqs = [
    { q: t('landingFaq1Q'), a: t('landingFaq1A') },
    { q: t('landingFaq2Q'), a: t('landingFaq2A') },
    { q: t('landingFaq3Q'), a: t('landingFaq3A') },
    { q: t('landingFaq4Q'), a: t('landingFaq4A') },
    { q: t('landingFaq5Q'), a: t('landingFaq5A') },
    { q: t('landingFaq6Q'), a: t('landingFaq6A') },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#e2e8f0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '12px 16px',
          background: 'rgba(10,10,15,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,245,160,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              flexShrink: 0,
              background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 16,
              color: '#0a0a0f',
            }}
          >
            H
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', whiteSpace: 'nowrap' }}>
            {PRODUCT_NAME}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => navigate('/admin/login')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(0,245,160,0.3)',
              background: 'transparent',
              color: '#00f5a0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            {t('landingEnter')}
          </button>
          <button
            onClick={() =>
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
            }
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
              color: '#0a0a0f',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            {t('landingStartNow')}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 24px 80px',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(0,245,160,0.08) 0%, transparent 60%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(0,245,160,0.03)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 20,
            border: '1px solid rgba(0,245,160,0.2)',
            background: 'rgba(0,245,160,0.05)',
            fontSize: 13,
            fontWeight: 600,
            color: '#00f5a0',
            marginBottom: 24,
            letterSpacing: 1,
          }}
        >
          {t('landingBadge')}
        </div>
        <h1
          style={{
            fontSize: 'clamp(32px, 5.5vw, 68px)',
            fontWeight: 900,
            lineHeight: 1.1,
            maxWidth: 900,
            margin: '0 0 24px',
            background: 'linear-gradient(135deg, #fff 30%, #00f5a0 70%, #00d9f5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('landingHeroTitle')}
        </h1>
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#94a3b8',
            maxWidth: 640,
            margin: '0 0 16px',
            lineHeight: 1.7,
          }}
        >
          {t('landingHeroSubtitle')}
        </p>
        <p
          style={{
            fontSize: 14,
            color: '#64748b',
            maxWidth: 500,
            margin: '0 0 40px',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}
        >
          {t('landingHeroDisclaimer')}
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              padding: '16px 40px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
              color: '#0a0a0f',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 16,
              boxShadow: '0 0 40px rgba(0,245,160,0.2)',
            }}
          >
            {t('landingStartFree')}
          </button>
          <button
            onClick={() =>
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
            }
            style={{
              padding: '16px 40px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {t('landingViewFeatures')}
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 60,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            { n: '500+', l: t('landingStat1') },
            { n: '50K+', l: t('landingStat2') },
            { n: '99.9%', l: t('landingStat3') },
          ].map((s) => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#00f5a0' }}>{s.n}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What it is */}
      <section
        style={{
          padding: '80px 24px',
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            padding: 32,
            borderRadius: 20,
            background: 'rgba(0,245,160,0.03)',
            border: '1px solid rgba(0,245,160,0.1)',
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 16 }}>
            {t('landingWhatIsTitle')}
          </h2>
          <p
            style={{
              color: '#94a3b8',
              lineHeight: 1.8,
              fontSize: 16,
              maxWidth: 700,
              margin: '0 auto',
            }}
          >
            {t('landingWhatIsDesc1')}
            <strong style={{ color: '#00f5a0' }}>{t('landingWhatIsHighlight')}</strong>
            {t('landingWhatIsDesc2')}
            <br />
            <br />
            <strong style={{ color: '#fff' }}>{t('landingWhatIsBottom')}</strong>
          </p>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{
          padding: '80px 24px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800,
              color: '#fff',
              marginBottom: 16,
            }}
          >
            {t('landingFeaturesTitle')}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
            {t('landingFeaturesSubtitle')}
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: 32,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: 15 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section
        style={{
          padding: '100px 24px',
          maxWidth: 900,
          margin: '0 auto',
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(0,217,245,0.04) 0%, transparent 60%)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800,
              color: '#fff',
              marginBottom: 16,
            }}
          >
            {t('landingHowItWorksTitle')}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 18 }}>{t('landingHowItWorksSubtitle')}</p>
        </div>
        {[
          { step: '01', title: t('landingStep1Title'), desc: t('landingStep1Desc') },
          { step: '02', title: t('landingStep2Title'), desc: t('landingStep2Desc') },
          { step: '03', title: t('landingStep3Title'), desc: t('landingStep3Desc') },
        ].map((s) => (
          <div
            key={s.step}
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'flex-start',
              marginBottom: 48,
            }}
          >
            <div
              style={{
                minWidth: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(0,245,160,0.15), rgba(0,217,245,0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 20,
                color: '#00f5a0',
                border: '1px solid rgba(0,245,160,0.2)',
              }}
            >
              {s.step}
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                {s.title}
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: 15 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Included vs Not Included */}
      <section
        style={{
          padding: '80px 24px',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#fff',
            textAlign: 'center',
            marginBottom: 48,
          }}
        >
          {t('landingIncludedTitle')}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          <div
            style={{
              padding: 28,
              borderRadius: 16,
              background: 'rgba(0,245,160,0.04)',
              border: '1px solid rgba(0,245,160,0.15)',
            }}
          >
            <h3 style={{ color: '#00f5a0', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {t('landingIncluded')}
            </h3>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                style={{
                  padding: '6px 0',
                  fontSize: 14,
                  color: '#cbd5e1',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <span style={{ color: '#00f5a0' }}>✓</span> {t(`landingIncluded${i}`)}
              </div>
            ))}
          </div>
          <div
            style={{
              padding: 28,
              borderRadius: 16,
              background: 'rgba(255,100,100,0.03)',
              border: '1px solid rgba(255,100,100,0.1)',
            }}
          >
            <h3 style={{ color: '#ff6b6b', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {t('landingNotIncluded')}
            </h3>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  padding: '6px 0',
                  fontSize: 14,
                  color: '#94a3b8',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <span style={{ color: '#ff6b6b' }}>✗</span> {t(`landingNotIncluded${i}`)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        style={{
          padding: '100px 24px',
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800,
              color: '#fff',
              marginBottom: 16,
            }}
          >
            {t('landingPriceTitle')}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 18, marginBottom: 32 }}>
            {t('landingPriceSubtitle')}
          </p>
          <div
            style={{
              display: 'inline-flex',
              borderRadius: 12,
              padding: 4,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <button
              onClick={() => setAnnual(false)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                background: !annual ? 'rgba(0,245,160,0.15)' : 'transparent',
                color: !annual ? '#00f5a0' : '#94a3b8',
              }}
            >
              {t('landingMonthly')}
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                background: annual ? 'rgba(0,245,160,0.15)' : 'transparent',
                color: annual ? '#00f5a0' : '#94a3b8',
              }}
            >
              {t('landingAnnual')}{' '}
              <span style={{ fontSize: 12, color: '#00f5a0', marginLeft: 4 }}>
                {t('landingAnnualDiscount')}
              </span>
            </button>
          </div>
        </div>

        <div
          style={{
            padding: 40,
            borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(0,245,160,0.06) 0%, rgba(10,10,15,1) 40%)',
            border: '1px solid rgba(0,245,160,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 56, fontWeight: 900, color: '#fff' }}>
              R${annual ? yearlyPrice : monthlyPrice}
            </span>
            <span style={{ color: '#64748b', fontSize: 16 }}>{t('landingPerMonth')}</span>
          </div>
          {annual && (
            <p style={{ color: '#00f5a0', fontSize: 13, marginBottom: 24 }}>
              {t('landingAnnualSavings')}
            </p>
          )}
          {!annual && <div style={{ marginBottom: 24 }} />}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', textAlign: 'left' }}>
            {allFeatures.map((f) => (
              <li
                key={f}
                style={{
                  padding: '10px 0',
                  fontSize: 15,
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ color: '#00f5a0', fontSize: 16 }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 16,
              background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
              color: '#0a0a0f',
              boxShadow: '0 0 40px rgba(0,245,160,0.15)',
            }}
          >
            {t('landingStartTrial')}
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{
          padding: '100px 24px',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#fff',
            textAlign: 'center',
            marginBottom: 48,
          }}
        >
          {t('landingFaqTitle')}
        </h2>
        {faqs.map((faq, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              background: openFaq === i ? 'rgba(255,255,255,0.03)' : 'transparent',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%',
                padding: '20px 24px',
                border: 'none',
                background: 'transparent',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {faq.q}
              <span
                style={{
                  transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  fontSize: 20,
                  color: '#00f5a0',
                }}
              >
                ▼
              </span>
            </button>
            {openFaq === i && (
              <div
                style={{ padding: '0 24px 20px', color: '#94a3b8', lineHeight: 1.7, fontSize: 15 }}
              >
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '100px 24px',
          textAlign: 'center',
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(0,245,160,0.06) 0%, transparent 50%)',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#fff',
            marginBottom: 16,
          }}
        >
          {t('landingCtaTitle')}
        </h2>
        <p
          style={{
            color: '#94a3b8',
            fontSize: 18,
            marginBottom: 40,
            maxWidth: 550,
            margin: '0 auto 40px',
          }}
        >
          {t('landingCtaSubtitle')}
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          style={{
            padding: '18px 48px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
            color: '#0a0a0f',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: 18,
            boxShadow: '0 0 60px rgba(0,245,160,0.2)',
          }}
        >
          {t('landingCtaButton')}
        </button>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '40px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center',
          color: '#475569',
          fontSize: 14,
        }}
      >
        © {new Date().getFullYear()} {PRODUCT_NAME}. {t('landingFooter')}
      </footer>
    </div>
  );
};

export default LandingPage;
