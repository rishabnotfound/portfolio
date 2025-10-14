import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Projects from '@/components/Projects';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import ScrollIndicator from '@/components/scroll_indicator';
import IntroAnimation from '@/components/IntroAnimation';

export default function Home() {
  return (
    <main className="relative">
      <IntroAnimation />
      <Navigation />
      <ScrollIndicator />
      <Hero />
      <About />
      <Projects />
      <Contact />
      <Footer />
    </main>
  );
}
