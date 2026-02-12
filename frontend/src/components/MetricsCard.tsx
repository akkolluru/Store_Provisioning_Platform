import { Card, CardContent, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface MetricsCardProps {
    title: string;
    value: number;
    icon?: ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export default function MetricsCard({ title, value, icon, color = 'primary' }: MetricsCardProps) {
    const gradientMap = {
        primary: 'linear-gradient(135deg, #a78b6b 0%, #c4a882 100%)',
        success: 'linear-gradient(135deg, #6b8a6b 0%, #8aab8a 100%)',
        warning: 'linear-gradient(135deg, #c4a35a 0%, #d4b872 100%)',
        error: 'linear-gradient(135deg, #c47060 0%, #d48a7a 100%)',
        info: 'linear-gradient(135deg, #6b7f8a 0%, #8a9dab 100%)',
    };

    const shadowMap = {
        primary: 'rgba(167, 139, 107, 0.35)',
        success: 'rgba(107, 138, 107, 0.35)',
        warning: 'rgba(196, 163, 90, 0.35)',
        error: 'rgba(196, 112, 96, 0.35)',
        info: 'rgba(107, 127, 138, 0.35)',
    };

    return (
        <Card
            sx={{
                height: '100%',
                background: gradientMap[color],
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: 'none',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 20px 25px -5px ${shadowMap[color]}, 0 8px 10px -6px ${shadowMap[color]}`,
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                    pointerEvents: 'none',
                },
            }}
        >
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography
                            variant="body2"
                            gutterBottom
                            sx={{
                                color: 'rgba(255,255,255,0.85)',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontSize: '0.75rem',
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography
                            variant="h3"
                            component="div"
                            sx={{
                                fontWeight: 700,
                                transition: 'all 0.3s ease',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {value}
                        </Typography>
                    </Box>
                    {icon && (
                        <Box
                            sx={{
                                color: 'rgba(255,255,255,0.25)',
                                fontSize: 56,
                                transition: 'all 0.3s ease',
                                '.MuiCard-root:hover &': {
                                    transform: 'scale(1.1) rotate(5deg)',
                                    color: 'rgba(255,255,255,0.35)',
                                },
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
