import { Button } from '@repo/components/button';
import '@repo/common/style.css';

export default function ButtonShowcase() {
  return (
    <div className="container">
      <h1 className="title">Button Variants</h1>
      
      <div className="button-group">
        <h3>Default Variants</h3>
        <div className="button-group-horizontal">
          <Button variant="default">Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>

      <div className="button-group">
        <h3>Sizes</h3>
        <div className="button-group-horizontal">
          <Button variant="accent" size="small">Small</Button>
          <Button variant="accent" size="default">Default</Button>
          <Button variant="accent" size="large">Large</Button>
          <Button variant="accent" size="icon">→</Button>
        </div>
      </div>

      <div className="button-group">
        <h3>Full Width</h3>
        <Button variant="accent" width="full">Full Width Button</Button>
      </div>

      <div className="button-group">
        <h3>Interactive Examples</h3>
        <div className="button-group-horizontal">
          <Button variant="accent">Click Me</Button>
          <Button variant="secondary">Try Me</Button>
          <Button variant="ghost">Touch Me</Button>
        </div>
      </div>

      <div className="button-group">
        <h3>States</h3>
        <div className="button-group-horizontal">
          <Button variant="accent">Normal</Button>
          <Button variant="accent" disabled>Disabled</Button>
        </div>
      </div>
    </div>
  );
}