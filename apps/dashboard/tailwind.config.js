/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/dashboard/src/**/*.{html,ts}",
    "./libs/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // Custom Color Palette for Task Management System
      colors: {
        // Primary brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main primary
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        // Secondary colors
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // Main secondary
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        // Status colors for tasks
        status: {
          todo: '#6b7280',      // Gray
          progress: '#f59e0b',  // Amber
          review: '#8b5cf6',    // Purple
          done: '#10b981',      // Emerald
          blocked: '#ef4444'    // Red
        },
        // Priority colors
        priority: {
          low: '#10b981',       // Green
          medium: '#f59e0b',    // Amber
          high: '#ef4444',      // Red
          urgent: '#dc2626'     // Dark red
        },
        // Role colors
        role: {
          owner: '#7c3aed',     // Purple
          admin: '#2563eb',     // Blue
          viewer: '#059669'     // Green
        },
        // Semantic colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      
      // Custom spacing for consistent layout
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
        '144': '36rem'    // 576px
      },
      
      // Typography system
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      
      // Enhanced responsive breakpoints
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px'
      },
      
      // Box shadows for depth
      boxShadow: {
        'task-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'task-card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'modal': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'floating': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      },
      
      // Animation and transitions
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'task-drag': 'taskDrag 0.2s ease-out'
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        taskDrag: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(3deg)' }
        }
      },
      
      // Grid layouts for task management
      gridTemplateColumns: {
        'task-board': 'repeat(auto-fit, minmax(300px, 1fr))',
        'task-list': '1fr auto auto auto',
        'sidebar-main': '250px 1fr',
        'sidebar-main-mobile': '1fr'
      },
      
      // Custom border radius
      borderRadius: {
        'task': '0.5rem',
        'card': '0.75rem'
      }
    }
  },
  plugins: [
    // Add custom utilities
    function({ addUtilities }) {
      const newUtilities = {
        // Task card utilities
        '.task-card': {
          '@apply bg-white rounded-card shadow-task-card border border-gray-200 p-4 transition-all duration-200': {},
        },
        '.task-card-hover': {
          '@apply hover:shadow-task-card-hover hover:-translate-y-1': {},
        },
        
        // Status badge utilities
        '.status-badge': {
          '@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium': {},
        },
        
        // Priority indicators
        '.priority-indicator': {
          '@apply w-3 h-3 rounded-full': {},
        },
        
        // Responsive flex utilities
        '.flex-center': {
          '@apply flex items-center justify-center': {},
        },
        '.flex-between': {
          '@apply flex items-center justify-between': {},
        },
        
        // Layout utilities
        '.container-padding': {
          '@apply px-4 sm:px-6 lg:px-8': {},
        },
        '.section-spacing': {
          '@apply py-8 sm:py-12 lg:py-16': {},
        }
      }
      addUtilities(newUtilities)
    }
  ],
} 