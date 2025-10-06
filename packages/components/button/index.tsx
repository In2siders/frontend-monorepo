import React from 'react';
import './module.css';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority'

const buttonVariants = cva('btn', {
    variants: {
        variant: {
            default: '',
            primary: '',
            secondary: 'btn-secondary',
            accent: 'btn-accent',
            ghost: 'btn-ghost',
        },
        size: {
            default: '',
            small: 'btn-small',
            large: 'btn-large',
            icon: 'btn-icon',
        },
        width: {
            default: '',
            full: 'btn-full',
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        width: 'default',
    },
})

function Button({
    className,
    variant = 'default',
    size = 'default',
    width = 'default',
    asChild = false,
    children,
    ...props
}: any) {
    const classes = buttonVariants({ variant, size, width, className });
    
    if (asChild) {
        return React.createElement(Slot, { className: classes, ...props }, children);
    }

    return (
        <button
            data-slot="button"
            className={classes}
            {...props}
        >
            {children}
        </button>
    );
}

export { Button, buttonVariants };