import { useState } from 'react';
import { Link } from 'react-router-dom';

const values = [
 { title:'Integrity', subtitle:'Do what is right', icon:'◇', text:'Act with honesty, fairness and transparency. Protect confidentiality, make ethical decisions and build trust through accountability.' },
 { title:'Responsibility', subtitle:'Own the outcome', icon:'✓', text:'Take ownership of commitments, decisions and outcomes. Follow through, meet obligations and communicate openly when plans change.' },
 { title:'Excellence', subtitle:'Keep improving', icon:'↗', text:'Pursue quality in every task. Stay open to feedback, keep learning and turn experience into continuous improvement.' },
 { title:'Pioneering', subtitle:'Explore what is possible', icon:'✳', text:'Remain curious, question assumptions and explore thoughtful new approaches to solve problems and create lasting value.' },
 { title:'Unity', subtitle:'Achieve together', icon:'◎', text:'Respect different perspectives, share knowledge generously and work collaboratively toward shared goals.' },
];
export default function CoreValues() {
 const [expanded, setExpanded] = useState('');
 return <main className="values-page">
  <header className="values-top"><Link to="/login" className="values-brand"><span className="values-mark sattva-mark" aria-hidden="true">s</span><strong>Sattva</strong></Link><Link to="/login" className="values-login">Sign in →</Link></header>
  <section className="values-hero"><span className="values-kicker">PURPOSE IN ACTION</span><h1>Progress with purpose.<br/><em>Growth through values.</em></h1><p>Sattva brings the internship journey into one clear, connected workspace — helping people align on expectations, make progress visible, learn from feedback and move forward together.</p><a className="values-hero-link" href="#values">Explore our values <span>↓</span></a></section>
  <section className="values-section" id="values"><div className="values-section-heading"><div><span className="values-kicker">THE PRINCIPLES THAT GUIDE US</span><h2>Five values. One shared direction.</h2></div><p>Select one value to explore what it means in everyday decisions and teamwork.</p></div>
   <div className="values-grid">{values.map(v => <button type="button" className={`value-card ${expanded===v.title?'value-card-active':''}`} key={v.title} onClick={()=>setExpanded(expanded===v.title?'':v.title)} aria-expanded={expanded===v.title}><span className="value-card-top"><span className="value-icon">{v.icon}</span><span className="value-select-indicator" aria-hidden="true">{expanded===v.title?'−':'+'}</span></span><span className="value-card-title">{v.title}</span><span className="value-card-subtitle">{v.subtitle}</span><span className="value-card-hint">{expanded===v.title?'Hide details':'Explore value'}</span>{expanded===v.title&&<span className="value-card-detail">{v.text}</span>}</button>)}</div>
  </section>
  <section className="values-about"><div><span className="values-kicker">ABOUT SATTVA</span><h2>A more connected internship experience.</h2></div><div className="about-copy"><p>Sattva is an internship lifecycle management application designed to bring people, processes and progress into one thoughtful workspace. It supports the journey from onboarding and goal setting to ongoing feedback, learning, leave requests and completion — helping interns, mentors and HR stay aligned at every stage.</p><p>Built around a simple idea: when expectations are clear, progress is shared and people are supported, everyone can move forward with greater confidence.</p><p className="about-tagline">Progress with purpose. Growth through values.</p></div></section>
  <footer className="values-footer"><span>Sattva · Independent Educational Project</span><span>Progress with purpose. Growth through values.</span></footer>
 </main>;
}
