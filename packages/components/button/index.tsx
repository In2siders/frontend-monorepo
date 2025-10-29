import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

function Button({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp: React.ElementType = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn('btn', className)}
      {...props}
    />
  );
}

export { Button };
