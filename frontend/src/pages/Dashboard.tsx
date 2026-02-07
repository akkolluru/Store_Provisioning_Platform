import { Container, Typography } from '@mui/material';

export default function Dashboard() {
    return (
        <Container maxWidth="lg">
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="body1">
                Welcome to the Store Provisioning Platform!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This page will display metrics and store statistics.
            </Typography>
        </Container>
    );
}
