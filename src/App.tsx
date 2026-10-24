import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Demo() {
  return (
    <div className="min-h-svh bg-muted p-4">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6 bg-background p-4">
        <h1 className="text-xl font-semibold">Component demo</h1>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-muted-foreground">Button</h2>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-muted-foreground">Input + Label</h2>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-muted-foreground">Card</h2>
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Short supporting text.</CardDescription>
            </CardHeader>
            <CardContent>Card content goes here.</CardContent>
          </Card>
        </section>

        {/* Select, Form/Field, and Toast go here */}
      </div>
    </div>
  );
}
