import {
  FaBriefcase,
  FaCalendar,
  FaChartBar,
  FaFileContract,
  FaUsers,
} from 'react-icons/fa';

export const HR_NAV_ITEMS = [
  {
    id: 'hr_jobs',
    path: '/hr-portal/jobs',
    icon: <FaBriefcase />,
    label: 'Job Postings',
    hint: 'Create and manage openings',
  },
  {
    id: 'hr_applicants',
    path: '/hr-portal/applicants',
    icon: <FaUsers />,
    label: 'Applicants',
    hint: 'Review candidate profiles',
  },
  {
    id: 'hr_interviews',
    path: '/hr-portal/interviews',
    icon: <FaCalendar />,
    label: 'Interviews',
    hint: 'Schedule and track sessions',
  },
  {
    id: 'hr_offers',
    path: '/hr-portal/offers',
    icon: <FaFileContract />,
    label: 'Offers',
    hint: 'Manage offer letters',
  },
  {
    id: 'hr_analytics',
    path: '/hr-portal/analytics',
    icon: <FaChartBar />,
    label: 'Analytics',
    hint: 'Hiring performance insights',
  },
];

export const getActiveHrNavItem = (pathname) =>
  HR_NAV_ITEMS.find((item) => pathname.startsWith(item.path));
