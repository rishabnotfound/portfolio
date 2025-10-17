import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Skills from '@/components/Skills';
import Projects from '@/components/Projects';
import OpenSource from '@/components/OpenSource';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import IntroAnimation from '@/components/IntroAnimation';
import ScrollZoomBlur from '@/components/ScrollZoomBlur';

export default function Home() {
  const sections = [
    { component: <Hero />, key: 'hero' },
    { component: <About />, key: 'about' },
    { component: <Skills />, key: 'skills' },
    { component: <Projects />, key: 'projects' },
    { component: <OpenSource />, key: 'opensource' },
    { component: <Contact />, key: 'contact' },
    { component: <Footer />, key: 'footer' },
  ];

  return (
    <>
      <IntroAnimation />
      <Navigation />
      <main className="relative scroll-container">
        {sections.map((section, index) => (
          <ScrollZoomBlur key={section.key} index={index} total={sections.length}>
            {section.component}
          </ScrollZoomBlur>
        ))}
      </main>
    </>
  );
}
