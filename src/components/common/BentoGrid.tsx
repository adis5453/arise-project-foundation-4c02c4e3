'use client'

import React from 'react'
import { Box, BoxProps } from '@mui/material'
import { styled } from '@mui/material/styles'

interface BentoGridProps extends BoxProps {
    columns?: number
    gap?: number
}

const StyledBentoGrid = styled(Box)<{ columns: number; gap: number }>(
    ({ columns, gap }) => ({
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: gap,
        '@media (max-width: 1200px)': {
            gridTemplateColumns: columns > 3 ? 'repeat(3, 1fr)' : `repeat(${columns}, 1fr)`,
        },
        '@media (max-width: 900px)': {
            gridTemplateColumns: columns > 2 ? 'repeat(2, 1fr)' : `repeat(${columns}, 1fr)`,
        },
        '@media (max-width: 600px)': {
            gridTemplateColumns: '1fr',
        },
    })
)

export const BentoGrid: React.FC<BentoGridProps> = ({
    children,
    columns = 4,
    gap = 16,
    ...props
}) => {
    return (
        <StyledBentoGrid columns={columns} gap={gap} {...props}>
            {children}
        </StyledBentoGrid>
    )
}

interface BentoItemProps extends BoxProps {
    colSpan?: number
    rowSpan?: number
    variant?: 'default' | 'featured' | 'highlight'
}

const StyledBentoItem = styled(Box)<{
    colSpan: number
    rowSpan: number
    variant: string
}>(({ colSpan, rowSpan, variant, theme }) => ({
    gridColumn: `span ${colSpan}`,
    gridRow: `span ${rowSpan}`,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

    // Background based on variant
    background:
        variant === 'featured'
            ? 'linear-gradient(135deg, rgba(73, 151, 232, 0.1) 0%, rgba(107, 181, 239, 0.05) 100%)'
            : variant === 'highlight'
                ? 'linear-gradient(135deg, #4997e8 0%, #347bdc 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 254, 0.9) 100%)',

    backdropFilter: 'blur(20px)',
    border:
        variant === 'highlight'
            ? '1px solid rgba(255, 255, 255, 0.2)'
            : '1px solid rgba(73, 151, 232, 0.15)',

    padding: 24,

    // Glow on featured items
    ...(variant === 'featured' && {
        boxShadow: '0 4px 20px rgba(73, 151, 232, 0.1)',
    }),

    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow:
            variant === 'highlight'
                ? '0 20px 40px rgba(73, 151, 232, 0.3)'
                : '0 20px 40px rgba(73, 151, 232, 0.15)',
        borderColor:
            variant === 'highlight'
                ? 'rgba(255, 255, 255, 0.3)'
                : 'rgba(107, 181, 239, 0.4)',
    },

    // Responsive adjustments
    '@media (max-width: 900px)': {
        gridColumn: colSpan > 2 ? 'span 2' : `span ${colSpan}`,
        gridRow: rowSpan > 2 ? 'span 2' : `span ${rowSpan}`,
    },
    '@media (max-width: 600px)': {
        gridColumn: 'span 1',
        gridRow: 'span 1',
    },
}))

// Gradient border effect
const GradientBorder = styled(Box)({
    position: 'absolute',
    inset: 0,
    borderRadius: 20,
    padding: 1,
    background: 'linear-gradient(135deg, #4997e8, #6bb5ef, #347bdc)',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
})

export const BentoItem: React.FC<BentoItemProps> = ({
    children,
    colSpan = 1,
    rowSpan = 1,
    variant = 'default',
    ...props
}) => {
    return (
        <StyledBentoItem
            colSpan={colSpan}
            rowSpan={rowSpan}
            variant={variant}
            sx={{
                '&:hover .gradient-border': {
                    opacity: variant !== 'highlight' ? 1 : 0,
                },
            }}
            {...props}
        >
            <GradientBorder className="gradient-border" />
            <Box sx={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</Box>
        </StyledBentoItem>
    )
}

// Feature Card for Bento Grid
export const BentoFeatureCard: React.FC<{
    icon: React.ReactNode
    title: string
    description: string
    colSpan?: number
    rowSpan?: number
}> = ({ icon, title, description, colSpan = 1, rowSpan = 1 }) => {
    return (
        <BentoItem colSpan={colSpan} rowSpan={rowSpan} variant="featured">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #4997e8 0%, #347bdc 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        mb: 2,
                    }}
                >
                    {icon}
                </Box>
                <Box
                    component="h3"
                    sx={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#264882',
                        mb: 1,
                        m: 0,
                    }}
                >
                    {title}
                </Box>
                <Box
                    component="p"
                    sx={{
                        fontSize: '0.875rem',
                        color: '#4997e8',
                        lineHeight: 1.6,
                        m: 0,
                        flex: 1,
                    }}
                >
                    {description}
                </Box>
            </Box>
        </BentoItem>
    )
}

export default BentoGrid
