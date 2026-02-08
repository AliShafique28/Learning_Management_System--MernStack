import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  FileText,
  Award,
  MessageSquare,
  PlusCircle,
  Settings,
  BarChart3,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isInstructor = user?.role === 'instructor';

  const instructorLinks = [
    { name: 'Dashboard', path: '/instructor/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/instructor/my-courses', icon: BookOpen },
    { name: 'Create Course', path: '/instructor/create-course', icon: PlusCircle },
    // { name: 'Students', path: '/instructor/students', icon: Users },
    { name: 'Grading', path: '/instructor/grading', icon: FileText },
  ];

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Browse Courses', path: '/student/browse-courses', icon: BookOpen },
    { name: 'My Courses', path: '/student/my-courses', icon: GraduationCap },
    { name: 'Certificates', path: '/student/certificates', icon: Award },
  ];

  const links = isInstructor ? instructorLinks : studentLinks;

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary-700' : 'text-gray-500'}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}

        <hr className="my-4" />

        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            isActive('/settings')
              ? 'bg-primary-50 text-primary-700 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5 text-gray-500" />
          <span>Settings</span>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
