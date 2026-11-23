import { Link } from 'react-router-dom';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import CloudOutlined from '@mui/icons-material/CloudOutlined';
import GrassRounded from '@mui/icons-material/GrassRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import SupportAgentRounded from '@mui/icons-material/SupportAgentRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import CheckRounded from '@mui/icons-material/CheckRounded';
import { useWhatsAppService } from '../hooks/useWhatsAppService';
import '../styles/LandingPage.css';

const features = [
  { icon: ChatBubbleOutlineRounded, title: 'Ask in your own words.', text: 'From a change in your crop to a question about everyday farm care, start with a simple message.' },
  { icon: PhotoCameraOutlined, title: 'Show what you are seeing.', text: 'Share a clear crop photo and some context to explore possible causes and sensible next steps.' },
  { icon: CloudOutlined, title: 'Keep an eye on the weather.', text: 'Choose daily, every-other-day or weekly forecast updates for your farm. Change your schedule whenever you need.' },
  { icon: GrassRounded, title: 'Advice with your farm in mind.', text: 'Add your crops and farm location so your questions have the context that matters.' },
  { icon: TuneRounded, title: 'Your details. Your control.', text: 'Use the farmer portal to view and edit your profile, farms and weather preferences in one place.' },
  { icon: SupportAgentRounded, title: 'People behind the technology.', text: 'Authorised staff can review conversations and take over replies when a human perspective is needed.' },
];

const questions = [
  { question: 'Do I need to download another app?', answer: 'No separate mobile app is needed. Start the conversation in WhatsApp and use your browser when you want to manage your farm details in the portal.' },
  { question: 'How do I create an account?', answer: 'Send a message to Digital Agronomist on WhatsApp. The guided conversation asks for consent and helps you add your profile and farm information. WhatsApp activation and live delivery are currently being verified.' },
  { question: 'Can a photo tell me exactly what is wrong with my crop?', answer: 'No. A photo and your description can help explore possible causes, but AI advice can be wrong and cannot confirm a diagnosis. Check consequential decisions with a qualified local agronomist and follow approved product labels.' },
  { question: 'Can I change or stop weather messages?', answer: 'Yes. Choose daily, every other day or weekly in your preferences. Send STOP in WhatsApp to disable weather notifications. Stopping notifications does not delete your account.' },
  { question: 'How do I sign in to the farmer portal?', answer: 'After registering on WhatsApp, send LOGIN to get a portal code. Open Farmer login, enter your phone number including the country code, and verify your code. Staff use a separate email and password sign-in.' },
  { question: 'What happens to my messages and photos?', answer: 'They are processed to provide the service, including through our AI and hosting providers. Authorised staff can review conversations. Read our privacy policy for details, and use the data deletion instructions to request removal of your records.' },
];

export default function LandingPage() {
  const { whatsapp, setupError } = useWhatsAppService();
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp}?text=Hi` : '';

  function WhatsAppLink({ label = 'Open WhatsApp', secondary = false }: { label?: string; secondary?: boolean }) {
    const className = `da-button ${secondary ? 'da-button-light' : 'da-button-primary'}`;
    return whatsappUrl
      ? <a className={className} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <WhatsApp aria-hidden="true" />{label}<ArrowForwardRounded aria-hidden="true" />
      </a>
      : <span className={`${className} da-button-unavailable`} role="status">
        {setupError ? 'WhatsApp link unavailable' : 'Loading WhatsApp link...'}
      </span>;
  }

  return (
    <div className="da-landing">
      <a className="da-skip" href="#main">Skip to content</a>
      <header className="da-header">
        <Link className="da-brand" to="/" aria-label="Digital Agronomist home">
          <img src="/images/digital-agronomist-mark.png" alt="" width="58" height="52" />
          <span>Digital Agronomist<small>by KROM</small></span>
        </Link>
        <nav className="da-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#questions">FAQs</a>
        </nav>
        <Link className="da-login" to="/login">Portal login <ArrowForwardRounded aria-hidden="true" /></Link>
      </header>

      <main id="main">
        <section className="da-hero da-container" aria-labelledby="hero-title">
          <div className="da-hero-copy">
            <p className="da-eyebrow"><span className="da-status-dot" /> A little guidance. A growing difference.</p>
            <h1 id="hero-title">Your farm.<br />Your questions.<br /><span>A conversation away.</span></h1>
            <p className="da-intro">Meet your digital farming companion. Ask questions, share crop photos and plan around the weather, all through WhatsApp.</p>
            <div className="da-actions">
              <WhatsAppLink />
              <a className="da-text-link" href="#how-it-works">See how it works <span aria-hidden="true">&darr;</span></a>
            </div>
            <p className="da-hero-note"><CheckRounded aria-hidden="true" /> No separate app to install. A portal when you need it.</p>
            <div className="da-launch-note" role="note">
              <strong>Early access</strong>
              <span>WhatsApp replies and scheduled delivery are being verified. You can explore the portal and contact us for help getting started.</span>
            </div>
            {setupError && <p className="da-service-error" role="alert">{setupError} Contact <a href="mailto:info@kromsystems.com">info@kromsystems.com</a>.</p>}
          </div>

          <div className="da-hero-visual">
            <div className="da-field-scene" aria-hidden="true">
              <div className="da-sun" />
              <div className="da-field da-field-back" />
              <div className="da-field da-field-front" />
              <span className="da-scene-caption">Rooted in your everyday.</span>
            </div>
            <div className="da-chat-preview" aria-label="Illustrative WhatsApp conversation">
              <div className="da-chat-heading">
                <img src="/images/digital-agronomist-mark.png" alt="" width="39" height="35" />
                <div><strong>Digital Agronomist</strong><span>Your farming companion</span></div>
                <ChatBubbleOutlineRounded aria-hidden="true" />
              </div>
              <div className="da-chat-body">
                <p className="da-chat-sent">Some of my tomato leaves are turning yellow. What should I look for?</p>
                <p className="da-chat-received">Let&apos;s take a closer look. Is it affecting the older leaves or the new growth? Share a clear photo and tell me about recent watering.</p>
                <div className="da-photo-message"><PhotoCameraOutlined aria-hidden="true" /><span>A photo adds context.<small>Your observations matter, too.</small></span></div>
              </div>
              <p className="da-example-label">Illustrative conversation, not a crop diagnosis.</p>
            </div>
            <div className="da-weather-tag"><CloudOutlined aria-hidden="true" /><div>Weather, your way.<span>Daily &middot; Every other day &middot; Weekly</span></div></div>
          </div>
        </section>

        <div className="da-value-strip" aria-label="Product highlights">
          <span><WhatsApp aria-hidden="true" /> WhatsApp-first</span>
          <span><PhotoCameraOutlined aria-hidden="true" /> Photo-friendly</span>
          <span><CloudOutlined aria-hidden="true" /> Farm-based forecasts</span>
          <span><TuneRounded aria-hidden="true" /> You stay in control</span>
        </div>

        <section className="da-section da-container" id="how-it-works" aria-labelledby="how-title">
          <div className="da-section-heading">
            <p className="da-eyebrow">From a first hello to your next growing season</p>
            <h2 id="how-title">Less figuring out the technology.<br />More focusing on your farm.</h2>
            <p>You bring the local knowledge. Digital Agronomist helps you explore what to do next.</p>
          </div>
          <ol className="da-steps">
            <li><span>01</span><h3>Say hello on WhatsApp.</h3><p>Start a conversation, review consent and create your farmer profile. No lengthy form to begin.</p></li>
            <li><span>02</span><h3>Tell us about your farm.</h3><p>Add your location and crops. Ask a question or share a photo of what you are noticing.</p></li>
            <li><span>03</span><h3>Keep the conversation growing.</h3><p>Explore guidance, choose weather updates and keep your farm details current in the portal.</p></li>
          </ol>
        </section>

        <section className="da-feature-section" id="features" aria-labelledby="features-title">
          <div className="da-container da-section">
            <div className="da-section-heading">
              <p className="da-eyebrow">Practical support, connected</p>
              <h2 id="features-title">A useful companion.<br />Not another complicated tool.</h2>
              <p>For the question in front of you today, and the farm you are building for tomorrow.</p>
            </div>
            <div className="da-feature-grid">
              {features.map(({ icon: Icon, title, text }) => <article className="da-feature" key={title}>
                <span className="da-feature-icon"><Icon aria-hidden="true" /></span>
                <h3>{title}</h3><p>{text}</p>
              </article>)}
            </div>
          </div>
        </section>

        <section className="da-portal-section da-container da-section" aria-labelledby="portal-title">
          <div className="da-portal-preview" aria-label="Illustrative farmer portal overview">
            <div className="da-preview-top"><span><GrassRounded aria-hidden="true" /> My farm space</span><small>Illustrative preview</small></div>
            <div className="da-preview-farm"><span className="da-eyebrow">Your farm profile</span><h3>A clearer picture.<br />All in one place.</h3><div className="da-crop-tags"><span>Crops</span><span>Location</span><span>Farm details</span></div></div>
            <div className="da-preview-bottom"><CloudOutlined aria-hidden="true" /><div><strong>Your forecast schedule</strong><span>Daily / Every other day / Weekly / Off</span></div><TuneRounded aria-hidden="true" /></div>
          </div>
          <div>
            <p className="da-eyebrow">WhatsApp for the moment. The portal for the details.</p>
            <h2 id="portal-title">Your farm information,<br />within reach.</h2>
            <p className="da-body-copy">Move from a quick conversation to a bigger view. The farmer portal lets you check and update your profile, manage farm details and choose how often weather messages arrive.</p>
            <ul className="da-check-list">
              <li><CheckRounded aria-hidden="true" /> Edit your profile and farm records</li>
              <li><CheckRounded aria-hidden="true" /> Set a weather schedule that suits you</li>
              <li><CheckRounded aria-hidden="true" /> Sign in with a code sent through WhatsApp</li>
            </ul>
            <Link className="da-button da-button-outline" to="/login">Farmer portal login <ArrowForwardRounded aria-hidden="true" /></Link>
          </div>
        </section>

        <section className="da-guidance da-container" aria-label="Responsible use">
          <GrassRounded aria-hidden="true" />
          <div><h2>Helpful guidance. Your judgement comes first.</h2><p>AI can make mistakes, and forecasts can change. Photos cannot confirm a diagnosis. Check important treatment decisions with a qualified local agronomist and follow approved product labels.</p></div>
        </section>

        <section className="da-section da-container da-faq-section" id="questions" aria-labelledby="faq-title">
          <div className="da-section-heading">
            <p className="da-eyebrow">A few things you might be wondering</p>
            <h2 id="faq-title">Good questions.<br />A simple place to start.</h2>
            <p>Need something else? <a className="da-inline-link" href="mailto:info@kromsystems.com">Talk to the KROM team.</a></p>
          </div>
          <div className="da-faq-list">
            {questions.map(({ question, answer }) => <details key={question}>
              <summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p>
            </details>)}
          </div>
        </section>

        <section className="da-final-cta da-container" aria-labelledby="cta-title">
          <img src="/images/digital-agronomist-mark.png" alt="" width="88" height="78" loading="lazy" />
          <p className="da-eyebrow">A new way to keep growing</p>
          <h2 id="cta-title">The next question about your farm?<br />Start with a conversation.</h2>
          <p>Explore Digital Agronomist, your farming companion by KROM.</p>
          <WhatsAppLink secondary />
          <span className="da-final-note">Early access. WhatsApp activation and delivery verification in progress.</span>
        </section>
      </main>

      <footer className="da-footer da-container">
        <div className="da-footer-top">
          <Link className="da-brand" to="/"><img src="/images/digital-agronomist-mark.png" alt="" width="48" height="43" /><span>Digital Agronomist<small>by KROM</small></span></Link>
          <p>Practical guidance. More informed farming.</p>
          <a className="da-inline-link" href="https://www.kromsystems.com" target="_blank" rel="noopener noreferrer">Meet KROM <ArrowForwardRounded aria-hidden="true" /></a>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/login">Farmer login</Link>
          <Link to="/login?mode=admin">Admin / staff login</Link>
          <a href="https://www.kromsystems.com/privacy-policy">Privacy policy</a>
          <a href="https://www.kromsystems.com/terms-of-service">Terms of service</a>
          <a href="https://www.kromsystems.com/data-deletion">Data deletion</a>
          <a href="mailto:info@kromsystems.com">Contact</a>
        </nav>
        <p className="da-copyright">&copy; {new Date().getFullYear()} KROM Systems Kenya Limited. Digital Agronomist is a KROM product.</p>
      </footer>
    </div>
  );
}
