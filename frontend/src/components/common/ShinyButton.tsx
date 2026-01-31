'use client'

import React from 'react'
import { Button, ButtonProps } from '@mui/material'
import { styled, keyframes } from '@mui/material/styles'

// Shimmer animation for shiny effect
const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(73, 151, 232, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(73, 151, 232, 0.6);
  }
`

interface ShinyButtonProps extends ButtonProps {
    shimmerColor?: string
    glowColor?: string
}

const StyledShinyButton = styled(Button)<{ shimmerColor?: string; glowColor?: string }>(
    ({ theme, shimmerColor = 'rgba(255, 255, 255, 0.3)', glowColor = 'rgba(73, 151, 232, 0.4)' }) => ({
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #4997e8 0%, #347bdc 50%, #2962c2 100%)',
        color: '#ffffff',
        fontWeight: 600,
        fontSize: '1rem',
        padding: '12px 28px',
        borderRadius: 12,
        textTransform: 'none',
        border: 'none',
        boxShadow: `0 4px 15px ${glowColor}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
            backgroundSize: '200% 100%',
            animation: `${shimmer} 3s ease-in-out infinite`,
        },

        '&:hover': {
            transform: 'translateY(-2px) scale(1.02)',
            boxShadow: `0 8px 25px ${glowColor}`,
            background: 'linear-gradient(135deg, #5ba3ec 0%, #4088e0 50%, #347bdc 100%)',
        },

        '&:active': {
            transform: 'translateY(0) scale(0.98)',
        },

        '&.Mui-disabled': {
            background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
            boxShadow: 'none',
        },
    })
)

// Glow Button variant
const StyledGlowButton = styled(Button)<{ glowColor?: string }>(
    ({ glowColor = 'rgba(73, 151, 232, 0.4)' }) => ({
        position: 'relative',
        background: 'linear-gradient(135deg, #4997e8 0%, #347bdc 100%)',
        color: '#ffffff',
        fontWeight: 600,
        fontSize: '1rem',
        padding: '12px 28px',
        borderRadius: 12,
        textTransform: 'none',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: `${glowPulse} 2s ease-in-out infinite`,
        transition: 'all 0.3s ease',

        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 0 50px ${glowColor}`,
        },
    })
)

// Outline Glow Button
const StyledOutlineGlowButton = styled(Button)(({ theme }) => ({
    position: 'relative',
    background: 'transparent',
    color: '#4997e8',
    fontWeight: 600,
    fontSize: '1rem',
    padding: '11px 27px',
    borderRadius: 12,
    textTransform: 'none',
    border: '2px solid #4997e8',
    transition: 'all 0.3s ease',

    '&::before': {
        content: '""',
        position: 'absolute',
        inset: -2,
        borderRadius: 14,
        padding: 2,
        background: 'linear-gradient(135deg, #4997e8, #6bb5ef, #347bdc)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        opacity: 0,
        transition: 'opacity 0.3s ease',
    },

    '&:hover': {
        background: 'rgba(73, 151, 232, 0.1)',
        boxShadow: '0 0 30px rgba(73, 151, 232, 0.3)',
        '&::before': {
            opacity: 1,
        },
    },
}))

export const ShinyButton: React.FC<ShinyButtonProps> = ({ children, ...props }) => {
    return <StyledShinyButton {...props}>{children}</StyledShinyButton>
}

export const GlowButton: React.FC<ButtonProps & { glowColor?: string }> = ({
    children,
    ...props
}) => {
    return <StyledGlowButton {...props}>{children}</StyledGlowButton>
}

export const OutlineGlowButton: React.FC<ButtonProps> = ({ children, ...props }) => {
    return <StyledOutlineGlowButton {...props}>{children}</StyledOutlineGlowButton>
}

export default ShinyButton
