import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  BarChart3,
  FileSearch,
  Wrench,
  Search,
  Globe,
  Download,
  Github,
  Check,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useCallback, useEffect, useState } from 'react';

const GITHUB_URL = 'https://github.com/dhrod0325/claude-monitor';
const DOWNLOAD_URL =
  'https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.0/Claude.Monitor_0.1.0_aarch64.dmg';
const IS_GITHUB_PAGES = import.meta.env.VITE_GITHUB_PAGES === 'true';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function LandingPage() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  const languages = [
    { code: 'ko', label: '한국어' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '中文' },
  ];

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang);
    },
    [i18n]
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Clock,
      title: t('landing.features.realtime.title'),
      description: t('landing.features.realtime.description'),
    },
    {
      icon: BarChart3,
      title: t('landing.features.usage.title'),
      description: t('landing.features.usage.description'),
    },
    {
      icon: FileSearch,
      title: t('landing.features.analysis.title'),
      description: t('landing.features.analysis.description'),
    },
    {
      icon: Wrench,
      title: t('landing.features.tools.title'),
      description: t('landing.features.tools.description'),
    },
    {
      icon: Search,
      title: t('landing.features.search.title'),
      description: t('landing.features.search.description'),
    },
    {
      icon: Globe,
      title: t('landing.features.i18n.title'),
      description: t('landing.features.i18n.description'),
    },
  ];

  const techStack = [
    { name: 'React 18', color: 'oklch(0.7 0.15 220)' },
    { name: 'TypeScript', color: 'oklch(0.6 0.15 250)' },
    { name: 'Tailwind', color: 'oklch(0.7 0.15 190)' },
    { name: 'FastAPI', color: 'oklch(0.65 0.15 170)' },
    { name: 'Python', color: 'oklch(0.75 0.15 85)' },
    { name: 'Tauri', color: 'oklch(0.7 0.15 200)' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'backdrop-blur-lg border-b' : ''
        }`}
        style={{
          backgroundColor: scrolled ? 'oklch(0.10 0.01 240 / 0.8)' : 'transparent',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Claude Monitor" className="w-8 h-8" />
            <span className="font-semibold text-lg">{t('header.title')}</span>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {currentLang.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="flex items-center justify-between gap-2"
                  >
                    {lang.label}
                    {i18n.language === lang.code && <Check className="w-4 h-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <Github className="w-4 h-4" />
              </Button>
            </a>

            {!IS_GITHUB_PAGES && (
              <a href="/app.html">
                <Button variant="secondary" size="sm">
                  {t('landing.nav.openApp')}
                </Button>
              </a>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, oklch(0.6 0.15 250) 0%, transparent 70%)' }}
        />

        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-6"
            style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-muted-foreground)' }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--color-success)' }}
            />
            {t('landing.hero.badge')}
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            {t('landing.hero.title.prefix')}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, oklch(0.7 0.15 250) 0%, oklch(0.6 0.2 280) 100%)',
              }}
            >
              Claude
            </span>{' '}
            {t('landing.hero.title.suffix')}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            {t('landing.hero.description')}
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center">
            <a href={DOWNLOAD_URL}>
              <Button className="h-12 px-6 text-base gap-2">
                <Download className="w-5 h-5" />
                {t('landing.hero.download')}
              </Button>
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="h-12 px-6 text-base gap-2">
                <Github className="w-5 h-5" />
                {t('landing.hero.viewSource')}
              </Button>
            </a>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="flex justify-center gap-12 mt-16 pt-8 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">4+</div>
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                {t('landing.hero.stats.languages')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{t('landing.hero.stats.realtimeValue')}</div>
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                {t('landing.hero.stats.realtime')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">AI</div>
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                {t('landing.hero.stats.analysis')}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown
            className="w-6 h-6 animate-bounce"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
        </motion.div>
      </section>

      {/* Screenshot Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-xl overflow-hidden border shadow-2xl"
            style={{
              borderColor: 'var(--color-border)',
              boxShadow: '0 25px 50px -12px oklch(0 0 0 / 0.5)',
            }}
          >
            <img
              src="/screenshot/screen.png"
              alt="Claude Monitor Dashboard"
              className="w-full h-auto"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent 60%, var(--color-background) 100%)',
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span
              className="text-sm font-medium tracking-wider uppercase"
              style={{ color: 'oklch(0.6 0.15 250)' }}
            >
              {t('landing.features.label')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{t('landing.features.title')}</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-muted-foreground)' }}>
              {t('landing.features.description')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300"
                  style={{ backgroundColor: 'var(--color-secondary)' }}
                >
                  <feature.icon
                    className="w-6 h-6 transition-colors duration-300 group-hover:text-white"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6 border-y" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.6 }}
                whileHover={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-2 cursor-default"
              >
                <span className="text-2xl font-bold font-mono" style={{ color: tech.color }}>
                  {tech.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {tech.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, oklch(0.6 0.15 250) 0%, transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('landing.cta.title')}</h2>
          <p className="text-lg mb-10" style={{ color: 'var(--color-muted-foreground)' }}>
            {t('landing.cta.description')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={DOWNLOAD_URL}>
              <Button className="h-12 px-8 text-base gap-2">
                <Download className="w-5 h-5" />
                {t('landing.cta.download')}
              </Button>
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="h-12 px-8 text-base gap-2">
                <ExternalLink className="w-5 h-5" />
                {t('landing.cta.docs')}
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              GitHub
            </a>
            <a
              href={`${GITHUB_URL}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Releases
            </a>
            <a
              href={`${GITHUB_URL}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Issues
            </a>
          </div>
          <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Claude Monitor - Open Source
          </div>
        </div>
      </footer>
    </div>
  );
}
