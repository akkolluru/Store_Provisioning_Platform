import { Card, CardContent, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface MetricsCardProps {
    title: string;
    value: number;
    icon?: ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export default function MetricsCard({ title, value, icon, color = 'primary' }: MetricsCardProps) {
    const colorMap = {
        primary: '#1976d2',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#0288d1',
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" component="div" sx={{ color: colorMap[color] }}>
                            {value}
                        </Typography>
                    </Box>
                    {icon && (
                        <Box sx={{ color: colorMap[color], opacity: 0.3, fontSize: 48 }}>
                            {icon}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
