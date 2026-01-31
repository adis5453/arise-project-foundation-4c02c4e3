'use client'

import React from 'react'
import { Box, BoxProps } from '@mui/material'
import { styled, keyframes } from '@mui/material/styles'

// Gradient shimmer animation
const gradientMove = keyframes`
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

// Typewriter cursor blink
const blink = keyframes`
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
`

interface GradientTextProps extends BoxProps {
    gradient?: string
    animated?: boolean
    fontSize?: string | number
    fontWeight?: number
}

const StyledGradientText = styled(Box)<{ gradient: string; animated: boolean }>(
    ({ gradient, animated }) => ({
        display: 'inline-block',
        background: gradient,
        backgroundSize: animated ? '200% auto' : '100% auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: animated ? `${gradientMove} 4s ease infinite` : 'none',
    })
)

export const GradientText: React.FC<GradientTextProps> = ({
    children,
    gradient = 'linear-gradient(135deg, #4997e8 0%, #6bb5ef 50%, #347bdc 100%)',
    animated = false,
    fontSize = '2rem',
    fontWeight = 700,
    ...props
}) => {
    return (
        <StyledGradientText
            component="span"
            gradient={gradient}
            animated={animated}
            sx={{ fontSize, fontWeight }}
            {...props}
        >
            {children}
        </StyledGradientText>
    )
}

// Typewriter Text Effect
interface TypewriterTextProps {
    text: string
    speed?: number
    fontSize?: string | number
    fontWeight?: number
    color?: string
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
    text,
    speed = 100,
    fontSize = '1.5rem',
    fontWeight = 500,
    color = 'inherit',
}) => {
    const [displayText, setDisplayText] = React.useState('')
    const [currentIndex, setCurrentIndex] = React.useState(0)

    React.useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayText((prev) => prev + text[currentIndex])
                setCurrentIndex((prev) => prev + 1)
            }, speed)
            return () => clearTimeout(timeout)
        }
    }, [currentIndex, text, speed])

    return (
        <Box
            component="span"
            sx={{
                fontSize,
                fontWeight,
                color,
                fontFamily: 'inherit',
            }}
        >
            {displayText}
            <Box
                component="span"
                sx={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1em',
                    backgroundColor: color === 'inherit' ? 'currentColor' : color,
                    marginLeft: '2px',
                    verticalAlign: 'middle',
                    animation: `${blink} 1s step-end infinite`,
                }}
            />
        </Box>
    )
}

// Number Ticker (counting animation)
interface NumberTickerProps {
    value: number
    duration?: number
    suffix?: string
    prefix?: string
    fontSize?: string | number
    fontWeight?: number
    gradient?: boolean
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
    value,
    duration = 2000,
    suffix = '',
    prefix = '',
    fontSize = '3rem',
    fontWeight = 800,
    gradient = true,
}) => {
    const [displayValue, setDisplayValue] = React.useState(0)
    const [hasAnimated, setHasAnimated] = React.useState(false)
    const ref = React.useRef<HTMLSpanElement>(null)

    React.useEffect(() => {
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

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            const currentValue = Math.floor(value * easeProgress)

            setDisplayValue(currentValue)

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                setDisplayValue(value)
            }
        }

        requestAnimationFrame(animate)
    }

    const content = `${prefix}${displayValue.toLocaleString()}${suffix}`

    if (gradient) {
        return (
            <GradientText ref={ref} fontSize={fontSize} fontWeight={fontWeight}>
                {content}
            </GradientText>
        )
    }

    return (
        <Box
            component="span"
            ref={ref}
            sx={{ fontSize, fontWeight, fontVariantNumeric: 'tabular-nums' }}
        >
            {content}
        </Box>
    )
}

// Shimmering Text (like AI loading)
const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`

interface ShimmerTextProps extends BoxProps {
    color?: string
    shimmerColor?: string
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
    children,
    color = '#264882',
    shimmerColor = '#6bb5ef',
    ...props
}) => {
    return (
        <Box
            component="span"
            sx={{
                background: `linear-gradient(90deg, ${color} 0%, ${shimmerColor} 50%, ${color} 100%)`,
                backgroundSize: '200% auto',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: `${shimmer} 2s linear infinite`,
            }}
            {...props}
        >
            {children}
        </Box>
    )
}

export default GradientText
