'use client'

import React from 'react'
import { Box, BoxProps, useTheme } from '@mui/material'
import { styled } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

interface GlassCardProps extends BoxProps {
    variant?: 'light' | 'dark'
    glow?: boolean
    hover?: boolean
    gradient?: boolean
}

const StyledGlassCard = styled(Box, {
    shouldForwardProp: (prop) =>
        !['variant', 'glow', 'hover', 'gradient'].includes(prop as string),
})<GlassCardProps>(({ theme, variant = 'light', glow, hover, gradient }) => ({
    position: 'relative',
    borderRadius: 20,
    padding: theme.spacing(3),
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',

    // Background based on variant
    background: variant === 'dark'
        ? 'linear-gradient(135deg, rgba(27, 45, 80, 0.9) 0%, rgba(38, 72, 130, 0.85) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 254, 0.9) 100%)',

    // Border
    border: `1px solid ${variant === 'dark'
            ? 'rgba(73, 151, 232, 0.2)'
            : alpha(theme.palette.primary.main, 0.15)
        }`,

    // Shadow
    boxShadow: variant === 'dark'
        ? '0 8px 32px rgba(0, 0, 0, 0.3)'
        : '0 4px 16px rgba(73, 151, 232, 0.1)',

    // Glow effect
    ...(glow && {
        '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: 2,
            background: 'linear-gradient(135deg, #4997e8 0%, #347bdc 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: 0,
            transition: 'opacity 0.3s ease',
        },
    }),

    // Gradient top border
    ...(gradient && {
        '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #4997e8 0%, #6bb5ef 50%, #347bdc 100%)',
            borderRadius: '20px 20px 0 0',
        },
    }),

    // Hover effects
    ...(hover && {
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: variant === 'dark'
                ? 'rgba(107, 181, 239, 0.4)'
                : alpha(theme.palette.primary.main, 0.3),
            boxShadow: '0 20px 40px rgba(73, 151, 232, 0.2)',
            '&::before': {
                opacity: 1,
            },
        },
    }),
}))

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    variant = 'light',
    glow = false,
    hover = true,
    gradient = false,
    ...props
}) => {
    return (
        <StyledGlassCard
            variant={variant}
            glow={glow}
            hover={hover}
            gradient={gradient}
            {...props}
        >
            {children}
        </StyledGlassCard>
    )
}

export default GlassCard
