import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import theme from './theme';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import StoreList from './pages/StoreList';
import StoreWizard from './pages/StoreWizard';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex' }}>
          <Header onMenuClick={toggleSidebar} />
          <Sidebar open={sidebarOpen} onClose={closeSidebar} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: '100%',
            }}
          >
            <Toolbar /> {/* Spacer for fixed AppBar */}
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stores" element={<StoreList />} />
              <Route path="/stores/new" element={<StoreWizard />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
