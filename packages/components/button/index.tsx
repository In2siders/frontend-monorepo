import './module.css';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps} from 'class-variance-authority'

const buttonVariants = cva('btn', {
    variants: {
        variant: {
            default: '',
        },
        size: {
            default: '',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
})

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentPropsWithoutRef<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'button';

    return (
        <Comp
            data-slot="button"
            className={buttonVariants({ variant, size, className })}
            {...props}
        />
    );
}

export { Button, buttonVariants };