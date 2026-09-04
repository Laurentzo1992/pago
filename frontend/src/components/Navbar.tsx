import type { GuideItem } from "../types";
import logo from "../assets/img/logo.png";

interface Props {
  guides: GuideItem[];
  onToggleSidebar: () => void;
  onToggleAnalytics: () => void;
  analyticsActive: boolean;
}

export default function Navbar({ guides, onToggleSidebar, onToggleAnalytics, analyticsActive }: Props) {
  return (
    <nav id="banner">
      <button className="pago-menu-toggle" onClick={onToggleSidebar} aria-label="Basculer le panneau de filtres">
        <i className="fas fa-bars" />
      </button>

      <a className="pago-brand" href="/">
        <span className="pago-brand-title">Grand Ouaga Data</span>
        <span className="pago-brand-subtitle">PAGO Webmapping</span>
      </a>

      <div className="pago-header-actions">
        {guides.length > 0 ? (
          guides.map((guide) => (
            <a
              className="pago-icon-link"
              target="_blank"
              rel="noreferrer"
              href={guide.url ?? "#"}
              title="Guide"
              key={guide.id}
            >
              <i className="fas fa-info-circle" />
            </a>
          ))
        ) : (
          <span className="pago-header-guide-empty">Pas de guide fourni</span>
        )}
        <button
          className={`pago-icon-link pago-icon-btn ${analyticsActive ? "active" : ""}`}
          onClick={onToggleAnalytics}
          title="Statistiques"
        >
          <i className="fas fa-chart-simple" />
        </button>
        <a className="pago-icon-link" target="_blank" rel="noreferrer" href="/admin" title="Administration">
          <i className="fas fa-gear" />
        </a>
        <img src={logo} className="pago-logo" alt="Logo PAGO" />
      </div>
    </nav>
  );
}
