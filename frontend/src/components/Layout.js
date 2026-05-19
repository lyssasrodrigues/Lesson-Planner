import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styled from './Layout.module.css';

export default function Layout() {
  const navigate = useNavigate();
  return (
    <div className={styled.shell}>
      <header className={styled.header}>
        <div className={styled.headerInner}>
          <div className={styled.brand} onClick={() => navigate('/')}>
            <span className={styled.brandIcon}>📚</span>
            <span className={styled.brandName}>PlanejAula</span>
          </div>
          <nav className={styled.nav}>
            <NavLink to="/" end className={({ isActive }) => isActive ? `${styled.navLink} ${styled.active}` : styled.navLink}>
              Planos
            </NavLink>
          </nav>
          <button className={styled.ctaBtn} onClick={() => navigate('/novo')}>
            + Novo Plano
          </button>
        </div>
      </header>
      <main className={styled.main}>
        <Outlet />
      </main>
    </div>
  );
}
