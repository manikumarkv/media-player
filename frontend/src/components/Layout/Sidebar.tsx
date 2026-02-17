import { NavLink } from 'react-router-dom';
import { HomeIcon, LibraryIcon, DownloadIcon, HeartIcon, HistoryIcon, QueueIcon } from '../Icons';
import './Layout.css';

export function Sidebar() {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-logo">
        <h1>Media Player</h1>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <HomeIcon size={24} />
              <span>Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/library"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <LibraryIcon size={24} />
              <span>Library</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/download"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <DownloadIcon size={24} />
              <span>Download</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav secondary">
        <ul className="nav-list">
          <li>
            <NavLink
              to="/liked"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <HeartIcon size={24} fill="currentColor" />
              <span>Liked Songs</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/history"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <HistoryIcon size={24} />
              <span>History</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/playlists"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <QueueIcon size={24} />
              <span>Playlists</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
