import * as React from 'react';
import { cn } from '../lib/utils';
import './module.css'

const Card = ({
    className,
    ...props
}: React.ComponentPropsWithoutRef<'div'>) => {
    return (
        <div data-slot="card" className={cn("card", className)} {...props} />
    )
}

export { Card }