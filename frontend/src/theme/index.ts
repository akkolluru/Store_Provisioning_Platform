import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#a78b6b',
            light: '#c4a882',
            dark: '#8b7355',
        },
        secondary: {
            main: '#6b8a7a',
            light: '#8aab98',
            dark: '#567060',
        },
        success: {
            main: '#6b8a6b',
            light: '#8aab8a',
            dark: '#567056',
        },
        warning: {
            main: '#c4a35a',
            light: '#d4b872',
            dark: '#a88b42',
        },
        error: {
            main: '#c47060',
            light: '#d48a7a',
            dark: '#a85848',
        },
        info: {
            main: '#6b7f8a',
            light: '#8a9dab',
            dark: '#566570',
        },
        background: {
            default: '#f5f2ed',
            paper: '#ffffff',
        },
        text: {
            primary: '#2c2418',
            secondary: '#7a6e5d',
        },
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700, letterSpacing: '-0.02em', color: '#2c2418' },
        h2: { fontWeight: 700, letterSpacing: '-0.01em', color: '#2c2418' },
        h3: { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
        h4: { fontWeight: 600, letterSpacing: '-0.01em', color: '#2c2418' },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500, color: '#7a6e5d' },
        body2: { color: '#7a6e5d' },
        button: { fontWeight: 600, letterSpacing: '0.01em' },
    },
    shape: {
        borderRadius: 12,
    },
    shadows: [
        'none',
        '0 1px 2px 0 rgb(44 36 24 / 0.03)',
        '0 1px 3px 0 rgb(44 36 24 / 0.06), 0 1px 2px -1px rgb(44 36 24 / 0.06)',
        '0 4px 6px -1px rgb(44 36 24 / 0.06), 0 2px 4px -2px rgb(44 36 24 / 0.06)',
        '0 10px 15px -3px rgb(44 36 24 / 0.06), 0 4px 6px -4px rgb(44 36 24 / 0.06)',
        '0 20px 25px -5px rgb(44 36 24 / 0.08), 0 8px 10px -6px rgb(44 36 24 / 0.08)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
        '0 25px 50px -12px rgb(44 36 24 / 0.12)',
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background: '#f5f2ed',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'rgba(255, 253, 248, 0.8)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    color: '#2c2418',
                    borderBottom: '1px solid rgba(167, 139, 107, 0.12)',
                    boxShadow: '0 1px 3px 0 rgb(44 36 24 / 0.04)',
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
                    boxShadow: '0 1px 3px 0 rgb(44 36 24 / 0.08)',
                    '&:hover': {
                        boxShadow: '0 4px 12px -2px rgb(167 139 107 / 0.35)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(167, 139, 107, 0.3)',
                    '&:hover': {
                        borderColor: '#a78b6b',
                        backgroundColor: 'rgba(167, 139, 107, 0.04)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 1px 3px 0 rgb(44 36 24 / 0.05), 0 1px 2px -1px rgb(44 36 24 / 0.05)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(44, 36, 24, 0.06)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1px solid rgba(44, 36, 24, 0.06)',
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
                    borderBottom: '1px solid rgba(44, 36, 24, 0.06)',
                    padding: '14px 16px',
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: 'rgba(167, 139, 107, 0.04)',
                    color: '#6b5e4d',
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
                            borderColor: 'rgba(167, 139, 107, 0.4)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderWidth: 2,
                            borderColor: '#a78b6b',
                        },
                        '&.Mui-focused': {
                            boxShadow: '0 0 0 3px rgba(167, 139, 107, 0.1)',
                        },
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: '1px solid rgba(44, 36, 24, 0.06)',
                    background: 'rgba(255, 253, 248, 0.95)',
                    backdropFilter: 'blur(10px)',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 20,
                    boxShadow: '0 25px 50px -12px rgb(44 36 24 / 0.15)',
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
