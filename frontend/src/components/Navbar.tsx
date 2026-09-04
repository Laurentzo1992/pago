import type { GuideItem } from "../types";
import logo from "../assets/img/logo.png";

interface Props {
  guides: GuideItem[];
  onToggleSidebar: () => void;
}

export default function Navbar({ guides, onToggleSidebar }: Props) {
  return (
    <nav id="banner" className="navbar navbar-expand-md navbar-dark bg-dark py-0 sticky-top align-items-center">
      <div className="navbar-collapse collapse w-100 order-1 order-md-0 dual-collapse2">
        <ul className="navbar-nav mr-auto">
          <li className="nav-item d-flex align-items-center">
            <button className="nav-link fa fa-map text-warning btn btn-link" onClick={onToggleSidebar}>
              <span className="text-white">WebMapping</span>
            </button>
          </li>
          <li className="nav-item ml-4 pl-4" id="admin">
            <a className="nav-link" target="_blank" rel="noreferrer" href="/admin">
              <i className="fa fa-gears" />
            </a>
          </li>
          {guides.length > 0 ? (
            guides.map((guide) => (
              <li className="nav-item ml-4 pl-4" id="info" key={guide.id}>
                <a className="nav-link" target="_blank" rel="noreferrer" href={guide.url ?? "#"}>
                  <i className="fa fa-info-circle" />
                </a>
              </li>
            ))
          ) : (
            <li className="nav-item ml-4 pl-4" id="info">
              <span className="nav-link">pas de guide fourni</span>
            </li>
          )}
        </ul>
      </div>
      <div className="mx-auto order-0">
        <a className="navbar-brand ml-auto" href="#" style={{ color: "#c1bf8c" }}>
          GRAND OUAGA DATA
        </a>
      </div>
      <div>
        <img src={logo} width="auto" height="50px" alt="Logo pago" />
      </div>
      <div className="navbar-collapse justify-content-end align-items-center w-100 order-3 dual-collapse2" />
    </nav>
  );
}
