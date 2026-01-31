'use client'

import React from 'react'
import { Box, BoxProps } from '@mui/material'
import { styled, keyframes } from '@mui/material/styles'

// Aurora gradient animation
const aurora = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

// Floating dots animation
const float = keyframes`
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-20px) translateX(10px);
  }
  50% {
    transform: translateY(-10px) translateX(-10px);
  }
  75% {
    transform: translateY(-30px) translateX(5px);
  }
`

// Grid Background
const GridContainer = styled(Box)({
    position: 'absolute',
    inset: 0,
    backgroundImage: `
    linear-gradient(rgba(73, 151, 232, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(73, 151, 232, 0.03) 1px, transparent 1px)
  `,
    backgroundSize: '50px 50px',
    maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 70%, transparent 100%)',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 70%, transparent 100%)',
})

// Dot Pattern Background
const DotContainer = styled(Box)({
    position: 'absolute',
    inset: 0,
    backgroundImage: `radial-gradient(rgba(73, 151, 232, 0.15) 1px, transparent 1px)`,
    backgroundSize: '24px 24px',
    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
})

// Aurora Background
const AuroraContainer = styled(Box)({
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(
    -45deg,
    rgba(73, 151, 232, 0.1),
    rgba(107, 181, 239, 0.1),
    rgba(52, 123, 220, 0.1),
    rgba(155, 207, 245, 0.1)
  )`,
    backgroundSize: '400% 400%',
    animation: `${aurora} 15s ease infinite`,
    filter: 'blur(100px)',
    opacity: 0.6,
})

// Gradient Orb
const GradientOrb = styled(Box)<{ delay?: number; size?: number; top?: string; left?: string }>(
    ({ delay = 0, size = 300, top = '20%', left = '50%' }) => ({
        position: 'absolute',
        width: size,
        height: size,
        top,
        left,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(73, 151, 232, 0.3) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: `${float} 8s ease-in-out infinite`,
        animationDelay: `${delay}s`,
    })
)

// Floating Particle
const Particle = styled(Box)<{ delay?: number; top?: string; left?: string }>(
    ({ delay = 0, top = '50%', left = '50%' }) => ({
        position: 'absolute',
        width: 6,
        height: 6,
        top,
        left,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4997e8 0%, #6bb5ef 100%)',
        opacity: 0.6,
        animation: `${float} 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
    })
)

interface BackgroundProps extends BoxProps {
    variant?: 'grid' | 'dots' | 'aurora' | 'orbs' | 'particles'
}

export const AnimatedBackground: React.FC<BackgroundProps> = ({
    children,
    variant = 'grid',
    ...props
}) => {
    return (
        <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100%' }} {...props}>
            {variant === 'grid' && <GridContainer />}
            {variant === 'dots' && <DotContainer />}
            {variant === 'aurora' && <AuroraContainer />}
            {variant === 'orbs' && (
                <>
                    <GradientOrb delay={0} size={400} top="20%" left="30%" />
                    <GradientOrb delay={2} size={300} top="60%" left="70%" />
                    <GradientOrb delay={4} size={350} top="80%" left="20%" />
                </>
            )}
            {variant === 'particles' && (
                <>
                    {[...Array(12)].map((_, i) => (
                        <Particle
                            key={i}
                            delay={i * 0.5}
                            top={`${Math.random() * 100}%`}
                            left={`${Math.random() * 100}%`}
                        />
                    ))}
                </>
            )}
            <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
        </Box>
    )
}

// Hero Section with Combined Effects
export const HeroBackground: React.FC<BoxProps> = ({ children, ...props }) => {
    return (
        <Box
            sx={{
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #f0f8fe 0%, #deedfb 50%, #c4e2f9 100%)',
                minHeight: '100vh',
            }}
            {...props}
        >
            <AuroraContainer />
            <GridContainer />
            <GradientOrb delay={0} size={500} top="10%" left="20%" />
            <GradientOrb delay={3} size={400} top="70%" left="80%" />
            <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
        </Box>
    )
}

// Dark Hero Background
export const DarkHeroBackground: React.FC<BoxProps> = ({ children, ...props }) => {
    return (
        <Box
            sx={{
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #1b2d50 0%, #264882 50%, #2954a4 100%)',
                minHeight: '100vh',
            }}
            {...props}
        >
            <AuroraContainer sx={{ opacity: 0.3 }} />
            <DotContainer sx={{
                backgroundImage: 'radial-gradient(rgba(107, 181, 239, 0.2) 1px, transparent 1px)'
            }} />
            <GradientOrb delay={0} size={500} top="10%" left="20%" />
            <GradientOrb delay={3} size={400} top="70%" left="80%" />
            <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
        </Box>
    )
}

export default AnimatedBackground
