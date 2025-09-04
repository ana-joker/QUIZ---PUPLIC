import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../context/AuthContext';
import { useTranslation } from '../App';

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const commonLinks = [
    { to: '/dashboard', label: t('dashboard') },
    { to: '/my-courses', label: t('myCourses') },
    { to: '/history', label: t('quizHistory') },
  { to: '/settings', label: t('settingsGeneral') },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: t('teacherDashboard') },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: t('adminDashboard') },
  ];

  const getLinks = () => {
    let links = [...commonLinks];
    if (user?.role === 'teacher') {
      links = [...links, ...teacherLinks];
    }
    if (user?.role === 'admin') {
      links = [...links, ...adminLinks];
    }
    return links;
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-800 text-slate-50 p-4">
      <nav>
        <ul>
          {links.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `block py-2 px-4 rounded-md transition-colors duration-200 ${
                    isActive ? 'bg-purple-600' : 'hover:bg-slate-700'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
