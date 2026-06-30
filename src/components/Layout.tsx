import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[100dvh] bg-black text-white">
      <Sidebar />
      <div className="flex-1 ml-[260px] min-h-[100dvh] relative">
        {/* Ambient glow background */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 70% 20%, rgba(255,140,90,0.12) 0%, rgba(185,139,255,0.08) 30%, transparent 60%)',
            zIndex: 0,
          }}
        />
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(54,207,201,0.06) 0%, transparent 50%)',
            zIndex: 0,
          }}
        />

        <TopBar currentPath={location.pathname} />

        <main className="relative z-10 p-6 lg:p-8 pt-[88px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
