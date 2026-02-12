import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#6366f1',
            light: '#818cf8',
            dark: '#4f46e5',
        },
        secondary: {
            main: '#8b5cf6',
            light: '#a78bfa',
            dark: '#7c3aed',
        },
        success: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
        },
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
        },
        error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
        },
        info: {
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
        },
        background: {
            default: '#f4f6fb',
            paper: '#ffffff',
        },
        text: {
            primary: '#1e293b',
            secondary: '#64748b',
        },
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, letterSpacing: '-0.01em' },
        h3: { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
        h4: { fontWeight: 600, letterSpacing: '-0.01em' },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500, color: '#64748b' },
        body2: { color: '#64748b' },
        button: { fontWeight: 600, letterSpacing: '0.01em' },
    },
    shape: {
        borderRadius: 12,
    },
    shadows: [
        'none',
        '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
        '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background: '#f4f6fb',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'rgba(255, 255, 255, 0.72)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    color: '#1e293b',
                    borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 10,
                    padding: '8px 20px',
                    fontWeight: 600,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                    },
                },
                contained: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08)',
                    '&:hover': {
                        boxShadow: '0 4px 12px -2px rgb(99 102 241 / 0.4)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.04)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: 8,
                    fontSize: '0.75rem',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                    padding: '14px 16px',
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: 'rgba(99, 102, 241, 0.03)',
                    color: '#475569',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                        transition: 'all 0.2s ease',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(99, 102, 241, 0.4)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderWidth: 2,
                        },
                        '&.Mui-focused': {
                            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
                        },
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: '1px solid rgba(0, 0, 0, 0.05)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 20,
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});

export default theme;
