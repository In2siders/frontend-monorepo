import * as React from 'react';
import './module.css';
import { cn } from '../lib/utils';
import { cva, VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

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
      fit: 'btn-fit',
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
  variant,
  size,
  width,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp: React.ElementType = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants };