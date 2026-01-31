import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Paper, Stack } from '@mui/material';

interface MFAVerifyProps {
    onVerify: (token: string) => void;
    loading?: boolean;
}

export const MFAVerify = ({ onVerify, loading }: MFAVerifyProps) => {
    const [token, setToken] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (token.length === 6) {
            onVerify(token);
        }
    };

    return (
        <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" align="center" gutterBottom>Two-Factor Authentication</Typography>
            <Typography variant="body2" align="center" color="text.secondary" paragraph>
                Please enter the verification code from your authenticator app.
            </Typography>

            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        label="6-Digit Code"
                        value={token}
                        onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' } }}
                        autoFocus
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        type="submit"
                        disabled={token.length !== 6 || loading}
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                </Stack>
            </form>
        </Paper>
    );
};
