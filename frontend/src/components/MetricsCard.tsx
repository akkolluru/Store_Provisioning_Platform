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
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    };

    const shadowMap = {
        primary: 'rgba(102, 126, 234, 0.4)',
        success: 'rgba(16, 185, 129, 0.4)',
        warning: 'rgba(245, 158, 11, 0.4)',
        error: 'rgba(239, 68, 68, 0.4)',
        info: 'rgba(59, 130, 246, 0.4)',
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
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
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
                                color: 'rgba(255,255,255,0.9)',
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
                                color: 'rgba(255,255,255,0.3)',
                                fontSize: 56,
                                transition: 'all 0.3s ease',
                                '.MuiCard-root:hover &': {
                                    transform: 'scale(1.1) rotate(5deg)',
                                    color: 'rgba(255,255,255,0.4)',
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
