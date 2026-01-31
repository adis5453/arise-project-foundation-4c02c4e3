'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Typography, TypographyProps } from '@mui/material'
import { styled, keyframes } from '@mui/material/styles'

interface AnimatedCounterProps extends Omit<TypographyProps, 'children'> {
    value: number
    suffix?: string
    prefix?: string
    duration?: number
    decimals?: number
    gradient?: boolean
}

const countUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const GradientTypography = styled(Typography)(({ theme }) => ({
    background: 'linear-gradient(135deg, #4997e8 0%, #347bdc 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
}))

const AnimatedTypography = styled(Typography)({
    animation: `${countUp} 0.6s ease-out`,
    fontVariantNumeric: 'tabular-nums',
})

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    suffix = '',
    prefix = '',
    duration = 1000,
    decimals = 0,
    gradient = false,
    ...props
}) => {
    const [displayValue, setDisplayValue] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        // Use Intersection Observer to trigger animation when visible
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setHasAnimated(true)
                        animateValue()
                    }
                })
            },
            { threshold: 0.1 }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [value, hasAnimated])

    const animateValue = () => {
        const startTime = performance.now()
        const startValue = 0
        const endValue = value

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            const currentValue = startValue + (endValue - startValue) * easeProgress

            setDisplayValue(currentValue)

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                setDisplayValue(endValue)
            }
        }

        requestAnimationFrame(animate)
    }

    const formattedValue = displayValue.toFixed(decimals)
    const content = `${prefix}${formattedValue}${suffix}`

    const Component = gradient ? GradientTypography : AnimatedTypography

    return (
        <Component ref={ref} {...props}>
            {content}
        </Component>
    )
}

export default AnimatedCounter
