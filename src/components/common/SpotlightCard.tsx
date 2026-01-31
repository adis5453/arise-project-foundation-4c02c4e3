'use client'

import React, { useRef, useState } from 'react'
import { Box, BoxProps } from '@mui/material'
import { styled } from '@mui/material/styles'

interface SpotlightCardProps extends BoxProps {
    spotlightColor?: string
    borderColor?: string
}

const CardContainer = styled(Box)<{ spotlightColor?: string; borderColor?: string }>(
    ({ spotlightColor = 'rgba(73, 151, 232, 0.15)', borderColor = 'rgba(73, 151, 232, 0.2)' }) => ({
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 254, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        border: `1px solid ${borderColor}`,
        padding: 24,
        overflow: 'hidden',
        transition: 'all 0.3s ease',

        '&:hover': {
            borderColor: 'rgba(107, 181, 239, 0.5)',
            boxShadow: '0 20px 40px rgba(73, 151, 232, 0.15)',
            transform: 'translateY(-2px)',
        },
    })
)

const Spotlight = styled(Box)<{ x: number; y: number; visible: boolean; spotlightColor: string }>(
    ({ x, y, visible, spotlightColor }) => ({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        background: `radial-gradient(600px circle at ${x}px ${y}px, ${spotlightColor}, transparent 40%)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
    })
)

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
    children,
    spotlightColor = 'rgba(73, 151, 232, 0.15)',
    borderColor,
    ...props
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }

    return (
        <CardContainer
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            borderColor={borderColor}
            {...props}
        >
            <Spotlight
                x={position.x}
                y={position.y}
                visible={isHovered}
                spotlightColor={spotlightColor}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
        </CardContainer>
    )
}

// Dark variant
const DarkCardContainer = styled(Box)<{ spotlightColor?: string }>(
    ({ spotlightColor = 'rgba(107, 181, 239, 0.1)' }) => ({
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(27, 45, 80, 0.95) 0%, rgba(38, 72, 130, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        border: '1px solid rgba(107, 181, 239, 0.2)',
        padding: 24,
        overflow: 'hidden',
        transition: 'all 0.3s ease',

        '&:hover': {
            borderColor: 'rgba(107, 181, 239, 0.4)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-2px)',
        },
    })
)

export const DarkSpotlightCard: React.FC<SpotlightCardProps> = ({
    children,
    spotlightColor = 'rgba(107, 181, 239, 0.12)',
    ...props
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }

    return (
        <DarkCardContainer
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...props}
        >
            <Spotlight
                x={position.x}
                y={position.y}
                visible={isHovered}
                spotlightColor={spotlightColor}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
        </DarkCardContainer>
    )
}

export default SpotlightCard
