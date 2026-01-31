'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'

export interface ResponsiveUtils {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  isSmallMobile: boolean
  getVariant: (mobile: string, tablet: string, desktop?: string) => any
  getSpacing: (mobile: number, tablet: number | number, desktop?: number) => number
  getPadding: (mobile: number, tablet: number | number, desktop?: number) => number
  getButtonSize: () => 'small' | 'medium' | 'large'
  getGridColumns: (mobile: number, tablet: number, desktop?: number, large?: number) => { xs: number; sm: number; md: number; lg?: number }
  getFlexDirection: (mobile: string, desktop: string) => any
  getInputSize: () => 'small' | 'medium'
  getDialogFullScreen: () => boolean
  getDialogMaxWidth: () => 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  getFontSize: (mobile: number | string, tablet: number | string, desktop?: number | string) => number | string
  getIconSize: (mobile: number, tablet: number, desktop?: number) => number
}

export const useResponsive = (): ResponsiveUtils => {
  const theme = useTheme()

  // Media query breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'))

  // Responsive utility functions
  const getVariant = (mobile: string, tablet: string, desktop?: string): any => {
    if (isMobile) return mobile
    if (isTablet) return tablet
    return desktop ?? tablet
  }

  const getSpacing = (mobile: number, tablet: number, desktop?: number): number => {
    if (isMobile) return mobile
    if (isTablet) return tablet
    return desktop ?? tablet
  }

  const getPadding = (mobile: number, tablet: number, desktop?: number): number => {
    if (isMobile) return mobile
    if (isTablet) return tablet
    return desktop ?? tablet
  }

  const getButtonSize = (): 'small' | 'medium' | 'large' => {
    if (isMobile) return 'small'
    if (isTablet) return 'medium'
    return 'large'
  }

  const getGridColumns = (mobile: number, tablet: number, desktop?: number, large?: number) => {
    return {
      xs: mobile,
      sm: tablet,
      md: desktop ?? tablet,
      lg: large ?? desktop ?? tablet,
    }
  }

  const getFlexDirection = (mobile: string, desktop: string): any => {
    if (isMobile) return mobile
    if (isDesktop) return desktop
    return mobile // Default for tablet
  }

  const getInputSize = (): 'small' | 'medium' => {
    if (isMobile) return 'small'
    if (isTablet) return 'medium'
    return 'small' // Default for desktop
  }

  const getDialogFullScreen = (): boolean => {
    return isMobile
  }

  const getDialogMaxWidth = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
    if (isMobile) return 'xs'
    if (isTablet) return 'sm'
    return 'md'
  }

  const getFontSize = (mobile: number | string, tablet: number | string, desktop?: number | string): number | string => {
    if (isMobile) return mobile
    if (isTablet) return tablet
    return desktop ?? tablet
  }

  const getIconSize = (mobile: number, tablet: number, desktop?: number): number => {
    if (isMobile) return mobile
    if (isTablet) return tablet
    return desktop ?? tablet
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isSmallMobile,
    getVariant,
    getSpacing,
    getPadding,
    getButtonSize,
    getGridColumns,
    getFlexDirection,
    getInputSize,
    getDialogFullScreen,
    getDialogMaxWidth,
    getFontSize,
    getIconSize,
  }
}
